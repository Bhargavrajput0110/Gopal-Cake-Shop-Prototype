/**
 * fix_stuck_order.ts
 *
 * Finds the stuck Store Pickup order that was branch-transferred to Uma,
 * but got stuck there (transfer still ACCEPTED/IN_TRANSIT/RECEIVED but
 * order.branchId still at Uma instead of Varasiya).
 *
 * What this script does:
 *  1. Lists all stuck transfers so you can confirm the right one
 *  2. If confirmed, moves the order.branchId back to Varasiya
 *  3. Marks the BranchTransfer as RECEIVED (if not already)
 *  4. Ensures order.status = READY_FOR_PICKUP
 *
 * After running this, the Varasiya salesperson will see the order
 * with the purple "Notify Customer" button and can send the WhatsApp.
 *
 * RUN:
 *   npx tsx scratch/fix_stuck_order.ts
 *   npx tsx scratch/fix_stuck_order.ts --fix     <- actually apply the fix
 */

import { prisma } from '../src/lib/prisma';

const DRY_RUN = !process.argv.includes('--fix');

async function main() {
  console.log(DRY_RUN
    ? '🔍 DRY RUN — showing what would be fixed (pass --fix to apply)\n'
    : '⚡ LIVE FIX — applying changes now\n'
  );

  // Find all branch transfers that are NOT in their natural final state
  // i.e. order is still sitting at Uma/toBranch but transfer is RECEIVED or stuck
  const stuckTransfers = await prisma.branchTransfer.findMany({
    where: {
      order: {
        deliveryType: 'PICKUP',
        status: 'READY_FOR_PICKUP',
      },
      // Transfer should be received/completed but order may still be at wrong branch
      status: { in: ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'RECEIVED'] }
    },
    include: {
      order: {
        include: {
          customer: { select: { name: true, phone: true } },
          branch: { select: { id: true, name: true } },
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (stuckTransfers.length === 0) {
    console.log('✅ No stuck orders found. The order may already be fixed or was completed.');
    return;
  }

  console.log(`Found ${stuckTransfers.length} transfer(s) to review:\n`);

  for (const transfer of stuckTransfers) {
    const order = transfer.order;
    const isOrderAtWrongBranch = order.branchId === transfer.toBranchId;
    const transferNeedsReceiving = ['PENDING', 'ACCEPTED', 'IN_TRANSIT'].includes(transfer.status);

    console.log('──────────────────────────────────────────────────');
    console.log(`Transfer ID   : ${transfer.id}`);
    console.log(`Order Number  : ${order.orderNumber} (id: ${order.id})`);
    console.log(`Customer      : ${order.customer?.name} | ${order.customer?.phone}`);
    console.log(`Transfer Route: ${transfer.fromBranchId} → ${transfer.toBranchId}`);
    console.log(`Transfer Status: ${transfer.status}`);
    console.log(`Order.branchId: ${order.branchId} (should be: ${transfer.fromBranchId})`);
    console.log(`Order.status  : ${order.status}`);
    console.log(`Branch mismatch: ${isOrderAtWrongBranch ? '⚠️  YES — order still at wrong branch' : '✅ OK'}`);
    console.log(`Transfer needs fix: ${transferNeedsReceiving ? '⚠️  YES — not yet RECEIVED' : '✅ Already RECEIVED'}`);

    const needsFix = isOrderAtWrongBranch || transferNeedsReceiving;

    if (!needsFix) {
      console.log('✅ This transfer looks fine — order is at correct branch and transfer is RECEIVED.');
      continue;
    }

    if (DRY_RUN) {
      console.log('\n📋 Would apply:');
      if (transferNeedsReceiving) {
        console.log(`   BranchTransfer.status ${transfer.status} → RECEIVED`);
      }
      if (isOrderAtWrongBranch) {
        console.log(`   Order.branchId ${order.branchId} → ${transfer.fromBranchId}`);
      }
      console.log(`   Order.status stays: READY_FOR_PICKUP ✅`);
      console.log('\n👉 Run with --fix to apply these changes.');
    } else {
      console.log('\n⚡ Applying fix...');
      await prisma.$transaction(async (tx) => {
        // Mark transfer as RECEIVED if not already
        if (transferNeedsReceiving) {
          await tx.branchTransfer.update({
            where: { id: transfer.id },
            data: {
              status: 'RECEIVED',
              receivedAt: new Date(),
              notes: `${transfer.notes || ''}\n[MANUAL FIX ${new Date().toISOString()}]: Marked RECEIVED via fix_stuck_order script. Order moved back to original pickup branch.`.trim()
            }
          });
          console.log(`   ✅ BranchTransfer.status → RECEIVED`);
        }

        // Move order back to original pickup branch (fromBranchId = Varasiya)
        if (isOrderAtWrongBranch) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              branchId: transfer.fromBranchId,
              status: 'READY_FOR_PICKUP',
              driverId: null,
            }
          });
          console.log(`   ✅ Order.branchId → ${transfer.fromBranchId}`);
          console.log(`   ✅ Order.status → READY_FOR_PICKUP`);
        }

        // Add a timeline entry so the history is clear
        await tx.timeline.create({
          data: {
            orderId: order.id,
            action: 'branch-delivered',
            status: 'READY_FOR_PICKUP',
            nextState: 'READY_FOR_PICKUP',
            note: `[MANUAL FIX] Order moved back to ${transfer.fromBranchId} branch after stuck transfer. Varasiya salesperson should click "Notify Customer" to send WhatsApp.`,
            role: 'ADMIN',
          }
        });
        console.log(`   ✅ Timeline entry created`);

        // Audit log
        await tx.auditLog.create({
          data: {
            action: 'MANUAL_FIX_BRANCH_TRANSFER',
            reason: 'Order was stuck at Uma branch after branch transfer. Manually moved back to Varasiya for salesperson to notify customer.',
            tableName: 'Order',
            recordId: order.id,
            oldValue: { branchId: order.branchId, transferStatus: transfer.status },
            newValue: { branchId: transfer.fromBranchId, transferStatus: 'RECEIVED' }
          }
        });
      });

      console.log('\n🎉 DONE! Order is now at Varasiya branch with status READY_FOR_PICKUP.');
      console.log('📱 Next step: Varasiya salesperson should open Sales → Orders and click the purple "Notify Customer" button.');
    }
    console.log('');
  }
}

main()
  .catch(e => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
