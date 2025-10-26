# Vercel Setup Guide (5 Minutes - EASIER than Cloudflare!)

## Why Vercel?
- ✅ **FREE** - No credit card needed
- ✅ **EASY** - Deploy in 3 clicks
- ✅ **NO ACCESS ISSUES** - Works immediately
- ✅ **SECURE** - API key stored server-side

---

## Step 1: Sign Up for Vercel (2 min)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. **Sign in with GitHub** (easiest)
4. Authorize Vercel

---

## Step 2: Deploy Your Project (1 min)

1. In Vercel dashboard, click **"Add New..." → "Project"**
2. **Import** your GitHub repository: `TheHeliPilot.github.io`
3. Click **"Deploy"** (don't change any settings)
4. Wait ~30 seconds
5. **Copy your Vercel URL** (e.g., `https://your-project.vercel.app`)

---

## Step 3: Add Your OpenAI API Key (1 min)

1. In your project page, click **"Settings"** tab
2. Click **"Environment Variables"** in left menu
3. Click **"Add New"**
4. Add:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Your NEW OpenAI API key (remember to rotate the old one!)
   - **Environment:** Production
5. Click **"Save"**

---

## Step 4: Update Your App (1 min)

Update `app.js` with your Vercel URL:

```javascript
const PRO_API_CONFIG = {
    workerUrl: 'https://your-project.vercel.app/api/generate',
    // Replace 'your-project' with your actual Vercel URL
};
```

Then push to GitHub:
```bash
git add .
git commit -m "Switch to Vercel for Pro API"
git push
```

---

## Step 5: Test!

1. Open your app: `https://thehelipilot.github.io`
2. Upgrade to Pro
3. Generate cards with Pro API
4. **IT WORKS!** ✅

---

## Comparison: Cloudflare vs Vercel

| Feature | Cloudflare Workers | Vercel |
|---------|-------------------|--------|
| Setup Time | 20 min | 5 min |
| Complexity | Medium | Easy |
| Free Tier | 100k req/day | 100GB bandwidth/month |
| Issues | Access blocks, SSL errors | None - just works |
| **Verdict** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Your API Endpoint

After deployment, your Pro API will be at:
```
https://your-project-name.vercel.app/api/generate
```

That's it! Much simpler than Cloudflare.

---

## Troubleshooting

### "Function not found"
- Make sure the `api` folder is committed to Git
- Redeploy from Vercel dashboard

### "OPENAI_API_KEY not found"
- Add environment variable in Vercel settings
- Redeploy after adding

### CORS errors
- Update the origin in `api/generate.js` line 8
- Redeploy

---

## Next Steps

Once working:
1. Test with different models
2. Monitor usage at [vercel.com/dashboard](https://vercel.com/dashboard)
3. Add payment integration
4. Launch! 🚀

**Vercel is recommended for most users - it just works!**
