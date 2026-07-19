const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Append P12 stuff
if (!schema.includes('enum LedgerEntryType')) {
  schema += '\n\nenum LedgerEntryType {\n  PAYMENT\n  REFUND\n  ADJUSTMENT\n  WAIVER\n  WRITE_OFF\n}\n\nmodel LedgerEntry {\n  id            String   @id @default(cuid())\n  orderId       String?\n  type          LedgerEntryType\n  amount        Decimal\n  currency      String   @default("INR")\n  method        PaymentMethod?\n  status        PaymentStatus\n  referenceId   String?  @unique\n  actorId       String?\n  branchId      String?\n  metadata      Json?\n  notes         String?\n  createdAt     DateTime @default(now())\n\n  order         Order?   @relation(fields: [orderId], references: [id])\n  actor         User?    @relation("ActorLedgerEntries", fields: [actorId], references: [id])\n  branch        Branch?  @relation("BranchLedgerEntries", fields: [branchId], references: [id])\n\n  @@index([orderId])\n  @@index([type])\n  @@index([branchId])\n}\n';
}

// Append P14 stuff
if (!schema.includes('enum TransferStatus')) {
  schema += '\n\nenum TransferStatus {\n  PENDING\n  ACCEPTED\n  REJECTED\n  IN_TRANSIT\n  RECEIVED\n}\n\nmodel BranchTransfer {\n  id           String         @id @default(cuid())\n  orderId      String\n  fromBranchId String\n  toBranchId   String\n  status       TransferStatus @default(PENDING)\n  requestedBy  String\n  respondedBy  String?\n  transportedBy String?\n  notes        String?\n  transferReason String?\n  createdAt    DateTime       @default(now())\n  updatedAt    DateTime       @updatedAt\n  receivedAt   DateTime?\n\n  order        Order  @relation("OrderTransfers", fields: [orderId], references: [id])\n  fromBranch   Branch @relation("OutgoingTransfers", fields: [fromBranchId], references: [id])\n  toBranch     Branch @relation("IncomingTransfers", fields: [toBranchId], references: [id])\n  actor        User   @relation("TransferRequestedBy", fields: [requestedBy], references: [id])\n  responder    User?  @relation("TransferRespondedBy", fields: [respondedBy], references: [id])\n\n  @@index([orderId])\n  @@index([fromBranchId])\n  @@index([toBranchId])\n}\n';
}

// Add P12/P14 relations to User
let userSplit = schema.split('\nmodel Customer {');
let userModel = userSplit[0];
if (!userModel.includes('ledgerEntries')) {
  userModel = userModel.replace(
    '  timelineEvents  Timeline[]',
    '  timelineEvents  Timeline[]\n  ledgerEntries   LedgerEntry[]       @relation("ActorLedgerEntries")\n  requestedTransfers BranchTransfer[] @relation("TransferRequestedBy")\n  respondedTransfers BranchTransfer[] @relation("TransferRespondedBy")'
  );
}
schema = userModel + '\nmodel Customer {' + userSplit[1];

// Add P12/P14 relations to Branch
let branchSplit = schema.split('\nmodel Order {');
let branchModel = branchSplit[0];
if (!branchModel.includes('ledgerEntries')) {
  branchModel = branchModel.replace(
    '  staff           User[]        @relation("StaffBranch")',
    '  staff           User[]        @relation("StaffBranch")\n  ledgerEntries   LedgerEntry[] @relation("BranchLedgerEntries")\n  outgoingTransfers BranchTransfer[] @relation("OutgoingTransfers")\n  incomingTransfers BranchTransfer[] @relation("IncomingTransfers")'
  );
}
schema = branchModel + '\nmodel Order {' + branchSplit[1];

// Add P12/P14 relations to Order
let orderSplit = schema.split('\nmodel OrderItem {');
let orderModel = orderSplit[0];
if (!orderModel.includes('ledgerEntries')) {
  orderModel = orderModel.replace(
    '  payments              Payment[]',
    '  payments              Payment[]\n  ledgerEntries         LedgerEntry[]\n  transfers             BranchTransfer[] @relation("OrderTransfers")'
  );
}
schema = orderModel + '\nmodel OrderItem {' + orderSplit[1];

// Update TimelineEventType for P14
schema = schema.replace(
  'enum TimelineEventType {\n  STATE_TRANSITION',
  'enum TimelineEventType {\n  STATE_TRANSITION\n  TRANSFER_REQUESTED\n  TRANSFER_ACCEPTED\n  TRANSFER_REJECTED\n  TRANSFER_DISPATCHED\n  TRANSFER_RECEIVED'
);

schema = schema.replace(
  'enum TimelineEventType {\r\n  STATE_TRANSITION',
  'enum TimelineEventType {\r\n  STATE_TRANSITION\r\n  TRANSFER_REQUESTED\r\n  TRANSFER_ACCEPTED\r\n  TRANSFER_REJECTED\r\n  TRANSFER_DISPATCHED\r\n  TRANSFER_RECEIVED'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema reconstructed!');
