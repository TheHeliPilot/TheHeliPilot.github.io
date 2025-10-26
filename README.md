# Flashcard Study App

A powerful web app for creating and studying flashcards, complete with progress tracking, difficulty ratings, and advanced study features. **Optionally** use Claude AI to generate flashcards automatically.

## Features

### Card Management (No AI Required!)
- **Quick Start** - Create flashcards immediately, no setup needed
- **Manual Creation** - Fast and easy card creation
- **Edit Cards** - Modify any flashcard after creation
- **Delete Cards** - Remove cards you don't need
- **Search** - Quickly find specific cards
- **Import/Export** - Share flashcard sets as JSON files

### Optional AI Generation
- **Works with Claude Pro!** - Use your existing subscription (no API needed!)
- **Copy-Paste Workflow** - App generates prompt, you paste into Claude.ai
- **Smart Analysis** - AI creates 5-15 relevant Q&A pairs
- **Alternative: API Access** - Direct integration with $5 free credits for new users

### Study Features
- **Interactive Flashcards** - Smooth 3D flip animations
- **Shuffle Mode** - Randomize cards for better learning
- **Difficulty Tracking** - Rate cards as Hard, Medium, Easy, or Mastered
- **Filter by Difficulty** - Focus on cards you need to review
- **Progress Badges** - Visual indicators of your mastery level

### Progress & Statistics
- Track total study sessions
- Monitor cards studied vs. total cards
- View mastered card count
- Visual progress bar breakdown by difficulty
- Persistent statistics across sessions

### User Experience
- **Dark Mode** - Toggle between light and dark themes
- **Auto-Save** - All cards saved to browser storage
- **Keyboard Shortcuts** - Efficient navigation and rating
- **Mobile Responsive** - Works great on phones and tablets
- **Help Guide** - Built-in keyboard shortcuts reference

## How to Use

### 1. Open the app
- Simply double-click `index.html` to open in your web browser
- No installation, no API key, no setup required!

### 2. Create Flashcards (Choose One)

**Easiest: Manual Creation** (Recommended to start)
- Click "Create Card" on the home screen
- Enter your question and answer
- Click "Save Card"
- Repeat to add more cards
- Start studying!

**Import Existing Cards**
- Click "Import Cards"
- Select a JSON file from your computer
- Choose to merge with or replace current cards

**Use Claude Pro AI (Your Existing Subscription!)**
- Click "Use Claude Pro (Free!)"
- Paste your study material in step 1
- Click "Copy Prompt" in step 2
- Open Claude.ai and paste the prompt
- Copy the JSON that Claude gives you
- Paste it into step 3 and click "Import Flashcards"
- Done! AI-generated flashcards without any API costs

**Alternative: Use API (Direct Integration)**
- Click "Use API Instead"
- Get $5 free credits at console.anthropic.com
- Paste your API key and study material
- Click "Generate Flashcards with AI"

### 3. Manage Your Cards
- **Search**: Type in the search box to filter cards
- **Filter**: Use checkboxes to show/hide cards by difficulty
- **Edit**: Click "Edit" on any card to modify it
- **Delete**: Click "Delete" to remove a card
- **Export**: Save your flashcard set to share or backup

### 6. Study Your Cards
- Click "Start Studying" to enter study mode
- Optional: Enable "Shuffle" for random order
- Click the card or press Space/Enter to flip
- After viewing the answer, rate your knowledge:
  - Click difficulty buttons or press 1-4
  - Cards auto-advance after rating
- Use arrow keys to navigate
- Press Esc to exit study mode

## Keyboard Shortcuts

### Study Mode
- `Space` or `Enter` - Flip card
- `←` Left Arrow - Previous card
- `→` Right Arrow - Next card
- `1` - Mark as Hard
- `2` - Mark as Medium
- `3` - Mark as Easy
- `4` - Mark as Mastered
- `Esc` - Exit study mode

### General
- `Esc` - Close any modal/dialog

## Statistics & Progress

Click the statistics icon (📊) to view:
- **Total Cards** - Number of flashcards in your set
- **Cards Studied** - Cards you've rated at least once
- **Mastered** - Cards marked as mastered
- **Study Sessions** - Number of times you've studied

The progress bar shows a visual breakdown of your mastery level across all cards.

## Using Claude Pro (Free AI Generation!)

Since you have a Claude Pro subscription, you can use AI for free without needing API access:

1. **In the app**: Click "Use Claude Pro" and paste your study material
2. **Copy the prompt**: The app creates a special prompt that includes your text
3. **Go to Claude.ai**: Open a new tab and paste the prompt
4. **Get JSON**: Claude will generate flashcards in JSON format
5. **Import back**: Copy the JSON and paste it into the app
6. **Done!** Your flashcards are ready to study

This workflow lets you leverage your existing Claude Pro subscription without any additional costs or API setup!

## Dark Mode

Click the moon/sun icon (🌙/☀️) in the header to toggle between light and dark themes. Your preference is saved automatically.

## Data & Privacy

### Local Storage
- All flashcards are saved in your browser's local storage
- Statistics and preferences persist across sessions
- Your API key is stored locally and never sent anywhere except Anthropic's API
- Clear browser data will erase all saved flashcards and stats

### API Usage
- Text is sent only to Anthropic's Claude API for flashcard generation
- No data is stored on external servers
- No tracking or analytics

### Backup Your Cards
Always export your flashcard sets regularly to prevent data loss if you clear browser data.

## API Costs

This app uses **Claude 3.5 Sonnet**. Typical costs:
- **Input**: ~$3 per million tokens
- **Output**: ~$15 per million tokens
- **Average flashcard generation**: $0.01-0.05 per session
- Most study sessions cost less than a penny

## Files

- `index.html` - Main application interface with modals and study modes
- `styles.css` - Complete styling with dark mode support
- `script.js` - Full application logic with AI integration, storage, and statistics

## Tips for Better Flashcards

1. **Quality Input** - Paste well-structured content for better AI-generated cards
2. **Edit AI Cards** - Review and refine AI-generated flashcards for accuracy
3. **Regular Study** - Use difficulty ratings to focus on weak areas
4. **Shuffle Mode** - Prevents memorizing card order instead of content
5. **Export Regularly** - Back up your flashcard sets
6. **Filter Smart** - Focus study sessions on Hard/Medium cards

## Troubleshooting

**Cards not generating?**
- Verify your API key is correct and saved
- Check browser console for errors
- Ensure you have Claude API credits

**Cards not saving?**
- Check if browser local storage is enabled
- Don't use private/incognito mode
- Export cards as backup

**Dark mode not working?**
- Try refreshing the page
- Clear browser cache
- Check if JavaScript is enabled

## Browser Compatibility

Works best on modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential features for future versions:
- Spaced repetition algorithm
- Multiple choice quiz mode
- Image support for flashcards
- Audio pronunciation
- Cloud sync
- Shared flashcard decks
- Print mode for physical cards

---

Made with Claude Code. Enjoy studying!
