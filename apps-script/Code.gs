/**
 * Google Apps Script — FinApp CRUD + Bootstrap Web App
 *
 * Deploy as: Execute as "Me", Access "Anyone"
 *
 * Sheet layout (one tab per resource, row 1 = headers):
 *   SalaryCycles  : id | startDay | salary | createdAt | updatedAt
 *   Categories    : id | name | type | createdAt | updatedAt
 *   Budgets       : id | categoryId | cycleStart | amount | createdAt | updatedAt
 *   Transactions  : id | categoryId | cycleStart | amount | date | notes | createdAt | updatedAt
 */

var CACHE_KEY = "finapp_bootstrap_v1";
var CACHE_TTL  = 21600; // 6 hours (Apps Script CacheService max)

// ── Entry points ──────────────────────────────────────────────────────────────

function doGet(e) {
  return handleRequest(e.parameter);
}

function doPost(e) {
  var params;
  try { params = JSON.parse(e.postData.contents); }
  catch (_) { params = e.parameter; }
  return handleRequest(params);
}

function handleRequest(params) {
  try {
    var action = params.action;
    if (!action) return error("Missing action");

    // Bootstrap does not need a sheet param
    if (action === "bootstrap") {
      return bootstrap();
    }

    var sheet = params.sheet;
    if (!sheet) return error("Missing sheet");

    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var ws  = ss.getSheetByName(sheet);
    if (!ws) return error("Sheet '" + sheet + "' not found");

    switch (action) {
      case "getAll":   return success(getAll(ws));
      case "getById":  return success(getById(ws, params.id));
      case "create":   return success(create(ws, params));
      case "update":   return success(update(ws, params.id, params));
      case "delete":   return success(deleteRecord(ws, params.id));
      default:         return error("Unknown action: " + action);
    }
  } catch (e) {
    return error(e.message);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

function bootstrap() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEY);

  if (cached) {
    return ContentService.createTextOutput(cached)
      .setMimeType(ContentService.MimeType.JSON);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = {
    salaryCycles: "SalaryCycles",
    categories:   "Categories",
    budgets:      "Budgets",
    transactions: "Transactions"
  };

  var data = {};
  Object.keys(sheets).forEach(function(key) {
    var ws = ss.getSheetByName(sheets[key]);
    data[key] = ws ? getAll(ws) : [];
  });

  var payload = JSON.stringify({ success: true, data: data });
  try { cache.put(CACHE_KEY, payload, CACHE_TTL); } catch (_) {}

  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function invalidateCache() {
  try {
    CacheService.getScriptCache().remove(CACHE_KEY);
  } catch (_) {}
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

function getHeaders(ws) {
  return ws.getRange(1, 1, 1, ws.getLastColumn()).getValues()[0];
}

function rowToObject(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });
  return obj;
}

function findRowById(ws, id) {
  var data    = ws.getDataRange().getValues();
  var headers = data[0];
  var idCol   = headers.indexOf("id");
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) {
      return { rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

function generateId() { return Utilities.getUuid(); }
function now()         { return new Date().toISOString(); }

// ── CRUD operations ───────────────────────────────────────────────────────────

function getAll(ws) {
  var data = ws.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) { return rowToObject(headers, row); });
}

function getById(ws, id) {
  if (!id) throw new Error("Missing id");
  var headers = getHeaders(ws);
  var found   = findRowById(ws, id);
  if (!found)  throw new Error("Record not found");
  return rowToObject(headers, found.row);
}

function create(ws, params) {
  var headers = getHeaders(ws);
  var ts      = now();
  var record  = {};
  headers.forEach(function(h) {
    if      (h === "id")        record[h] = generateId();
    else if (h === "createdAt") record[h] = ts;
    else if (h === "updatedAt") record[h] = ts;
    else                        record[h] = params[h] !== undefined ? params[h] : "";
  });
  ws.appendRow(headers.map(function(h) { return record[h]; }));
  invalidateCache();
  return record;
}

function update(ws, id, params) {
  if (!id) throw new Error("Missing id");
  var headers = getHeaders(ws);
  var found   = findRowById(ws, id);
  if (!found)  throw new Error("Record not found");

  var record = rowToObject(headers, found.row);
  headers.forEach(function(h) {
    if (h === "id" || h === "createdAt") return;
    if (h === "updatedAt") { record[h] = now(); return; }
    if (params[h] !== undefined) record[h] = params[h];
  });

  var newRow = headers.map(function(h) { return record[h]; });
  ws.getRange(found.rowIndex, 1, 1, newRow.length).setValues([newRow]);
  invalidateCache();
  return record;
}

function deleteRecord(ws, id) {
  if (!id) throw new Error("Missing id");
  var found = findRowById(ws, id);
  if (!found) throw new Error("Record not found");
  ws.deleteRow(found.rowIndex);
  invalidateCache();
  return null;
}

// ── Response helpers ──────────────────────────────────────────────────────────

function success(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
