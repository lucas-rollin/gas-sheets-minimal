/**
 * Tiny Google Sheets "database": one sheet per table, header row = field names.
 * Rows map to objects by header name, so code never uses column indexes.
 * Reads are one batched call; writes are serialized with a script lock.
 *
 * Setup: Project Settings > Script properties > SPREADSHEET_ID = <your sheet id>
 * (or bind the script to a spreadsheet and leave it unset).
 */

// Column order for each table. id/createdAt/updatedAt are managed automatically.
const SCHEMA = {
  tasks: ['id', 'title', 'done', 'createdAt', 'updatedAt'],
};

function dbList_(table) {
  const values = dbSheet_(table).getDataRange().getValues();
  const headers = values[0];
  return values
    .slice(1)
    .filter(function (row) { return row.some(function (c) { return c !== ''; }); })
    .map(function (row) { return dbToObject_(headers, row); });
}

function dbGet_(table, id) {
  return dbList_(table).filter(function (r) { return r.id === id; })[0] || null;
}

function dbInsert_(table, data) {
  return dbLock_(function () {
    const now = new Date().toISOString();
    const record = Object.assign({}, data, { id: Utilities.getUuid(), createdAt: now, updatedAt: now });
    dbSheet_(table).appendRow(SCHEMA[table].map(function (col) {
      return record[col] === undefined ? '' : record[col];
    }));
    return record;
  });
}

function dbUpdate_(table, id, patch) {
  return dbLock_(function () {
    const sheet = dbSheet_(table);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const idCol = headers.indexOf('id');
    for (var i = 1; i < values.length; i++) {
      if (values[i][idCol] === id) {
        const updated = Object.assign(dbToObject_(headers, values[i]), patch, {
          updatedAt: new Date().toISOString(),
        });
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([
          headers.map(function (h) { return updated[h] === undefined ? '' : updated[h]; }),
        ]);
        return updated;
      }
    }
    throw new Error(table + ': record ' + id + ' not found');
  });
}

function dbRemove_(table, id) {
  dbLock_(function () {
    const sheet = dbSheet_(table);
    const values = sheet.getDataRange().getValues();
    const idCol = values[0].indexOf('id');
    for (var i = 1; i < values.length; i++) {
      if (values[i][idCol] === id) {
        sheet.deleteRow(i + 1);
        return;
      }
    }
    throw new Error(table + ': record ' + id + ' not found');
  });
}

// ---- internals ----------------------------------------------------------

/** Returns the sheet for a table, creating it with its header row on first use. */
function dbSheet_(table) {
  if (!SCHEMA[table]) throw new Error('Unknown table "' + table + '". Add it to SCHEMA.');
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Set the SPREADSHEET_ID script property.');
  var sheet = ss.getSheetByName(table);
  if (!sheet) {
    sheet = ss.insertSheet(table);
    sheet.getRange(1, 1, 1, SCHEMA[table].length).setValues([SCHEMA[table]]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Sheets auto-converts ISO strings to Dates; convert them back so JSON stays clean. */
function dbToObject_(headers, row) {
  const obj = {};
  headers.forEach(function (h, i) {
    obj[h] = row[i] instanceof Date ? row[i].toISOString() : row[i];
  });
  return obj;
}

function dbLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
