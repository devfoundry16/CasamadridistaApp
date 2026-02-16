# Supabase redirect URLs (deeplinks)

The app uses custom URL schemes so Supabase can redirect back into the app after **password reset** and **Google sign-in**.

## Required redirect URLs

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project.
2. Go to **Authentication** (left sidebar) → **URL Configuration**.
3. In **Redirect URLs** (not “Site URL”), click **Add URL** and add **one** of:
   - `casamadridistaapp://auth/callback` (for OAuth) and `casamadridistaapp://auth/reset-password` (for password reset), or
   - A single wildcard: `casamadridistaapp://**`
4. Click **Save**.

If you see **"Invalid casamadridistaapp://auth/callback"**, the redirect URL is missing or wrong: add the exact value above to **Redirect URLs** and save again.

## Password reset: "Link doesn't open the app"

1. **Add the app URL to Supabase** (see above).
   - Include `casamadridistaapp://auth/reset-password` (or `casamadridistaapp://**`).
   - Save.

2. **Request a new reset email**
   - Old emails still contain `redirect_to=http://localhost:3000` (or whatever was used before).
   - From the app, tap "Forgot password?" again and send a new reset link.
   - The new link will use `redirect_to=casamadridistaapp://auth/reset-password`.

3. **Open the link on the same device as the app**
   - Tap the link in the email **on the phone/simulator where the app is installed**.
   - The system will open the app so you can set a new password.

If the deeplink is not in the Redirect URLs list, Supabase ignores it and uses the **Site URL** (e.g. `http://localhost:3000`), so the link never opens the app.

## Google sign-in

For "Sign in with Google", the same redirect list is used. After the user signs in with Google in the browser, Supabase redirects to `casamadridistaapp://auth/callback#access_token=...&refresh_token=...`, which opens the app and completes login. Ensure `casamadridistaapp://auth/callback` (or `casamadridistaapp://**`) is in **Redirect URLs**, and that **Google** is enabled under **Authentication → Providers** in the Supabase dashboard.
