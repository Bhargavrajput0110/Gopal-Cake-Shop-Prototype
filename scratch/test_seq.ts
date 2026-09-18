import { prisma } from '../src/lib/prisma';
import { generateSequentialOrderNumber } from '../src/lib/branches';

async function main() {
  await prisma.$transaction(async (tx) => {
    console.log("Uma next order number:", await generateSequentialOrderNumber(tx, 'uma'));
    console.log("Khanderao next order number:", await generateSequentialOrderNumber(tx, 'khanderao'));
    console.log("Warashiya next order number:", await generateSequentialOrderNumber(tx, 'varasiya'));
    console.log("Ellora Park next order number:", await generateSequentialOrderNumber(tx, 'elora'));
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
