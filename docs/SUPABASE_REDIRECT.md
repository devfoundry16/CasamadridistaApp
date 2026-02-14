# Supabase redirect for password reset (deeplink)

For **forgot password** to open the app when the user taps the email link, Supabase must redirect to the app's deeplink instead of a website.

## Fix: "Link doesn't open the app"

1. **Add the app URL to Supabase**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
   - Go to **Authentication** → **URL Configuration**.
   - Under **Redirect URLs**, add:
     - `casamadridistaapp://auth/reset-password`
   - Or use a wildcard: `casamadridistaapp://**`
   - Save.

2. **Request a new reset email**
   - Old emails still contain `redirect_to=http://localhost:3000` (or whatever was used before).
   - From the app, tap "Forgot password?" again and send a new reset link.
   - The new link will use `redirect_to=casamadridistaapp://auth/reset-password`.

3. **Open the link on the same device as the app**
   - Tap the link in the email **on the phone/simulator where the app is installed**.
   - The system will open the app so you can set a new password.

If the deeplink is not in the Redirect URLs list, Supabase ignores it and uses the **Site URL** (e.g. `http://localhost:3000`), so the link never opens the app.
