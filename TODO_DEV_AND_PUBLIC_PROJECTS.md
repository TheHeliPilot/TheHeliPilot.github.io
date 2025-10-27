# TODO: Dev Account & Public Projects System

## Overview
Implement a system where developers can create public quiz projects that all users can access and take. This includes:
- Dev account management (special permissions)
- Public projects database (separate from user projects)
- User interface to browse/take public quizzes
- Leaderboards for public projects

---

## 🎯 Implementation Plan

### Phase 1: Database Schema & Structure
**Location:** Firebase Database

#### Public Projects Structure:
```
publicProjects/
  {projectId}/
    - name: "Biology 101"
    - description: "Test your biology knowledge"
    - category: "science" | "math" | "history" | "language" | "other"
    - difficulty: "easy" | "medium" | "hard" | "mixed"
    - createdBy: userId
    - creatorName: "Dev Name"
    - cardCount: 25
    - totalAttempts: 150
    - averageScore: 82.5
    - createdAt: timestamp
    - published: true/false
    - tags: ["biology", "cells", "dna"]
    - cards/
      {cardId}/
        - question: "..."
        - options: ["A", "B", "C", "D"]
        - correctAnswer: 0
        - explanation: "..."
        - difficulty: "medium"
```

#### Dev Accounts Structure:
```
users/
  {userId}/
    - isDev: true/false
    - isBanned: false  (admin can ban users)
    - devProfile/
      - displayName: "Dr. Smith"
      - bio: "Biology teacher"
      - createdPublicProjects: ["projId1", "projId2"]
      - grantedAt: timestamp
      - grantedBy: adminUserId
```

#### Admin/Super Admin Structure:
```
users/
  {userId}/
    - isAdmin: true/false  (super admin access to console)
    - isDev: true/false
    - isPro: true/false
```

#### User Test Results (for leaderboards):
```
publicProjectResults/
  {projectId}/
    {userId}/
      - displayName: "User123"
      - score: 18
      - total: 20
      - percentage: 90
      - completedAt: timestamp
      - timeSpent: 300 (seconds)
```

---

### Phase 2: UI Structure Changes

#### New Navigation Items:
- **"Explore"** page - Browse public projects (all users)
- **"Dev Dashboard"** page - Manage public projects (dev only)
- **"Admin Console"** page - Manage users, devs, bans, analytics (admin only)

#### Explore Page Layout:
```
┌─────────────────────────────────────┐
│ 🌍 Explore Public Quizzes           │
├─────────────────────────────────────┤
│ [Category Filter] [Difficulty]      │
│ [Search Box]                        │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Biology │ │ Math    │ │ History ││
│ │ 101     │ │ Basics  │ │ WWII    ││
│ │ ⭐4.5   │ │ ⭐4.8   │ │ ⭐4.3   ││
│ │ 25 cards│ │ 30 cards│ │ 20 cards││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

#### Dev Dashboard Layout:
```
┌─────────────────────────────────────┐
│ 🛠️ Dev Dashboard                     │
├─────────────────────────────────────┤
│ [+ Create Public Project]           │
├─────────────────────────────────────┤
│ My Public Projects:                 │
│ ┌─────────────────────────────────┐ │
│ │ Biology 101                     │ │
│ │ 150 attempts | Avg: 82.5%      │ │
│ │ [Edit] [Analytics] [Unpublish] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Admin Console Layout:
```
┌─────────────────────────────────────┐
│ 🛡️ Admin Console                     │
├─────────────────────────────────────┤
│ [Users] [Devs] [Projects] [Reports] │
├─────────────────────────────────────┤
│ === USER MANAGEMENT ===             │
│ Search: [_______________] [Search]  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ user@email.com                  │ │
│ │ UID: abc123                     │ │
│ │ Joined: Jan 2025                │ │
│ │ Pro: ❌ | Dev: ✅ | Banned: ❌   │ │
│ │ [Grant Dev] [Ban User] [View]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ === GLOBAL STATISTICS ===           │
│ Total Users: 1,234                  │
│ Pro Users: 45                       │
│ Dev Users: 12                       │
│ Public Projects: 87                 │
│ Total Attempts: 15,432              │
└─────────────────────────────────────┘
```

---

### Phase 3: Implementation Checklist

