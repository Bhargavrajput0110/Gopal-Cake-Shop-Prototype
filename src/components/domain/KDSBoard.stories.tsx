import type { Meta, StoryObj } from '@storybook/react'
import { KDSBoard } from './KDSBoard'
import { OrderCard } from './OrderCard'
import React from 'react'

const meta: Meta<typeof KDSBoard> = {
  title: 'Domain/KDSBoard',
  component: KDSBoard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '600px', width: '100%', backgroundColor: '#f3f4f6' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof KDSBoard>

const mockOrders = [
  {
    id: '1',
    status: 'NEW',
    orderId: 'ORD-001',
    customerName: 'Alice',
    items: [{ name: 'Red Velvet', quantity: 1 }],
    timeTarget: '05:00 PM',
    createdAt: new Date().toISOString(),
    grandTotal: 850
  },
  {
    id: '2',
    status: 'WAITING_FOR_CHEF',
    orderId: 'ORD-002',
    customerName: 'Bob',
    items: [{ name: 'Mango Cake', quantity: 1 }],
    timeTarget: '05:30 PM',
    createdAt: new Date().toISOString(),
    grandTotal: 600,
    priorityLevel: 'high' as const
  },
  {
    id: '3',
    status: 'CHEF_ACCEPTED',
    orderId: 'ORD-003',
    customerName: 'Charlie',
    items: [{ name: 'Truffle', quantity: 2 }],
    timeTarget: '04:15 PM',
    createdAt: new Date().toISOString(),
    grandTotal: 1300
  },
  {
    id: '4',
    status: 'MAKING',
    orderId: 'ORD-004',
    customerName: 'Diana',
    items: [{ name: 'Cupcake Box', quantity: 1 }],
    timeTarget: '04:00 PM',
    createdAt: new Date().toISOString(),
    grandTotal: 400
  }
]

const renderOrderTicket = (order: any) => (
  <OrderCard 
    {...order}
    onAccept={order.status === 'NEW' || order.status === 'WAITING_FOR_CHEF' ? () => alert('Accept') : undefined}
    onReady={order.status === 'MAKING' ? () => alert('Ready') : undefined}
  />
)

export const BusyQueue: Story = {
  args: {
    orders: mockOrders,
    renderTicket: renderOrderTicket
  },
}

export const EmptyQueue: Story = {
  args: {
    orders: [],
    renderTicket: renderOrderTicket
  },
}
