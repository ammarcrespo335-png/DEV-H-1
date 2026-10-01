# Connect the DEV-H form to Google Sheets (5 minutes)

1. Create a new Google Sheet (name it "DEV-H Requests").
2. Open **Extensions > Apps Script**. Delete the default code and paste all of `Code.gs`.
3. Change `SECRET` to any random text. Optionally set `NOTIFY_EMAIL` to get an email per request.
4. Click **Deploy > New deployment**. Type: **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize when asked (Advanced > Go to project), then copy the **Web app URL**.
6. Open that URL in a browser. You should see `{"ok":true,"service":"DEV-H requests endpoint"}`.
7. In `script.js` set:
   ```js
   const FORM_ENDPOINT = 'PASTE_WEB_APP_URL_HERE';
   const FORM_SECRET   = 'same text you used for SECRET';
   ```
8. Submit the form on your site. A "Requests" tab appears with the header row and your entry.

## If you edit Code.gs later
Deploy > Manage deployments > Edit (pencil) > Version: **New version** > Deploy.
The URL stays the same. Without a new version, the live endpoint keeps running the old code.

## Notes
- The secret sits in public JavaScript, so it only stops casual spam. The honeypot field and server-side checks handle the rest.
- Do not use the "Anyone with Google account" access option. It breaks the public form.
