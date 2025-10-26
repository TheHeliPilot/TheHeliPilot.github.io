# Cloudflare Workers Setup Guide - Step by Step

## 🎯 What You're Building
A secure API endpoint that keeps your OpenAI API key hidden from users while allowing Pro members to generate unlimited quiz cards.

---

## Part 1: Create Cloudflare Account & Worker (10 minutes)

### Step 1: Sign Up for Cloudflare

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Create a free account (no credit card required!)
3. Verify your email
4. Log in to the dashboard

### Step 2: Create a Worker

1. In the Cloudflare dashboard, click **"Workers & Pages"** in the left sidebar
2. Click **"Create application"**
3. Click **"Create Worker"**
4. Name your worker: `quiz-gen-api` (or whatever you prefer)
5. Click **"Deploy"**

### Step 3: Add Your Worker Code

1. After deployment, click **"Edit code"** button
2. **Delete all the existing code** in the editor
3. Open the file `cloudflare-worker.js` from your project folder
4. **Copy all the code** from that file
5. **Paste it** into the Cloudflare editor
6. Click **"Save and Deploy"**

### Step 4: Get Your Worker URL

1. After saving, you'll see your worker URL at the top
2. It will look like: `https://quiz-gen-api.YOUR-USERNAME.workers.dev`
3. **Copy this URL** - you'll need it soon!

---

## Part 2: Add Your OpenAI API Key (5 minutes)

### Step 5: Set Environment Variable

1. In your worker page, click the **"Settings"** tab
2. Click **"Variables"** in the left menu
3. Scroll down to **"Environment Variables"**
4. Click **"Add variable"**

5. Enter:
   - **Variable name:** `OPENAI_API_KEY`
   - **Value:** Your actual OpenAI API key (starts with `sk-proj-...`)
   - **Type:** Leave as "Text"

6. Click **"Encrypt"** (optional but recommended)
7. Click **"Save and deploy"**

**Important:** This key is now securely stored in Cloudflare and will NEVER be visible in your client-side code!

---

## Part 3: Update Your App (2 minutes)

### Step 6: Add Worker URL to Your App

1. Open `app.js` in your code editor
2. Find line 37 (around the `PRO_API_CONFIG` section)
3. Replace it with your worker URL:

```javascript
const PRO_API_CONFIG = {
    workerUrl: 'https://quiz-gen-api.YOUR-USERNAME.workers.dev',
    // ☝️ Paste your actual worker URL here
};
```

4. **Save the file**

### Step 7: Update CORS Settings (Important!)

1. Go back to Cloudflare Worker editor
2. Find line 6 in the worker code:
```javascript
'Access-Control-Allow-Origin': '*',
```

3. Replace `'*'` with your actual domain:
```javascript
'Access-Control-Allow-Origin': 'https://YOUR-USERNAME.github.io',
```

4. If testing locally, you can temporarily keep it as `'*'`
5. Click **"Save and Deploy"**

---

## Part 4: Test Everything (5 minutes)

### Step 8: Test the Worker

1. Push your changes to GitHub:
```bash
git add .
git commit -m "Add Cloudflare Worker integration for Pro API"
git push
```

2. Wait 1-2 minutes for GitHub Pages to update

3. Open your app in the browser

4. **Log in** to your account

5. Go to **Account** page → Click **"Upgrade to Pro"**

6. Go to **Cards** page → Click **"Generate with AI"**

7. Select **"⭐ Pro API - GPT-5 Nano (Unlimited)"**

8. Paste some study material (e.g., "Photosynthesis is the process...")

9. Set card count to 3

10. Click **"Generate"**

### Expected Result:
✅ You should see a "Pro AI Model" dropdown appear
✅ Select your preferred model (GPT-5 Nano is default)
✅ You should see "Generating cards..." spinner
✅ After 5-10 seconds, you should see "Successfully generated 3 cards!"
✅ Cards appear in your list

### If It Doesn't Work:

1. **Open browser console** (F12)
2. Look for errors
3. Common issues:
   - **CORS error**: Go back to Step 7, update the origin
   - **401 Unauthorized**: Check your OpenAI API key in Cloudflare settings
   - **Worker not found**: Verify worker URL in app.js is correct

---

## Part 5: Firebase (Optional - For Extra Security)

Firebase doesn't need any changes! Your Pro status is already stored there:
- Location: `users/{userId}/isPro`
- Already working with the Cloudflare Worker

### Optional: Add Firebase Security Rules

