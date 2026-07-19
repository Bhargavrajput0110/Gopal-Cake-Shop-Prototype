import type { Meta, StoryObj } from '@storybook/react'
import { CheckoutSummary } from './CheckoutSummary'

const meta: Meta<typeof CheckoutSummary> = {
  title: 'Domain/CheckoutSummary',
  component: CheckoutSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '500px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof CheckoutSummary>

export const Populated: Story = {
  args: {
    name: 'Test User',
    house: 'A-1, 14th Floor',
    area: 'Sector 5, XYZ Heights',
    city: 'Gurgaon',
    paymentMethod: 'CASH',
    subtotal: 1250
  },
}

export const MissingAddressDetails: Story = {
  args: {
    name: 'Walk-in User',
    house: '',
    area: '',
    city: 'Store Pickup',
    paymentMethod: 'CARD',
    subtotal: 500
  },
}
