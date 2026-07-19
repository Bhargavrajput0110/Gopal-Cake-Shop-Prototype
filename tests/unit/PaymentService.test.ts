import { describe, it, expect } from 'vitest'
import { PaymentService, PaymentGatewayProvider } from '@/services/PaymentService'

describe('PaymentService (@unit)', () => {
  describe('validateTransition', () => {
    it('should allow valid transitions', () => {
      expect(() => PaymentService.validateTransition('PENDING', 'SUCCESS')).not.toThrow()
      expect(() => PaymentService.validateTransition('PENDING', 'FAILED')).not.toThrow()
      expect(() => PaymentService.validateTransition('FAILED', 'PENDING')).not.toThrow()
    })

    it('should reject invalid transitions', () => {
      expect(() => PaymentService.validateTransition('SUCCESS', 'PENDING')).toThrowError('Invalid payment transition from SUCCESS to PENDING')
      expect(() => PaymentService.validateTransition('SUCCESS', 'FAILED')).toThrowError('Invalid payment transition from SUCCESS to FAILED')
    })
  })

  describe('selectProvider', () => {
    const mockProviders: Record<string, PaymentGatewayProvider> = {
      RAZORPAY: { processPayment: async () => ({ success: true, transactionId: '1' }), refundPayment: async () => ({ success: true }) },
      CASH: { processPayment: async () => ({ success: true, transactionId: '2' }), refundPayment: async () => ({ success: true }) }
    }

    it('should select RAZORPAY for UPI and CARD methods', () => {
      expect(PaymentService.selectProvider('UPI', mockProviders)).toBe(mockProviders['RAZORPAY'])
      expect(PaymentService.selectProvider('CARD', mockProviders)).toBe(mockProviders['RAZORPAY'])
    })

    it('should select CASH for CASH method', () => {
      expect(PaymentService.selectProvider('CASH', mockProviders)).toBe(mockProviders['CASH'])
    })

    it('should throw an error if RAZORPAY is missing for digital methods', () => {
      const incompleteProviders = { CASH: mockProviders['CASH'] }
      expect(() => PaymentService.selectProvider('UPI', incompleteProviders)).toThrowError('Razorpay provider not configured')
    })
  })
})
