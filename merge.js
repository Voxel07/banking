import fs from 'fs';

const exportSchema = JSON.parse(fs.readFileSync('pb_schema_export.json', 'utf8'));
const currentSchema = JSON.parse(fs.readFileSync('pb_schema.json', 'utf8'));

const finalSchema = [];

// Helper to merge collection
function mergeCollection(exportCol, currentCol) {
  if (!currentCol) return exportCol;

  // Add missing fields
  const missingFields = currentCol.fields.filter(cf => !exportCol.fields.some(ef => ef.name === cf.name));
  exportCol.fields.push(...missingFields);

  // For users collection, we want to ensure role values are "admin", "banker", "player"
  if (exportCol.id === '_pb_users_auth_') {
    const roleField = exportCol.fields.find(f => f.name === 'role');
    if (roleField) {
      roleField.values = ["Admin", "banker", "player"];
    }
  }

  // merge indexes
  for (const idx of currentCol.indexes || []) {
    if (!exportCol.indexes.includes(idx)) {
      exportCol.indexes.push(idx);
    }
  }

  return exportCol;
}

// Map of export collections
const exportCols = new Map(exportSchema.map(c => [c.id, c]));

// 1. users
const exportUsers = exportCols.get('_pb_users_auth_');
const currentUsers = currentSchema.find(c => c.id === '_pb_users_auth_');
if (exportUsers) {
  finalSchema.push(mergeCollection(exportUsers, currentUsers));
} else if (currentUsers) {
  finalSchema.push(currentUsers);
}

// 2. banking_events
const eventsCollection = currentSchema.find(c => c.id === 'pbc_events');
if (eventsCollection && !exportCols.has('pbc_events')) {
  finalSchema.push(eventsCollection);
}

// 3. banking_factions
const factionsExport = exportCols.get('pbc_factions');
if (factionsExport) {
  finalSchema.push(mergeCollection(factionsExport, currentSchema.find(c => c.id === 'pbc_factions')));
}

// 4. banking_names
const namesExport = exportCols.get('pbc_names');
if (namesExport) {
  finalSchema.push(mergeCollection(namesExport, currentSchema.find(c => c.id === 'pbc_names')));
}

// 5. banking_transactions
const txExport = exportCols.get('pbc_transactions');
if (txExport) {
  finalSchema.push(mergeCollection(txExport, currentSchema.find(c => c.id === 'pbc_transactions')));
}

// 6. banking_transfers
const transfersCollection = currentSchema.find(c => c.id === 'pbc_transfers');
if (transfersCollection && !exportCols.has('pbc_transfers')) {
  finalSchema.push(transfersCollection);
}

fs.writeFileSync('pb_schema.json', JSON.stringify(finalSchema, null, 2));
console.log('Merged schema written to pb_schema.json');
