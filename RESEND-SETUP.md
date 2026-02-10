# Resend setup (email verification)

You’re already logged in to Resend. Follow these steps to get verification emails working.

## 1. Create an API key

1. Open **[Resend → API Keys](https://resend.com/api-keys)**.
2. Click **“Create API Key”**.
3. Give it a name (e.g. `DesiNetwork local` or `Yellow Page dev`).
4. Choose **Sending access** (default).
5. Click **“Add”** and **copy the key** (it starts with `re_`).  
   You won’t see it again, so paste it somewhere safe.

## 2. Add the key to your backend

1. Open `backend/.env`.
2. Set your key:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (Replace with the key you copied.)
3. Save the file and restart your backend server.

## 3. Verify it works

- **Register** a new user or use **“Resend code”** on the verify-email page.
- You should get an email with a 6-digit code (and the code is also printed in the backend terminal in dev).

**See emails in Resend (dev):** In `backend/.env` set `EMAIL_DEV_TO=delivered@resend.dev`. All verification emails will go to Resend’s test inbox. Open [Resend → Emails](https://resend.com/emails) to view them (same pattern as Resend’s “hello world” example using `to: ['delivered@resend.dev']`). The OTP is still printed in your backend terminal.

**Free tier note:** Without `EMAIL_DEV_TO`, Resend may only deliver to the email you’ve verified. Use the terminal OTP or `delivered@resend.dev` to test.

## Not receiving emails?

1. **Use the code from the backend terminal**  
   Every time you register or click “Resend code”, the 6-digit OTP is printed in the terminal where the backend is running. Look for:
   ```
   ---------- Verification OTP (use this if email does not arrive) ----------
     Email: you@example.com
     Code:  123456
   ```
   Enter that code on the verify-email page. In `backend/.env`, `LOG_OTP_TO_CONSOLE=true` keeps this enabled so you can always verify without email.

2. **Receive real emails**  
   On Resend’s free tier, delivery in development is often limited to your **Resend account email** or addresses you’ve verified. Options:
   - Register using the same email as your Resend login, or  
   - In [Resend → Domains](https://resend.com/domains), add and verify your domain, then add the recipient email; or  
   - Check [Resend → Logs](https://resend.com/emails) to see if the email was sent and any bounce/error.

## Optional

- **Custom “From” address:** After verifying a domain in Resend, set in `.env`:
  ```env
  EMAIL_FROM=DesiNetwork <verify@yourdomain.com>
  ```
- **App name in emails:** Set `APP_NAME=DesiNetwork` (or your app name) in `.env` if you want it in the subject line.
