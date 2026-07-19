import type { Meta, StoryObj } from '@storybook/react'
import { OrderCard } from './OrderCard'

const meta: Meta<typeof OrderCard> = {
  title: 'Domain/OrderCard',
  component: OrderCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof OrderCard>

const baseOrder = {
  orderId: 'ORD-123',
  customerName: 'John Doe',
  items: [{ name: 'Chocolate Cake', quantity: 1, weight: 1.5 }],
  timeTarget: '06:00 PM',
  createdAt: new Date().toISOString(),
  grandTotal: 1200
}

export const New: Story = {
  args: {
    ...baseOrder,
    status: 'NEW',
    onAccept: () => alert('Accept clicked'),
  },
}

export const Accepted: Story = {
  args: {
    ...baseOrder,
    status: 'accepted',
  },
}

export const Making: Story = {
  args: {
    ...baseOrder,
    status: 'making',
    onReady: () => alert('Ready clicked'),
  },
}

export const Ready: Story = {
  args: {
    ...baseOrder,
    status: 'ready',
  },
}

export const Cancelled: Story = {
  args: {
    ...baseOrder,
    status: 'CANCELLED',
  },
}

export const Loading: Story = {
  args: {
    ...baseOrder,
    status: 'NEW',
    isLoading: true,
  },
}

export const UrgentSurprise: Story = {
  args: {
    ...baseOrder,
    status: 'NEW',
    isSurprise: true,
    priorityLevel: 'high',
    onAccept: () => {},
  },
}
