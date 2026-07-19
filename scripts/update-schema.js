const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Append models at the end
if (!schema.includes('enum TransferStatus')) {
  schema += '\n\nenum TransferStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  IN_TRANSIT\n  RECEIVED\n}\n\nmodel BranchTransfer {\n  id           String         @id @default(cuid())\n  orderId      String\n  fromBranchId String\n  toBranchId   String\n  status       TransferStatus @default(PENDING)\n  requestedBy  String\n  respondedBy  String?\n  transportedBy String?\n  notes        String?\n  transferReason String?\n  createdAt    DateTime       @default(now())\n  updatedAt    DateTime       @updatedAt\n  receivedAt   DateTime?\n\n  order        Order  @relation("OrderTransfers", fields: [orderId], references: [id])\n  fromBranch   Branch @relation("OutgoingTransfers", fields: [fromBranchId], references: [id])\n  toBranch     Branch @relation("IncomingTransfers", fields: [toBranchId], references: [id])\n  actor        User   @relation("TransferRequestedBy", fields: [requestedBy], references: [id])\n  responder    User?  @relation("TransferRespondedBy", fields: [respondedBy], references: [id])\n\n  @@index([orderId])\n  @@index([fromBranchId])\n  @@index([toBranchId])\n}\n';
}

schema = schema.replace(
  '  timelineEvents  Timeline[]',
  '  timelineEvents  Timeline[]\n  requestedTransfers BranchTransfer[] @relation("TransferRequestedBy")\n  respondedTransfers BranchTransfer[] @relation("TransferRespondedBy")'
);

schema = schema.replace(
  '  ledgerEntries   LedgerEntry[] @relation("BranchLedgerEntries")',
  '  ledgerEntries   LedgerEntry[] @relation("BranchLedgerEntries")\n  outgoingTransfers BranchTransfer[] @relation("OutgoingTransfers")\n  incomingTransfers BranchTransfer[] @relation("IncomingTransfers")'
);

schema = schema.replace(
  '  timeline              Timeline[]',
  '  timeline              Timeline[]\n  transfers             BranchTransfer[] @relation("OrderTransfers")'
);

// We must also update TimelineEventType to include the new events
schema = schema.replace(
  'enum TimelineEventType {\n  STATE_TRANSITION',
  'enum TimelineEventType {\n  STATE_TRANSITION\n  TRANSFER_REQUESTED\n  TRANSFER_ACCEPTED\n  TRANSFER_REJECTED\n  TRANSFER_DISPATCHED\n  TRANSFER_RECEIVED'
);

fs.writeFileSync('prisma/schema.prisma', schema);