If you want to prevent users from manually setting their Pro status:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`schizotests`)
3. Go to **Realtime Database** → **Rules**
4. Replace with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        "isPro": {
          ".write": false,
          ".read": "$uid === auth.uid"
        },
        "projects": {
          ".read": "$uid === auth.uid",
          ".write": "$uid === auth.uid"
        },
        "cards": {
          ".read": "$uid === auth.uid",
          ".write": "$uid === auth.uid"
        }
      }
    }
  }
}
```

5. Click **"Publish"**

**Note:** With this rule, only you (as admin) can set `isPro` status. Users cannot upgrade themselves by editing Firebase directly.

### To Manually Set Pro Status:

Use Firebase Console:
1. Go to Realtime Database
2. Navigate to `users/{userId}`
3. Add child: `isPro` with value `true`

Or use Firebase Admin SDK (for automation later).

---

## 🎉 You're Done!

### What You've Accomplished:

✅ Created a secure Cloudflare Worker
✅ OpenAI API key is hidden server-side
✅ Pro users can generate unlimited cards
✅ Free users still use their own keys
✅ Everything is working with Firebase

### Security Checklist:

- ✅ API key is NOT in client-side code
- ✅ CORS is properly configured
- ✅ Rate limiting is active (50 req/hour per user)
- ✅ Pro status verification works
- ✅ Free tier = 100,000 requests/day

---

## Next Steps

### For Production:

1. **Add Payment Integration:**
   - Stripe, PayPal, etc.
   - Use webhook to set `isPro` in Firebase
   - See `PAYMENT_INTEGRATION.md` (coming soon)

2. **Monitor Usage:**
   - Check Cloudflare Analytics
   - Monitor OpenAI usage at [platform.openai.com/usage](https://platform.openai.com/usage)
   - Set spending alerts

3. **Add Rate Limiting Storage:**
   - Currently using in-memory limits
   - For production, add Cloudflare KV:
     - Workers → KV → Create Namespace
     - Bind to worker as `RATE_LIMIT`

4. **Test Edge Cases:**
   - Very long study material
   - High card counts (20-50)
   - Multiple simultaneous users

---

## Troubleshooting

### "Pro API is not configured"
- Check that `PRO_API_CONFIG.workerUrl` in app.js has your worker URL
- Make sure there are no typos

### "OpenAI API error"
- Verify API key in Cloudflare is correct
- Check OpenAI account has credits
- Verify key has proper permissions

### CORS Errors
- Update worker code line 6 with your actual domain
- Make sure to **Save and Deploy** after changing

### "Rate limit exceeded"
- Normal if testing rapidly
- Limit resets after 1 hour
- Adjust limit in worker code if needed

### Cards Not Saving
- Check browser console for errors
- Verify Firebase rules allow writing cards
- Make sure user is authenticated

---

## AI Model Selection

Pro users can choose from multiple OpenAI models:

| Model | Best For | Speed | Quality | Cost (per 1M tokens) |
|-------|----------|-------|---------|---------------------|
| **GPT-4o** | Highest quality | Medium | ⭐⭐⭐⭐⭐ | $5.00 |
| **GPT-4o Mini** | Balanced performance | Fast | ⭐⭐⭐⭐ | $0.15 |
| **GPT-4 Turbo** | Fast & high quality | Fast | ⭐⭐⭐⭐⭐ | $10.00 |
| **GPT-4** | Premium quality | Slow | ⭐⭐⭐⭐⭐ | $30.00 |
| **GPT-3.5 Turbo** | Speed & cost | Fastest | ⭐⭐⭐ | $0.50 |
| **GPT-5 Nano** (Default) | Unlimited usage | Medium | ⭐⭐⭐⭐ | $0.10 |

### Recommendations:
- **For testing:** GPT-5 Nano or GPT-4o Mini (cheapest)
- **For production:** GPT-5 Nano (best balance)
- **For premium experience:** GPT-4o or GPT-4 Turbo (best quality)
- **For high volume:** GPT-3.5 Turbo (fastest, cheapest)

Users can select their preferred model in the "Pro AI Model" dropdown that appears when they select "Pro API" as the provider.

---

## Cost Estimate

### Cloudflare Workers:
- **Free tier:** 100,000 requests/day
- **Paid:** $5/month for 10M requests
- **Your cost:** $0 (unless you get 100k+ generations/day!)

### OpenAI API:
- **GPT-5 Nano:** ~$0.001 per card generation
- **Monthly estimate:**
  - 10 Pro users × 100 cards/month = 1,000 cards
  - Cost: ~$1-2/month
- **With 100 Pro users:** ~$10-20/month

### Total Monthly Cost:
- Small scale (10-50 users): **$1-5/month**
- Medium scale (100-500 users): **$10-50/month**
- Large scale (1000+ users): **$100-500/month**

**Pro tip:** Set OpenAI spending limits in [usage settings](https://platform.openai.com/account/billing/limits)

---

## Support

- **Cloudflare Docs:** [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/)
- **OpenAI Docs:** [platform.openai.com/docs](https://platform.openai.com/docs/)
- **Firebase Docs:** [firebase.google.com/docs](https://firebase.google.com/docs/)

Questions? Check the worker logs in Cloudflare dashboard → Workers → Your Worker → Logs
