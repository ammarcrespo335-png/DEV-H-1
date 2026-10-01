/**
 * DEV-H: receives project requests from the website and stores them in this Google Sheet.
 * Bound to the sheet via Extensions > Apps Script.
 */

const SECRET = "DEV-H012**"; // must match FORM_SECRET in script.js
const SHEET_NAME = "Requests"; // tab name (created automatically)
const NOTIFY_EMAIL = ""; // optional: your email to get an alert for each request

const HEADERS = [
  "Date",
  "Name",
  "Email",
  "Phone",
  "Service",
  "Package",
  "Message",
  "Estimate services",
  "Estimate (USD)",
  "Estimate (weeks)",
  "Status",
  "Page",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const d = JSON.parse(e.postData.contents);

    if (d.secret !== SECRET) return reply({ ok: false, error: "Unauthorized" });
    if (d.website) return reply({ ok: true }); // honeypot filled: pretend success, store nothing

    const name = clean(d.name),
      email = clean(d.email),
      phone = clean(d.phone),
      message = clean(d.message);
    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
      phone.replace(/\D/g, "").length < 7 ||
      message.length < 10
    ) {
      return reply({ ok: false, error: "Invalid data" });
    }

    const sheet = getSheet();
    sheet.appendRow([
      new Date(),
      name,
      email,
      phone,
      clean(d.service),
      clean(d.plan),
      message,
      clean(d.estimateServices),
      d.estimateTotal || "",
      d.estimateWeeks || "",
      "New",
      clean(d.page),
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "New DEV-H request from " + name,
        name +
          " <" +
          email +
          ">\n" +
          "Service: " +
          (clean(d.service) || "-") +
          "\n" +
          "Package: " +
          (clean(d.plan) || "-") +
          "\n" +
          "Estimate: " +
          (d.estimateTotal ? "$" + d.estimateTotal : "-") +
          "\n\n" +
          message,
      );
    }

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Opening the Web App URL in a browser should show this, which proves it is deployed.
function doGet() {
  return reply({ ok: true, service: "DEV-H requests endpoint" });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm");
  }
  return sheet;
}

// Stops formulas like =HYPERLINK(...) typed by a visitor from running in your sheet.
function clean(v) {
  v = String(v == null ? "" : v)
    .trim()
    .slice(0, 1500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
