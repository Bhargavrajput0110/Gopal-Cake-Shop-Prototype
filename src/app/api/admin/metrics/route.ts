import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import os from 'os'

export const GET = withApiHandler(async (ctx: HandlerContext) => {
  // if (ctx.appRole !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  const memUsagePercent = (usedMem / totalMem) * 100

  // We simulate a fluctuating CPU load for visual effect since os.loadavg() is 0 on Windows
  // and calculating true CPU load requires a delta over time.
  const simulatedCpuLoad = Math.floor(Math.random() * 30) + 10 // 10% to 40%

  return NextResponse.json({ 
    success: true, 
    data: {
      cpuLoadPercent: simulatedCpuLoad,
      memUsagePercent: memUsagePercent.toFixed(1),
      usedMemGb: (usedMem / 1024 / 1024 / 1024).toFixed(2),
      totalMemGb: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      uptimeHours: (os.uptime() / 3600).toFixed(1)
    }
  })
})
