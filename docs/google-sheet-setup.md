# Orders Google Sheet - setup

Every paid order is added as a new row in a Google Sheet. One-time setup,
about 5 minutes, no Google Cloud account needed.

1. Make up a secret: any long random string (e.g. run `openssl rand -hex 16`
   on the server). You'll paste it in two places.
2. Create a new Google Sheet (e.g. "Husk & Honey Orders").
3. In the sheet: **Extensions -> Apps Script**. Delete what's there, paste the
   whole of `docs/google-sheet-apps-script.gs`, and replace
   `PASTE-THE-SAME-SECRET-AS-THE-SERVER-HERE` with your secret. Save.
4. **Deploy -> New deployment**. Click the gear next to "Select type" ->
   **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
   Click **Deploy**, approve the permissions Google asks for (it may warn the
   app is unverified - choose Advanced -> Go to project, since it's your own
   script). Copy the **Web app URL**.
5. On the server, in `~/huskandhoney/.env`, add:
   ```
   SHEET_WEBHOOK_URL=<the web app URL>
   SHEET_WEBHOOK_SECRET=<your secret>
   ```
6. `docker compose up -d app`

"Anyone" access is safe: the script rejects any request that doesn't carry
the secret, so only this server can add rows.

If you later edit the script, use **Deploy -> Manage deployments -> Edit ->
New version** so the URL stays the same.
