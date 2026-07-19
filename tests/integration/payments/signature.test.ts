import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../../../src/services/payment/PaymentService';
import { PaymentRepository } from '../../../src/services/payment/PaymentRepository';
import { PaymentProvider, VerifySignatureParams } from '../../../src/services/payment/PaymentProvider';

class MockProvider implements PaymentProvider {
  createOrder = vi.fn();
  verifySignature = vi.fn();
  capture = vi.fn();
  refund = vi.fn();
  fetchPayment = vi.fn();
}

describe('Payment Signature Verification', () => {
  let provider: MockProvider;
  let repo: any;
  let service: PaymentService;

  beforeEach(() => {
    provider = new MockProvider();
    repo = {
      getPaymentById: vi.fn(),
      updatePayment: vi.fn(),
    };
    service = new PaymentService(provider, repo as any);
    vi.clearAllMocks();
  });

  it('rejects invalid signatures and updates payment to FAILED', async () => {
    repo.getPaymentById.mockResolvedValue({ id: 'pay_1', status: 'PENDING' });
    provider.verifySignature.mockReturnValue(false);

    await expect(
      service.verifyPayment('pay_1', 'order_1', 'pay_1', 'invalid_sig')
    ).rejects.toThrow('Invalid signature');

    expect(repo.updatePayment).toHaveBeenCalledWith('pay_1', expect.objectContaining({
      status: 'FAILED',
      failureReason: 'Signature mismatch on client verification'
    }));
  });

  it('accepts valid signatures and updates payment to SUCCESS', async () => {
    repo.getPaymentById.mockResolvedValue({ id: 'pay_1', status: 'PENDING', orderId: 'ord_1', amount: 500, method: 'RAZORPAY' });
    provider.verifySignature.mockReturnValue(true);

    vi.mock('../../../src/services/payment/adapters/LedgerAdapter', () => ({
      LedgerAdapter: { recordPayment: vi.fn() }
    }));
    vi.mock('../../../src/services/payment/adapters/TimelineAdapter', () => ({
      TimelineAdapter: { logPaymentSuccess: vi.fn() }
    }));
    vi.mock('../../../src/services/payment/adapters/NotificationAdapter', () => ({
      NotificationAdapter: { sendPaymentSuccess: vi.fn() }
    }));
    vi.mock('../../../src/lib/prisma', () => ({
      prisma: { order: { findUnique: vi.fn().mockResolvedValue({ id: 'ord_1', customerId: 'cust_1' }) } }
    }));

    await service.verifyPayment('pay_1', 'order_1', 'pay_1', 'valid_sig');

    expect(repo.updatePayment).toHaveBeenCalledWith('pay_1', expect.objectContaining({
      status: 'SUCCESS',
      gatewayPaymentId: 'pay_1'
    }));
  });
});