#### ✅ Completed:
- [x] Difficulty system for cards
- [x] Difficulty badges and filters
- [x] AI generation with difficulty

#### 🔲 To Do:

##### Database Setup:
- [ ] Create Firebase security rules for publicProjects
- [ ] Create Firebase security rules for publicProjectResults
- [ ] Add isDev field to user management

##### Dev Account Management:
- [ ] ~~Add "Request Dev Access" button~~ (REMOVED - admins grant dev access)
- [ ] Add dev badge/indicator in UI for dev users
- [ ] Show/hide dev dashboard based on isDev status
- [ ] Display banned message if user is banned

##### Public Projects CRUD (Dev Dashboard):
- [ ] Create "Dev Dashboard" page in HTML
- [ ] Add navigation link (visible only to devs)
- [ ] Create modal for creating/editing public projects
- [ ] Form fields:
  - [ ] Project name
  - [ ] Description
  - [ ] Category dropdown
  - [ ] Difficulty
  - [ ] Tags (comma-separated)
- [ ] Bulk card creation (reuse AI generation)
- [ ] Manual card addition to public projects
- [ ] Edit public project metadata
- [ ] Publish/unpublish toggle
- [ ] Delete public project (with confirmation)
- [ ] View analytics (attempts, avg score, completion rate)

##### Explore Page (All Users):
- [ ] Create "Explore" page in HTML
- [ ] Add "Explore" to main navigation
- [ ] Load all published public projects
- [ ] Display as cards with:
  - [ ] Project name & description
  - [ ] Category badge
  - [ ] Difficulty badge
  - [ ] Card count
  - [ ] Creator name
  - [ ] Average score / rating
  - [ ] "Start Quiz" button
- [ ] Category filter dropdown
- [ ] Difficulty filter dropdown
- [ ] Search by name/tags
- [ ] Sort options (newest, popular, highest rated)

##### Taking Public Quizzes:
- [ ] Create "Public Test" mode (separate from regular test)
- [ ] Modal or page for taking public quiz
- [ ] Load cards from publicProjects/{id}/cards
- [ ] Timer (optional)
- [ ] Same test interface as regular tests
- [ ] Save results to publicProjectResults
- [ ] Show completion screen with:
  - [ ] Your score
  - [ ] Leaderboard position
  - [ ] Share option
- [ ] Option to retry

##### Leaderboards:
- [ ] Global leaderboard (top 100 users by total score)
- [ ] Per-project leaderboard (top 50 for each project)
- [ ] Display:
  - [ ] Rank
  - [ ] Username
  - [ ] Score
  - [ ] Completion time
  - [ ] Date
- [ ] "View Leaderboard" button on project cards
- [ ] Leaderboard modal with tabs (Global | This Project)
- [ ] User's rank highlighted

##### Analytics (Dev Dashboard):
- [ ] Total attempts for each public project
- [ ] Average score
- [ ] Completion rate
- [ ] Most missed questions
- [ ] Time-based analytics (attempts per day)
- [ ] User feedback/ratings (future)

##### Admin Console (Super Admins Only):
- [ ] Create "Admin Console" page in HTML
- [ ] Add navigation link (visible only to admins)
- [ ] Load admin status from Firebase
- [ ] **User Management Tab:**
  - [ ] Search users by email/UID
  - [ ] List all users with pagination
  - [ ] Display user info (email, UID, join date, status)
  - [ ] Grant/revoke Dev access
  - [ ] Grant/revoke Pro access
  - [ ] Ban/unban users
  - [ ] View user activity (projects, cards, test results)
  - [ ] Delete user account (with confirmation)
- [ ] **Dev Management Tab:**
  - [ ] List all dev users
  - [ ] See their public projects
  - [ ] Revoke dev access
  - [ ] See dev analytics (projects created, total attempts)
- [ ] **Public Projects Management Tab:**
  - [ ] List all public projects
  - [ ] Filter by creator, category, status
  - [ ] Unpublish/delete any public project
  - [ ] Edit project metadata
  - [ ] View detailed analytics per project
  - [ ] Feature/unfeature projects
- [ ] **Global Analytics Tab:**
  - [ ] Total users count
  - [ ] Pro users count
  - [ ] Dev users count
  - [ ] Total public projects
  - [ ] Total test attempts
  - [ ] Daily/weekly/monthly activity charts
  - [ ] Most popular projects
  - [ ] Most active users
