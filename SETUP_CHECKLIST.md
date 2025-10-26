# Quick Setup Checklist ✅

## What You Need to Do (20 minutes total)

### ☐ 1. Cloudflare Account (2 min)
- [ ] Sign up at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
- [ ] Verify email
- [ ] Log in

### ☐ 2. Create Worker (3 min)
- [ ] Click "Workers & Pages" → "Create application"
- [ ] Name it: `quiz-gen-api`
- [ ] Deploy it
- [ ] Copy your worker URL

### ☐ 3. Add Worker Code (2 min)
- [ ] Click "Edit code"
- [ ] Delete existing code
- [ ] Copy all code from `cloudflare-worker.js` file
- [ ] Paste into Cloudflare editor
- [ ] Click "Save and Deploy"

### ☐ 4. Add OpenAI API Key (3 min)
- [ ] Go to worker "Settings" tab
- [ ] Click "Variables"
- [ ] Click "Add variable"
- [ ] Name: `OPENAI_API_KEY`
- [ ] Value: Your OpenAI key (sk-proj-...)
- [ ] Click "Encrypt" (optional)
- [ ] Click "Save and deploy"

### ☐ 5. Update Your App (2 min)
- [ ] Open `app.js` in your editor
- [ ] Find line ~37: `workerUrl: '',`
- [ ] Replace with: `workerUrl: 'https://quiz-gen-api.YOUR-USERNAME.workers.dev',`
- [ ] Save the file

### ☐ 6. Update CORS (2 min)
- [ ] Go back to Cloudflare worker editor
- [ ] Find line 6: `'Access-Control-Allow-Origin': '*',`
- [ ] Replace `'*'` with `'https://YOUR-USERNAME.github.io'`
- [ ] Click "Save and Deploy"

### ☐ 7. Deploy & Test (5 min)
- [ ] Commit and push to GitHub:
  ```bash
  git add .
  git commit -m "Add Cloudflare Worker for Pro API"
  git push
  ```
- [ ] Wait 2 minutes for GitHub Pages to update
- [ ] Open your app
- [ ] Log in
- [ ] Go to Account → Click "Upgrade to Pro"
- [ ] Go to Cards → "Generate with AI"
- [ ] Select "⭐ Pro API - GPT-5 Nano"
- [ ] Generate cards!

---

## Firebase (Optional - For Extra Security)

### ☐ 8. Set Database Rules (3 min)
- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select your project
- [ ] Go to Realtime Database → Rules
- [ ] Copy rules from `CLOUDFLARE_SETUP_GUIDE.md` Part 5
- [ ] Click "Publish"

---

## You're Done! 🎉

Your Pro system is now:
- ✅ Secure (API key hidden server-side)
- ✅ Free (100,000 requests/day on Cloudflare)
- ✅ Fast (global CDN)
- ✅ Scalable (ready for thousands of users)

---

## Quick Reference

**Worker URL Format:**
```
https://quiz-gen-api.YOUR-USERNAME.workers.dev
```

**Where to Add It:**
```javascript
// app.js line ~37
const PRO_API_CONFIG = {
    workerUrl: 'YOUR_WORKER_URL_HERE',
};
```

**OpenAI Key Location:**
Cloudflare Dashboard → Your Worker → Settings → Variables → Environment Variables

**Test Pro Features:**
1. Account page → Upgrade to Pro
2. Cards page → Generate with AI
3. Select "Pro API"
4. Generate!

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Pro API not configured" | Add worker URL to app.js |
| CORS error | Update worker line 6 with your domain |
| OpenAI error | Check API key in Cloudflare settings |
| No Pro option showing | Click "Upgrade to Pro" first |

**Need detailed help?** See `CLOUDFLARE_SETUP_GUIDE.md`
