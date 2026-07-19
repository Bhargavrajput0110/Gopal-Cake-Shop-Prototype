import type { Meta, StoryObj } from '@storybook/react'
import { ProductCard } from './ProductCard'

const meta: Meta<typeof ProductCard> = {
  title: 'Domain/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '250px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ProductCard>

const baseProduct = {
  id: 1,
  title: 'Chocolate Truffle Cake',
  category: 'Signature',
  price: '₹650',
  image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop',
}

export const Normal: Story = {
  args: {
    ...baseProduct,
  },
}

export const Discounted: Story = {
  args: {
    ...baseProduct,
    discountBadge: '10% OFF',
    originalPrice: '₹750',
  },
}

export const NewArrival: Story = {
  args: {
    ...baseProduct,
    isNew: true,
  },
}

export const SoldOut: Story = {
  args: {
    ...baseProduct,
    discountBadge: 'SOLD OUT',
  },
}
