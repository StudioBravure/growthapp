# Deployment Instructions

## 1. Prerequisites (Urgent)
For the application to work on Vercel, you **MUST** configure the Environment Variables. The application code now relies on a real connection to Supabase.

## 2. Setting up Vercel
1. Go to your Vercel Project Dashboard.
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following keys (copy values from your local `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g., `https://your-app.vercel.app`)

## 3. Redeploying
After saving the variables:
1. Go to **Deployments** tab.
2. Click the three dots (`...`) on the latest deployment (which likely failed or 404'd).
3. Select **Redeploy**.

## 4. Verification
- Open the app URL.
- Login/Signup should work.
- Dashboard should load (initially empty).
- Create a transaction and refresh the page. It should persist.

## Troubleshooting
- **404 Error**: Usually means Env Vars were missing during build/runtime. Add them and Redeploy.
- **Database Error**: Ensure the migrations ran (I ran them for you via MCP). Check if you can create items.
