import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../../../src/services/payment/PaymentService';
import { PaymentStatus } from '@prisma/client';

describe('Payment Race Condition', () => {
  let provider: any;
  let repo: any;
  let service: PaymentService;

  beforeEach(() => {
    provider = { verifySignature: vi.fn().mockReturnValue(true) };
    repo = {
      getPaymentById: vi.fn(),
      updatePayment: vi.fn(),
      getWebhookEvent: vi.fn(),
      createWebhookEvent: vi.fn().mockResolvedValue({ id: 'evt_1' }),
      getPaymentByGatewayOrderId: vi.fn(),
      markWebhookProcessed: vi.fn(),
    };
    service = new PaymentService(provider, repo);
    vi.clearAllMocks();
  });

  it('client API verify returns early if webhook already processed it to SUCCESS', async () => {
    // If webhook already processed it, the payment status in DB is SUCCESS
    repo.getPaymentById.mockResolvedValue({ id: 'pay_1', status: PaymentStatus.SUCCESS });

    const result = await service.verifyPayment('pay_1', 'order_1', 'pay_1', 'sig');

    // Should return early and not update again
    expect(result.status).toBe(PaymentStatus.SUCCESS);
    expect(repo.updatePayment).not.toHaveBeenCalled();
  });

  it('webhook processing returns early if client API already processed it to SUCCESS', async () => {
    // Webhook fetches payment, sees it is already SUCCESS
    repo.getWebhookEvent.mockResolvedValue(null);
    repo.getPaymentByGatewayOrderId.mockResolvedValue({ id: 'pay_1', status: PaymentStatus.SUCCESS });

    const rawBody = JSON.stringify({
      account_id: 'acc_1',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } }
    });

    await service.processWebhook({ 'x-razorpay-signature': 'sig' }, rawBody, 'RAZORPAY');

    // Should NOT call updatePayment again since it's already SUCCESS
    expect(repo.updatePayment).not.toHaveBeenCalled();
  });
});
