import { prisma } from './src/lib/prisma';
import { AnalyticsService } from './src/services/analytics/AnalyticsService';

async function run() {
  const kpis = await AnalyticsService.getKPIs({
    period: 'today'
  });
  console.log("Analytics KPIs:", kpis);
}

run().catch(console.error).finally(() => prisma.$disconnect());
