import type { Meta, StoryObj } from '@storybook/react'
import { DriverQueueCard } from './DriverQueueCard'
import React from 'react'

const meta: Meta<typeof DriverQueueCard> = {
  title: 'Domain/DriverQueueCard',
  component: DriverQueueCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof DriverQueueCard>

const baseJob = {
  id: 'JOB-1',
  orderNumber: 'ORD-1234',
  status: 'READY_FOR_PICKUP',
  customer: { name: 'E2E Test User', phone: '9876543210' },
  formattedAddress: 'Flat 101, Main Street, Gurgaon',
  coordinates: { lat: 28.4595, lng: 77.0266 },
  items: [
    { id: '1', quantity: 1, productName: 'Chocolate Truffle', flavor: 'Eggless' },
    { id: '2', quantity: 2, productName: 'Vanilla Cupcake' }
  ],
  timeTarget: new Date(Date.now() + 45 * 60000).toISOString(), // 45 mins from now
}

export const OpenPool: Story = {
  args: {
    job: { ...baseJob, status: 'READY_FOR_PICKUP' },
    actions: (
      <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg">
        Claim Order
      </button>
    )
  },
}

export const AssignedToMe: Story = {
  args: {
    job: { ...baseJob, status: 'DRIVER_ASSIGNED' },
    actions: (
      <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">
        Mark Picked Up
      </button>
    )
  },
}

export const OnTheWay: Story = {
  args: {
    job: { 
      ...baseJob, 
      status: 'ON_THE_WAY', 
      pickedUpAt: new Date(Date.now() - 10 * 60000).toISOString(), // 10 mins ago
      notes: 'Please call when at the gate'
    },
    actions: (
      <button className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-green-600/20">
        Complete Delivery
      </button>
    )
  },
}

export const LateDelivery: Story = {
  args: {
    job: { 
      ...baseJob, 
      status: 'ON_THE_WAY',
      timeTarget: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins late
      pickedUpAt: new Date(Date.now() - 40 * 60000).toISOString(), // 40 mins ago
    },
    actions: (
      <button className="w-full bg-green-600 text-white font-bold py-3 rounded-lg shadow-green-600/20">
        Complete Delivery
      </button>
    )
  },
}
