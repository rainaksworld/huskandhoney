/**
 * Husk & Honey - orders sheet receiver.
 *
 * Paste this whole file into your Google Sheet's Apps Script editor
 * (Extensions -> Apps Script), replacing anything already there.
 * Then set SECRET below to the same value as SHEET_WEBHOOK_SECRET in the
 * server's .env file, and deploy it as a web app.
 * Full steps: docs/google-sheet-setup.md
 */

var SECRET = 'PASTE-THE-SAME-SECRET-AS-THE-SERVER-HERE';
var TAB_NAME = 'Orders';
var HEADERS = [
  'Order', 'Date', 'Name', 'Email', 'Phone', 'Address', 'City', 'State',
  'Pincode', 'Items', 'Total (Rs)', 'WhatsApp opt-in', 'Note'
];

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad request' });
  }
  if (data.secret !== SECRET) return reply({ ok: false, error: 'not allowed' });

  // Two orders arriving at the same moment must not overwrite each other.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var book = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = book.getSheetByName(TAB_NAME) || book.insertSheet(TAB_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      data.order,
      data.date,
      text(data.name),
      text(data.email),
      "'" + data.phone,      // keep as text so the + and leading digits survive
      text(data.address),
      text(data.city),
      text(data.state),
      "'" + data.pincode,
      text(data.items),
      Number(data.total),
      data.whatsapp,
      text(data.note)
    ]);
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

/** Stop anything a customer typed from being read as a spreadsheet formula. */
function text(v) {
  v = v == null ? '' : String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
