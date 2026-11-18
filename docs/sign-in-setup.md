# "Continue with Google" and "Continue with Facebook" - setup

Both are optional. Until you set them up, those buttons are simply hidden
and customers still sign in by email (a password, or an emailed code).

## Google (about 10 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   sign in with any Google account (doesn't need to be a business account).
2. Top left, click the project dropdown -> **New Project**. Name it
   "Husk and Honey" -> **Create**. Wait for it to switch to that project
   (top left dropdown should show its name).
3. In the search bar at the top, type **OAuth consent screen** and open it.
   - User type: **External** -> **Create**.
   - App name: `Husk & Honey`. User support email: your email. Developer
     contact email: your email. **Save and Continue** through the next
     screens (Scopes, Test users) without changing anything -> **Back to
     Dashboard**.
   - Still on this screen, click **Publish App** so it isn't limited to a
     test-user list. Google may ask you to confirm - confirm it. (Google
     may show a "needs verification" notice for extra scopes, but this app
     only asks for name/email, which doesn't need verification.)
4. In the search bar, type **Credentials** and open it.
   - **Create Credentials -> OAuth client ID**.
   - Application type: **Web application**. Name: `Husk & Honey site`.
   - Under **Authorized redirect URIs**, click **Add URI** and paste exactly:
     ```
     https://huskandhoney.in/auth/google/callback
     ```
   - **Create**. A box pops up with a **Client ID** and **Client secret** -
     copy both.
5. On the server, in `~/huskandhoney/.env`, add:
   ```
   GOOGLE_CLIENT_ID=<the client ID>
   GOOGLE_CLIENT_SECRET=<the client secret>
   ```
6. `docker compose up -d app`. The Google button now appears on the login
   and sign-up pages.

## Facebook (about 10 minutes)

1. Go to [developers.facebook.com](https://developers.facebook.com) and log
   in with the Facebook account you want to manage this from (a personal
   account is fine - it doesn't appear to customers).
2. **My Apps** (top right) -> **Create App**.
   - Use case: **Authenticate and request data from users with Facebook
     Login** -> Next.
   - App name: `Husk & Honey`. Contact email: your email -> **Create app**
     (you may be asked to re-enter your Facebook password).
3. On the app's dashboard, find **Facebook Login** in the left sidebar (add
   it if it's not already there) -> **Settings**.
   - Under **Valid OAuth Redirect URIs**, paste exactly:
     ```
     https://huskandhoney.in/auth/facebook/callback
     ```
   - **Save changes**.
4. Left sidebar -> **App settings -> Basic**. You'll see **App ID** and
   **App secret** (click **Show** and re-enter your password for the
   secret) - copy both.
   - While here, scroll down and fill in **Privacy Policy URL**:
     `https://huskandhoney.in/privacy` and **App icon** if asked, then
     **Save changes**. Facebook requires a privacy policy URL before the
     button works for real customers.
5. Top of the dashboard, switch the app from **Development** to **Live**
   (there's a toggle near the app name). Facebook may ask you to confirm a
   few settings first - the Privacy Policy URL from step 4 covers the
   usual one.
6. On the server, in `~/huskandhoney/.env`, add:
   ```
   FACEBOOK_APP_ID=<the App ID>
   FACEBOOK_APP_SECRET=<the App secret>
   ```
7. `docker compose up -d app`. The Facebook button now appears.

A customer who signs up with Google or Facebook, and later uses the same
email with a password or emailed code (or the other way round), always
lands in the same one account - the site matches accounts by email.

If a Facebook sign-in fails with "no email on the account", that means the
visitor's Facebook account has no email address on file (some do not), or
the app isn't Live yet - email sign-in still works for them either way.
