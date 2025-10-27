# 🤖 AI Card Generation Guide

## ✅ AI Generation Works for Both Private & Public Projects!

The same AI generation system is now reused for both:
- **Your private projects** (original functionality)
- **Public projects** (new!)

**No code duplication** - the same AI modal, API calls, and generation logic work for both!

---

## 🎯 How to Generate Cards for Public Projects

### Step 1: Create/Open a Public Project
1. Go to **Dev Dashboard**
2. Either create a new project or find an existing one
3. Click **"Manage Cards"** button

### Step 2: Generate Cards with AI
1. Click **"Generate with AI"** button (purple button)
2. The AI modal opens (same one you use for private projects)
3. Choose your options:
   - **Provider:** OpenAI, Anthropic, Gemini, or **Pro API** (if Pro/Dev)
   - **Tab:** Auto (paste text) or Manual (upload file)
   - **Card Count:** How many cards to generate
   - **Difficulty:** Easy, Medium, Hard, or Mixed

4. Paste your content or upload a file
5. Click **"Generate Cards"**

### Step 3: Cards Added Automatically
- Cards are saved directly to your public project
- Card count updates automatically
- You can edit/delete generated cards just like manual ones

---

## 💡 Features

### Same Functionality as Private Projects:
- ✅ All AI providers (OpenAI, Anthropic, Gemini, Pro API)
- ✅ Text paste or file upload
- ✅ Choose card count (1-20)
- ✅ Set difficulty level
- ✅ Explanations included
- ✅ Generation limits enforced (5/day for Pro, unlimited for Dev/Admin)

### Smart Context Detection:
- When opened from **Cards page** → Generates for private project
- When opened from **Public Cards** → Generates for public project
- Project selector hidden when generating for public projects
- Automatically resets when closed

---

## 🔑 API Keys & Limits

### Using Your Own Keys (OpenAI, Anthropic, Gemini):
- Unlimited generations
- Paste your API key in the modal
- Key saved in browser (localStorage)

### Using Pro API:
- **Pro Users:** 5 generations per day
- **Dev Users:** Unlimited
- **Admin Users:** Unlimited
- No API key needed
- Uses secure backend

---

## 📝 Example Workflow

```
1. Dev Dashboard → "Biology 101" → Manage Cards
2. Click "Generate with AI"
3. Select "Pro API" provider
4. Paste chapter text about photosynthesis
5. Choose "10 cards", "Medium difficulty"
6. Click "Generate Cards"
7. ✅ 10 cards added to your public project!
8. Publish project
9. Users can now take the quiz in Explore
```

---

## 🎨 Visual Indicators

- **"Generate with AI"** button appears in public cards modal
- Same purple/magic wand icon as private projects
- Project selector automatically hidden (you're already in the project!)
- Success notification shows card count

---

## 🐛 Troubleshooting

**Problem:** "Please select a project" error  
**Solution:** Make sure you opened AI generation from "Manage Cards" screen

**Problem:** Generation limit reached  
**Solution:** 
- Pro users: Wait 24 hours or use your own API key
- Or ask admin to grant you Dev status for unlimited generations

**Problem:** Cards not appearing  
**Solution:** Refresh the "Manage Cards" screen

---

## 🔒 Security

- Same security checks as private projects
- Dev/Admin users can generate for public projects
- Regular users cannot (no public project access)
- Banned users blocked from generating
- API keys encrypted and stored securely

---

## 📊 Implementation Details

### Code Reuse (No Duplication!):
```javascript
// Flag to track context
let isGeneratingForPublicProject = false;

// Same AI modal used
openModal('aiModal');

// Smart routing in saveGeneratedCards()
if (isGeneratingForPublicProject) {
    await saveGeneratedCardsToPublicProject(projectId, cards);
} else {
    await saveGeneratedCards(projectId, cards);
}

// Auto-cleanup when modal closes
closeModal() → resets flag
```

### Database Paths:
- **Private:** `users/{uid}/cards/{projectId}`
- **Public:** `publicProjects/{projectId}/cards/`

---

**Last Updated:** 2025-10-27  
**Status:** Fully Implemented & Tested ✅
