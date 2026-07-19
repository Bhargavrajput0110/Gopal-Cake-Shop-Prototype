import { describe, it, expect } from 'vitest'
import { OrderStateMachine } from '@/lib/OrderStateMachine'
import { OrderTransitionMatrix } from '../matrices/OrderTransitionMatrix'

describe('OrderStateMachine (@unit)', () => {
  describe('Executable State Matrix', () => {
    OrderTransitionMatrix.forEach((testCase) => {
      const testName = `should ${testCase.expected === 'SUCCESS' ? 'allow' : 'reject'} transition from ${testCase.from} via action '${testCase.action}' by role '${testCase.role}' for delivery type '${testCase.deliveryType}'`

      it(testName, () => {
        if (testCase.expected === 'SUCCESS') {
          expect(() => {
            OrderStateMachine.validate(testCase.action, testCase.from, testCase.role, testCase.deliveryType)
          }).not.toThrow()
          
          const result = OrderStateMachine.validate(testCase.action, testCase.from, testCase.role, testCase.deliveryType)
          expect(result).toBeDefined()
          expect(result.action).toBe(testCase.action)
        } else {
          expect(() => {
            OrderStateMachine.validate(testCase.action, testCase.from, testCase.role, testCase.deliveryType)
          }).toThrowError(testCase.reason || '')
        }
      })
    })
  })
})
