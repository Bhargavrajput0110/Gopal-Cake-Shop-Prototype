const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove duplicate lines globally for these specific fields
schema = schema.replace(/requestedTransfers BranchTransfer\[\] @relation\("TransferRequestedBy"\)\r?\n?/g, '');
schema = schema.replace(/respondedTransfers BranchTransfer\[\] @relation\("TransferRespondedBy"\)\r?\n?/g, '');
schema = schema.replace(/outgoingTransfers BranchTransfer\[\] @relation\("OutgoingTransfers"\)\r?\n?/g, '');
schema = schema.replace(/incomingTransfers BranchTransfer\[\] @relation\("IncomingTransfers"\)\r?\n?/g, '');
schema = schema.replace(/transfers             BranchTransfer\[\] @relation\("OrderTransfers"\)\r?\n?/g, '');
schema = schema.replace(/ledgerEntries   LedgerEntry\[\]       @relation\("ActorLedgerEntries"\)\r?\n?/g, '');
schema = schema.replace(/ledgerEntries   LedgerEntry\[\] @relation\("BranchLedgerEntries"\)\r?\n?/g, '');
schema = schema.replace(/ledgerEntries         LedgerEntry\[\]\r?\n?/g, '');

// Clean up duplicate enum values
schema = schema.replace(/TRANSFER_REQUESTED\r?\n?/g, '');
schema = schema.replace(/TRANSFER_ACCEPTED\r?\n?/g, '');
schema = schema.replace(/TRANSFER_REJECTED\r?\n?/g, '');
schema = schema.replace(/TRANSFER_DISPATCHED\r?\n?/g, '');
schema = schema.replace(/TRANSFER_RECEIVED\r?\n?/g, '');

// Now we add them back ONE TIME.

// Add to User
schema = schema.replace('  timelineEvents  Timeline[]', '  timelineEvents  Timeline[]\n  ledgerEntries   LedgerEntry[]       @relation("ActorLedgerEntries")\n  requestedTransfers BranchTransfer[] @relation("TransferRequestedBy")\n  respondedTransfers BranchTransfer[] @relation("TransferRespondedBy")\n');

// Add to Branch
schema = schema.replace('  staff           User[]     @relation("StaffBranch")', '  staff           User[]     @relation("StaffBranch")\n  ledgerEntries   LedgerEntry[] @relation("BranchLedgerEntries")\n  outgoingTransfers BranchTransfer[] @relation("OutgoingTransfers")\n  incomingTransfers BranchTransfer[] @relation("IncomingTransfers")\n');

// Add to Order
schema = schema.replace('  timeline              Timeline[]', '  timeline              Timeline[]\n  ledgerEntries         LedgerEntry[]\n  transfers             BranchTransfer[] @relation("OrderTransfers")\n');

// Add to TimelineEventType
schema = schema.replace('enum TimelineEventType {\n  STATE_TRANSITION', 'enum TimelineEventType {\n  STATE_TRANSITION\n  TRANSFER_REQUESTED\n  TRANSFER_ACCEPTED\n  TRANSFER_REJECTED\n  TRANSFER_DISPATCHED\n  TRANSFER_RECEIVED\n');
schema = schema.replace('enum TimelineEventType {\r\n  STATE_TRANSITION', 'enum TimelineEventType {\r\n  STATE_TRANSITION\r\n  TRANSFER_REQUESTED\r\n  TRANSFER_ACCEPTED\r\n  TRANSFER_REJECTED\r\n  TRANSFER_DISPATCHED\r\n  TRANSFER_RECEIVED\r\n');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed duplicates');
