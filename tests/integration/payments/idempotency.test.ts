import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookProcessor } from '../../../src/services/payment/WebhookProcessor';

describe('Webhook Idempotency', () => {
  let provider: any;
  let repo: any;
  let processor: WebhookProcessor;

  beforeEach(() => {
    provider = {};
    repo = {
      getWebhookEvent: vi.fn(),
      createWebhookEvent: vi.fn(),
      getPaymentByGatewayOrderId: vi.fn(),
      updatePayment: vi.fn(),
      markWebhookProcessed: vi.fn(),
    };
    processor = new WebhookProcessor(provider, repo as any);
    vi.clearAllMocks();
  });

  it('ignores webhook if already processed and returns true safely (200 OK)', async () => {
    repo.getWebhookEvent.mockResolvedValue({ id: 'evt_1', processed: true });

    const rawBody = JSON.stringify({
      account_id: 'acc_1',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1' } } }
    });

    const result = await processor.processWebhook({ 'x-razorpay-signature': 'sig' }, rawBody, 'RAZORPAY');

    expect(result).toBe(true); // Should return true to ack the webhook
    expect(repo.createWebhookEvent).not.toHaveBeenCalled();
    expect(repo.updatePayment).not.toHaveBeenCalled();
  });
});