- [ ] **Reports & Moderation Tab:**
  - [ ] View reported projects/users (future)
  - [ ] Activity logs
  - [ ] Banned users list
  - [ ] Recent admin actions log

---

### Phase 4: AI Generation Limits

#### Limits by Account Type:
- **Free Users:** Use their own API keys (no limit from app)
- **Pro Users:** 5 generations per day using Pro API
- **Dev Users:** Unlimited generations using Pro API
- **Banned Users:** 0 (cannot use app)

#### Implementation:
```javascript
// Track generations in Firebase
users/
  {userId}/
    - generations/
      {date}/  // format: YYYY-MM-DD
        - count: 3
        - lastGeneratedAt: timestamp
```

#### Logic:
- Check generation count before allowing Pro API usage
- Reset count daily (check date)
- Devs bypass limit
- Show remaining generations in UI

---

### Phase 5: Firebase Security Rules

```javascript
// Helper function to check if user is not banned
function isNotBanned() {
  return !root.child('users').child(auth.uid).child('isBanned').val();
}

// publicProjects - anyone can read published, only devs (not banned) can write
"publicProjects": {
  ".read": "data.child('published').val() === true ||
            root.child('users').child(auth.uid).child('isDev').val() === true ||
            root.child('users').child(auth.uid).child('isAdmin').val() === true",
  "$projectId": {
    ".write": "(root.child('users').child(auth.uid).child('isDev').val() === true ||
               root.child('users').child(auth.uid).child('isAdmin').val() === true) &&
               !root.child('users').child(auth.uid).child('isBanned').val()"
  }
}

// publicProjectResults - users can write their own results, read leaderboards
"publicProjectResults": {
  "$projectId": {
    ".read": true,
    "$userId": {
      ".write": "auth.uid === $userId && !root.child('users').child(auth.uid).child('isBanned').val()"
    }
  }
}

// users - users can read/write their own, admins can read/write all
"users": {
  "$uid": {
    ".read": "auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
    ".write": "auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
  }
}

// Admin actions log (admins only)
"adminLogs": {
  ".read": "root.child('users').child(auth.uid).child('isAdmin').val() === true",
  ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true"
}
```

---

### Phase 5: UI/UX Enhancements

#### Color Coding:
- Regular projects: Blue border
- Public projects: Purple/Gold border
- Dev badge: Gold star ⭐

#### Navigation Structure:
```
📊 Dashboard
📁 Projects (Your Projects)
🃏 Cards
🌍 Explore (Public Quizzes) <- NEW
📖 Study
✏️ Test
🛠️ Dev Dashboard (devs only) <- NEW
👤 Account
```

---

## 🚀 Quick Start Commands

### Mark user as dev (Firebase Console):
```
users/{userId}/isDev = true
```

### Test public project creation:
1. Set your account to dev
2. Go to Dev Dashboard
3. Create public project
4. Publish it
5. View in Explore page

---

## 📝 Notes for Next Session

### Current Status:
- Difficulty system: ✅ Complete
- Swipe animations: ✅ Complete
- Dashboard stats: ✅ Complete

### Next Steps:
1. Add navigation items for "Explore" and "Dev Dashboard"
2. Create database structure in Firebase
3. Implement dev account toggle
4. Build dev dashboard UI
5. Build explore page UI
6. Connect everything with Firebase

### Files to Modify:
- `index.html` - Add new pages
- `js/app.js` - Add new functions
- `css/styles.css` - Add new styles
- Firebase Security Rules - Update permissions

### Estimated Time:
- Phase 1-2: 1 hour
- Phase 3: 2-3 hours
- Phase 4-5: 1 hour
- **Total: ~4-5 hours**

---

## 🔗 Related Features for Future

- [ ] Comments on public projects
- [ ] Rating system (1-5 stars)
- [ ] User profiles (public)
- [ ] Achievements/badges
- [ ] Social sharing
- [ ] Project categories with icons
- [ ] Trending/featured projects
- [ ] Project collaborators (multiple devs)

---

**Last Updated:** 2025-10-27
**Status:** Planning Complete, Ready to Implement
