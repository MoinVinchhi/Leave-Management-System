// Database helper functions for handling timestamps and common operations

export function getCurrentTimestamp() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function formatDateForSQL(date) {
  if (!date) return null;
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export function addUpdatedAtToQuery(fieldsObject) {
  return {
    ...fieldsObject,
    updated_at: getCurrentTimestamp()
  };
}

// Helper to build UPDATE SET clause with updated_at
export function buildUpdateSetClause(fields) {
  const updates = Object.keys(fields).map(key => `${key} = ?`);
  updates.push('updated_at = ?');
  return updates.join(', ');
}

// Helper to build UPDATE values array with updated_at
export function buildUpdateValues(fields) {
  const values = Object.values(fields);
  values.push(getCurrentTimestamp());
  return values;
}

export default {
  getCurrentTimestamp,
  formatDateForSQL,
  addUpdatedAtToQuery,
  buildUpdateSetClause,
  buildUpdateValues
};
