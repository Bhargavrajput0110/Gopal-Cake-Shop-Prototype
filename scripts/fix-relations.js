const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

let userLines = schema.split('\nmodel Customer {')[0];
if (!userLines.includes('requestedTransfers')) {
  schema = schema.replace(
    /timelineEvents\s+Timeline\[\]/,
    'timelineEvents  Timeline[]\n  requestedTransfers BranchTransfer[] @relation("TransferRequestedBy")\n  respondedTransfers BranchTransfer[] @relation("TransferRespondedBy")'
  );
}

let branchLines = schema.split('\nmodel Order {')[0];
if (!branchLines.includes('outgoingTransfers')) {
  schema = schema.replace(
    /ledgerEntries\s+LedgerEntry\[\]\s+@relation\("BranchLedgerEntries"\)/,
    'ledgerEntries   LedgerEntry[] @relation("BranchLedgerEntries")\n  outgoingTransfers BranchTransfer[] @relation("OutgoingTransfers")\n  incomingTransfers BranchTransfer[] @relation("IncomingTransfers")'
  );
}

let orderLines = schema.split('\nmodel OrderItem {')[0];
if (!orderLines.includes('transfers BranchTransfer[]')) {
  schema = schema.replace(
    /timeline\s+Timeline\[\]/,
    'timeline              Timeline[]\n  transfers             BranchTransfer[] @relation("OrderTransfers")'
  );
}

fs.writeFileSync('prisma/schema.prisma', schema);
