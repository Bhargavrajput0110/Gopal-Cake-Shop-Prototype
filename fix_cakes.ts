import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function fixCakes() {
  const designs = await prisma.design.findMany();
  
  for (const d of designs) {
    if (d.name.toLowerCase().includes('trending partition')) {
      await prisma.design.update({
        where: { id: d.id },
        data: {
          basePrice: 1900,
          weightConfig: {
            "1.5": { price: 1900, isCustomOverride: true },
            "2": { price: 2400, isCustomOverride: true },
            "2.5": { price: 2900, isCustomOverride: true },
            "3": { price: 3400, isCustomOverride: true }
          }
        }
      });
      console.log('Fixed Trending Partition Cake');
    }
    
    if (d.name.toLowerCase().includes('family cake')) {
      await prisma.design.update({
        where: { id: d.id },
        data: {
          basePrice: 1800,
          weightConfig: {
            "1.5": { price: 1800, isCustomOverride: true },
            "2": { price: 2300, isCustomOverride: true },
            "2.5": { price: 2800, isCustomOverride: true },
            "3": { price: 3300, isCustomOverride: true }
          }
        }
      });
      console.log('Fixed Family Cake');
    }
    
    if (d.name.toLowerCase().includes('roblox cake')) {
      await prisma.design.update({
        where: { id: d.id },
        data: {
          basePrice: 1500,
          weightConfig: {
            "1": { price: 1500, isCustomOverride: true },
            "1.5": { price: 2000, isCustomOverride: true },
            "2": { price: 2500, isCustomOverride: true }
          }
        }
      });
      console.log('Fixed Roblox Cake');
    }

    if (d.name.toLowerCase().includes('defender') || d.name.toLowerCase().includes('car cake')) {
      await prisma.design.update({
        where: { id: d.id },
        data: {
          basePrice: 1100,
          weightConfig: {
            "1": { price: 1100, isCustomOverride: true },
            "1.5": { price: 1600, isCustomOverride: true },
            "2": { price: 2100, isCustomOverride: true }
          }
        }
      });
      console.log('Fixed Defender Cake');
    }
  }
}

fixCakes().then(() => console.log('Done')).catch(console.error);
