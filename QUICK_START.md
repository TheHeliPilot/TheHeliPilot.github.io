# Quick Start Guide - Adding Your Pro API Key

## Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy your API key (starts with `sk-proj-...`)

## Step 2: Encode Your API Key

1. Open your browser's developer console (F12)
2. Type this command and press Enter:
```javascript
btoa('sk-proj-YOUR-ACTUAL-KEY-HERE')
```
3. Copy the output (it will be a long base64 string)

**Example:**
```javascript
// Input:
btoa('sk-proj-abc123def456')

// Output:
'c2stcHJvai1hYmMxMjNkZWY0NTY='
```

## Step 3: Add to Your App

1. Open `app.js`
2. Find line 39 (around line 36-40):
```javascript
const PRO_API_CONFIG = {
    provider: 'openai',
    model: 'gpt-5-nano-2025-08-07',
    key: atob('') // Add your base64-encoded key here
};
```

3. Paste your base64 string between the quotes:
```javascript
const PRO_API_CONFIG = {
    provider: 'openai',
    model: 'gpt-5-nano-2025-08-07',
    key: atob('c2stcHJvai1hYmMxMjNkZWY0NTY=') // Your encoded key
};
```

4. Save the file

## Step 4: Test Pro Features

1. Run your app locally or deploy to GitHub Pages
2. Log in to your account
3. Go to **Account** page
4. Click **"Upgrade to Pro"** (it's free for now)
5. Navigate to **Cards** page
6. Click **"Generate with AI"**
7. Select **"⭐ Pro API - GPT-5 Nano (Unlimited)"** from the dropdown
8. Add study material and generate cards!

## Using GPT-5 Nano

The Pro API uses OpenAI's GPT-5 Nano model (`gpt-5-nano-2025-08-07`) which provides:
- ✅ High-quality quiz generation
- ✅ Cost-effective for unlimited usage
- ✅ Fast response times
- ✅ Great for educational content

## Troubleshooting

### "Pro API is currently unavailable"
- Make sure you've added your API key to `app.js`
- Check that the key is properly base64 encoded
- Verify your OpenAI account has credits

### "OpenAI API error"
- Check your API key is valid and active
- Verify your OpenAI account has sufficient credits
- Make sure the model name is correct: `gpt-5-nano-2025-08-07`

### Not seeing Pro option in dropdown
- Make sure you clicked "Upgrade to Pro" in Account page
- Refresh the page after upgrading
- Check browser console for errors

## Security Warning

⚠️ **This setup is for development/testing only!**

For production use:
- The API key is visible in client-side code
- Anyone can extract it from your JavaScript
- **Follow the [PRO_SETUP.md](./PRO_SETUP.md) guide** to implement Firebase Functions for secure API key storage

## Next Steps

1. ✅ Test with a few cards to verify it works
2. ✅ Monitor your OpenAI usage at [platform.openai.com/usage](https://platform.openai.com/usage)
3. ✅ Set up usage limits in OpenAI dashboard
4. 📚 Read [PRO_SETUP.md](./PRO_SETUP.md) for production security setup
5. 💳 Add payment integration (Stripe, etc.) when ready to launch

---

**Need Help?**
- Check the [PRO_SETUP.md](./PRO_SETUP.md) for detailed setup
- Review Firebase Console for database errors
- Check browser console (F12) for JavaScript errors
