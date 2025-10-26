# Pro Setup Without Firebase Functions

Since you don't have access to Firebase Functions, here are your alternative options:

## Option 1: Client-Side with Obfuscation (Easiest)

**⚠️ Security Level: LOW - Key can be extracted**

This is what we have now. It works but the API key can be found by anyone who inspects your JavaScript.

### Mitigation Strategies:

1. **Set strict usage limits in OpenAI dashboard:**
   - Go to [OpenAI Usage Limits](https://platform.openai.com/account/limits)
   - Set daily/monthly spending caps
   - Set rate limits per minute

2. **Monitor usage regularly:**
   - Check [OpenAI Usage](https://platform.openai.com/usage) daily
   - Set up email alerts for spending thresholds

3. **Rotate keys frequently:**
   - Create new API keys monthly
   - Delete old keys immediately

4. **Use a separate API key:**
   - Don't use your main OpenAI key
   - Create a dedicated key just for this app
   - Easier to revoke if compromised

### Implementation:
```javascript
// app.js - Already set up!
const PRO_API_CONFIG = {
    provider: 'openai',
    model: 'gpt-5-nano-2025-08-07',
    key: atob('YOUR_BASE64_KEY')
};
```

---

## Option 2: Cloudflare Workers (FREE & SECURE) ⭐ RECOMMENDED

Cloudflare Workers is **completely free** for up to 100,000 requests/day and keeps your API key secure.

### Setup Steps:

1. **Create Cloudflare account** (free):
   - Go to [cloudflare.com](https://cloudflare.com)
   - Sign up for free account

2. **Create a Worker:**
   - Go to Workers & Pages
   - Click "Create Application" → "Create Worker"
   - Name it something like "quiz-gen-api"

3. **Add this code to your Worker:**

```javascript
export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Change to your domain in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { userId, text, count } = await request.json();

      // Verify user is Pro (you'll implement this)
      // For now, we'll skip verification
      // In production: Check Firebase database or add auth header

      const prompt = `Generate ${count} multiple-choice quiz questions from the study material below. Return ONLY a JSON array.

Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]

Study Material:
${text}`;

      // Call OpenAI API with YOUR key (stored securely in Cloudflare)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}` // Set via Cloudflare dashboard
        },
        body: JSON.stringify({
          model: 'gpt-5-nano-2025-08-07',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates quiz questions. Always return valid JSON arrays only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      return new Response(JSON.stringify({
        cards: JSON.parse(data.choices[0].message.content)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
```

4. **Add your API key as environment variable:**
   - In Worker settings → Variables → Environment Variables
   - Add variable: `OPENAI_API_KEY` = `sk-proj-your-key`
   - This keeps it secure and hidden from your code

5. **Deploy the Worker:**
   - Click "Save and Deploy"
   - Copy your worker URL (e.g., `https://quiz-gen-api.your-username.workers.dev`)

6. **Update your app.js:**

```javascript
// Replace the generateCardsWithAI call for Pro users
if (provider === 'pro') {
    if (!isProUser) {
        showNotification('Pro API is only available to Pro members', 'error');
        return;
    }

    // Call Cloudflare Worker instead
    const response = await fetch('https://quiz-gen-api.YOUR-USERNAME.workers.dev', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: currentUser.uid,
            text: text,
            count: count
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
    }

    const data = await response.json();
    return data.cards;
}
```

### Benefits:
✅ **FREE** - 100,000 requests/day
✅ **SECURE** - API key never exposed to clients
✅ **FAST** - Global edge network
✅ **NO CREDIT CARD** required for free tier

---

## Option 3: Simple Backend Server (FREE with limitations)

Use a free hosting service to run a small proxy server:

### Services to Consider:

1. **Render.com** (Free tier):
   - 750 hours/month free
   - Sleeps after 15min inactivity (slow first request)
   - [render.com](https://render.com)

2. **Railway.app** (Free tier):
   - $5 free credits/month
   - No sleep time
   - [railway.app](https://railway.app)

3. **Fly.io** (Free tier):
   - Good for small apps
   - [fly.io](https://fly.io)

### Quick Express Server Example:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {
    const { userId, text, count } = req.body;

    // TODO: Verify user is Pro by checking Firebase

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-5-nano-2025-08-07',
        messages: [
          { role: 'system', content: 'Generate quiz questions as JSON.' },
          { role: 'user', content: `Generate ${count} questions from: ${text}` }
        ]
      })
    });

    const data = await response.json();
    res.json({ cards: JSON.parse(data.choices[0].message.content) });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000);
```

---

## Option 4: Hybrid Approach (Best Balance)

**For testing/beta:** Use client-side key with strict limits
**For production:** Migrate to Cloudflare Workers (free and secure)

### Roadmap:
1. **Week 1-2**: Test with client-side key, limit to 5-10 beta users
2. **Week 3**: Set up Cloudflare Worker
3. **Week 4**: Migrate all Pro users to Worker
4. **Week 5+**: Add payment, open to public

---

## Recommendation: 🎯 Cloudflare Workers

**Why it's the best choice for you:**
- ✅ Completely free (100k requests/day)
- ✅ No credit card needed
- ✅ Setup takes 10-15 minutes
- ✅ Fully secure (API key server-side)
- ✅ No "cold start" delays
- ✅ Global CDN for speed
- ✅ Simple to maintain

**Next Steps:**
1. I can help you set up the Cloudflare Worker step-by-step
2. You'll have a secure Pro system in under 20 minutes
3. Then just add your OpenAI key to Cloudflare (not your code)

---

## Immediate Action Plan

**For Right Now (Next 5 minutes):**
1. Use the client-side setup (already done!)
2. Add your API key following QUICK_START.md
3. Test the Pro features yourself

**Before Launch (Next week):**
1. Set up Cloudflare Worker (I can guide you)
2. Add OpenAI usage limits ($10/month cap recommended)
3. Test with 2-3 trusted users

**For Production:**
1. Point all Pro generation to Cloudflare Worker
2. Add payment integration
3. Remove client-side key completely
4. Open to public

Would you like me to create a detailed step-by-step guide for setting up Cloudflare Workers?
