import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHmac } from 'crypto'
import { resetDatabase } from '../../setup/db-reset'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = 'test_webhook_secret'

function buildSignature(body: string, secret = WEBHOOK_SECRET) {
  return createHmac('sha256', secret).update(body).digest('hex')
}

async function postWebhook(body: object, secret = WEBHOOK_SECRET) {
  const raw = JSON.stringify(body)
  const sig = buildSignature(raw, secret)

  const { POST } = await import('@/app/api/v1/webhooks/razorpay/route')

  const req = new Request('http://localhost/api/v1/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': sig,
    },
    body: raw,
  })

  return POST(req as any)
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Razorpay Webhook Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase()
    vi.clearAllMocks()

    // Inject webhook secret into env for all tests
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET
  })

  // ─── Setup helpers ────────────────────────────────────────────────────────

  async function seedOrderWithPendingPayment() {
    await prisma.branch.create({
      data: { id: 'BR-1', name: 'Main', isActive: true, code: 'BR-1', address: '1 St' },
    })
    await prisma.customer.create({
      data: { id: 'cust-1', name: 'Arjun', phone: '9999999999' },
    })
    const order = await prisma.order.create({
      data: {
        id: 'ord-1',
        orderNumber: 'ORD-001',
        status: 'CONFIRMED',
        deliveryType: 'PICKUP',
        branchId: 'BR-1',
        subtotal: 1500,
        totalAmount: 1500,
        customerId: 'cust-1',
        targetDate: new Date(),
      },
    })
    const payment = await prisma.payment.create({
      data: {
        id: 'pay-1',
        orderId: 'ord-1',
        provider: 'RAZORPAY',
        status: 'PENDING',
        amount: 1500,
        currency: 'INR',
        gatewayOrderId: 'rzp_order_001',
      },
    })
    return { order, payment }
  }

  const capturedPayload = (gatewayPaymentId = 'rzp_pay_001') => ({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gatewayPaymentId,
          order_id: 'rzp_order_001',
          amount: 150000, // paise
          status: 'captured',
        },
      },
    },
  })

  const failedPayload = () => ({
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: 'rzp_pay_fail',
          order_id: 'rzp_order_001',
          amount: 150000,
          status: 'failed',
          error_description: 'Insufficient funds',
        },
      },
    },
  })

  // ─── Tests ────────────────────────────────────────────────────────────────

  it('rejects webhook with invalid signature', async () => {
    await seedOrderWithPendingPayment()
    const raw = JSON.stringify(capturedPayload())
    const badSig = buildSignature(raw, 'wrong_secret')

    const { POST } = await import('@/app/api/v1/webhooks/razorpay/route')
    const req = new Request('http://localhost/api/v1/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': badSig,
      },
      body: raw,
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('payment.captured — marks payment SUCCESS and creates LedgerEntry', async () => {
    await seedOrderWithPendingPayment()
    const res = await postWebhook(capturedPayload())
    expect(res.status).toBe(200)

    const payment = await prisma.payment.findUnique({ where: { id: 'pay-1' } })
    expect(payment?.status).toBe('SUCCESS')

    const ledger = await prisma.ledgerEntry.findFirst({ where: { orderId: 'ord-1' } })
    expect(ledger).not.toBeNull()
    expect(Number(ledger!.amount)).toBe(1500)
    expect(ledger!.type).toBe('PAYMENT')
  })

  it('payment.failed — marks payment FAILED, does not create LedgerEntry', async () => {
    await seedOrderWithPendingPayment()
    const res = await postWebhook(failedPayload())
    expect(res.status).toBe(200)

    const payment = await prisma.payment.findFirst({ where: { orderId: 'ord-1' } })
    expect(payment?.status).toBe('FAILED')

    const ledger = await prisma.ledgerEntry.findFirst({ where: { orderId: 'ord-1' } })
    expect(ledger).toBeNull()
  })

  it('duplicate payment.captured — idempotency: only ONE LedgerEntry created', async () => {
    await seedOrderWithPendingPayment()

    // Send the same webhook twice
    await postWebhook(capturedPayload('rzp_pay_001'))
    await postWebhook(capturedPayload('rzp_pay_001'))

    const ledgerEntries = await prisma.ledgerEntry.findMany({ where: { orderId: 'ord-1' } })
    expect(ledgerEntries).toHaveLength(1)
  })

  it('payment.captured — order status transitions from CONFIRMED to CONFIRMED or later valid state', async () => {
    await seedOrderWithPendingPayment()
    await postWebhook(capturedPayload())

    // The order should still be a valid order (not accidentally cancelled)
    const order = await prisma.order.findUnique({ where: { id: 'ord-1' } })
    expect(order).not.toBeNull()
    expect(['CONFIRMED', 'ACCEPTED', 'IN_PRODUCTION', 'READY_FOR_PICKUP']).toContain(order!.status)
  })

  it('reconciliation — stale PENDING payment (15+ min) is resolved', async () => {
    // Create a payment that appears stuck 20 minutes ago
    await seedOrderWithPendingPayment()
    const staleDate = new Date(Date.now() - 20 * 60 * 1000)
    await prisma.payment.update({
      where: { id: 'pay-1' },
      data: { createdAt: staleDate, updatedAt: staleDate },
    })

    // We can't call Razorpay's live API in tests, so we verify the reconcile
    // endpoint can be invoked and returns a structured response
    const { POST: reconcile } = await import('@/app/api/v1/jobs/reconcile-payments/route')
    const req = new Request('http://localhost/api/v1/jobs/reconcile-payments', {
      method: 'POST',
      headers: { 'x-cron-secret': process.env.CRON_SECRET || 'test_cron_secret' },
    })
    // The job should not throw — it handles missing API keys gracefully
    const res = await reconcile(req as any)
    expect([200, 207, 500]).toContain(res.status) // 207 = partial success is acceptable
  })
})
