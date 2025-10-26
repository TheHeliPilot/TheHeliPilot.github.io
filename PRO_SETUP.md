# Pro User Setup Guide

## Overview

The Pro user system allows users to generate unlimited AI cards using your premium API keys without exposing them to users. This guide explains how to set it up securely.

## Current Implementation

### What's Working:
1. ✅ Pro status stored in Firebase Realtime Database (`users/{uid}/isPro`)
2. ✅ Pro badge shown in UI
3. ✅ Upgrade/Cancel Pro buttons in Account page
4. ✅ Pro API option in AI generation dropdown
5. ✅ UI updates based on Pro status

### Security Note:
⚠️ **IMPORTANT**: The current implementation uses a client-side API key which is NOT SECURE for production. See the "Secure Setup" section below.

## Quick Start (For Development Only)

To test the Pro feature locally:

1. **Add your API key** (app.js:36-40):
```javascript
const PRO_API_CONFIG = {
    provider: 'openai',
    model: 'gpt-5-nano-2025-08-07',  // Using GPT-5 Nano for cost-effective generation
    key: atob('YOUR_BASE64_ENCODED_KEY_HERE')
};
```

To encode your key:
```javascript
// In browser console:
btoa('sk-proj-your-actual-api-key-here')

// Then paste the output into the atob() function in app.js
```

2. **Enable Pro for a user**:
   - Log in to your app
   - Go to Account page
   - Click "Upgrade to Pro"
   - The Pro API option will now appear in the AI generation modal

## Secure Setup (RECOMMENDED for Production)

### Option 1: Firebase Functions (Recommended)

Create a Firebase Cloud Function that handles AI requests server-side:

1. **Install Firebase CLI and initialize functions**:
```bash
npm install -g firebase-tools
firebase init functions
```

2. **Create a function** (`functions/index.js`):
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Configuration, OpenAIApi } = require('openai');

admin.initializeApp();

const openai = new OpenAIApi(new Configuration({
  apiKey: functions.config().openai.key // Set via: firebase functions:config:set openai.key="sk-..."
}));

exports.generateCards = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  // Check if user is Pro
  const userId = context.auth.uid;
  const proSnapshot = await admin.database().ref(`users/${userId}/isPro`).once('value');

  if (!proSnapshot.val()) {
    throw new functions.https.HttpsError('permission-denied', 'Pro membership required');
  }

  // Generate cards
  const { text, count } = data;

  const response = await openai.createChatCompletion({
    model: 'gpt-5-nano-2025-08-07',  // Using GPT-5 Nano for cost-effective unlimited generation
    messages: [
      { role: 'system', content: 'You are a helpful assistant that generates quiz questions. Always return valid JSON arrays only.' },
      { role: 'user', content: `Generate ${count} multiple-choice quiz questions from: ${text}` }
    ]
  });

  return {
    cards: JSON.parse(response.data.choices[0].message.content)
  };
});
```

3. **Deploy the function**:
```bash
firebase deploy --only functions
```

4. **Update app.js to use the function**:
```javascript
// In generateCardsWithAI function, add this case:
if (provider === 'pro') {
    const generateCards = httpsCallable(functions, 'generateCards');
    const result = await generateCards({ text, count });
    return result.data.cards;
}
```

### Option 2: Separate Backend Server

Create a Node.js/Express server that:
1. Verifies Firebase auth tokens
2. Checks Pro status
3. Makes AI API calls with your secure key
4. Returns results to the client

### Option 3: API Gateway (Advanced)

Use a service like AWS API Gateway or Cloudflare Workers to:
1. Proxy requests to AI providers
2. Inject your API key server-side
3. Rate limit based on user status

## Database Structure

```
users/
  {userId}/
    isPro: boolean
    projects/
      {projectId}/
        name: string
        description: string
        color: string
        createdAt: timestamp
    cards/
      {cardId}/
        projectId: string
        question: string
        options: array
        correctAnswer: number
        explanation: string
        mastered: boolean
        createdAt: timestamp
```

## Security Checklist

- [ ] Remove API key from client-side code (app.js:38)
- [ ] Set up Firebase Functions or backend server
- [ ] Add rate limiting to prevent abuse
- [ ] Add usage tracking per user
- [ ] Set up monitoring for API costs
- [ ] Add error handling and logging
- [ ] Consider adding usage limits even for Pro users
- [ ] Set up Firebase Security Rules to protect Pro status

## Firebase Security Rules

Add these rules to prevent users from setting their own Pro status:

```json
{
  "rules": {
    "users": {
      "$uid": {
        "isPro": {
          ".write": false,  // Only admins can set Pro status
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

To set Pro status manually (as admin):
```javascript
// Use Firebase Console or Admin SDK
admin.database().ref(`users/${userId}/isPro`).set(true);
```

## Payment Integration (Future)

When you're ready to add payments:

1. **Stripe Integration**:
   - Add Stripe checkout
   - Use Firebase Extensions for Stripe
   - Webhook to update `isPro` status

2. **Alternative Providers**:
   - PayPal
   - Paddle
   - LemonSqueezy

## Monitoring & Analytics

Track:
- Number of Pro users
- API usage per user
- Generation costs
- Popular AI providers
- Error rates

## Support

For questions or issues:
1. Check Firebase console for errors
2. Review function logs: `firebase functions:log`
3. Test with Firebase emulator: `firebase emulators:start`

---

**Remember**: Never commit API keys to version control. Use environment variables or Firebase config.
