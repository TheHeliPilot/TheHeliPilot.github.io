# Firebase Realtime Database Security Rules

## Overview
These security rules control access to your Firebase Realtime Database. Copy and paste these rules into your Firebase Console under **Realtime Database > Rules**.

## Rules

```json
{
  "rules": {
    "users": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('isAdmin').val() === true",
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('isAdmin').val() === true)",
        "projects": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": "auth != null && auth.uid === $uid && root.child('users').child(auth.uid).child('isBanned').val() !== true"
        },
        "cards": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": "auth != null && auth.uid === $uid && root.child('users').child(auth.uid).child('isBanned').val() !== true"
        }
      }
    },
    "publicProjects": {
      ".read": "auth != null",
      "$projectId": {
        ".write": "auth != null && (root.child('users').child(auth.uid).child('isDev').val() === true || root.child('users').child(auth.uid).child('isAdmin').val() === true) && root.child('users').child(auth.uid).child('isBanned').val() !== true"
      }
    },
    "publicProjectResults": {
      "$projectId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid === $userId && root.child('users').child(auth.uid).child('isBanned').val() !== true"
        }
      }
    }
  }
}
```

## Rule Explanations

### Users Collection
- **Read**: Users can read their own data, or admins can read any user's data
- **Write**: Users can write their own data, or admins can write any user's data
- **Projects & Cards**: Only the user can read/write their own projects and cards, and they must not be banned

### Public Projects
- **Read**: Any authenticated user can read public projects
- **Write**: Only devs or admins who are not banned can create/edit public projects

### Public Project Results
- **Read**: Any authenticated user can read leaderboards (results)
- **Write**: Users can only write their own quiz results, and they must not be banned

## Setting the Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Realtime Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the rules above and paste them into the editor
6. Click **Publish**

## Important Notes

- These rules assume you're using Firebase Realtime Database (not Firestore)
- Always test your rules after updating them
- Never set `.read` or `.write` to `true` without authentication checks in production
- Banned users cannot write any data (projects, cards, quiz results)
- Only admins can grant/revoke Pro, Dev, Admin, and Ban status

## Testing the Rules

You can test the rules in the Firebase Console:
1. Go to **Realtime Database > Rules**
2. Click the **Simulator** tab
3. Enter a path (e.g., `/publicProjects`)
4. Select Read or Write
5. Click **Run**

## Admin Setup

To create your first admin user:
1. Create a user account through your app
2. Go to Firebase Console > Realtime Database > Data
3. Navigate to `users/{your-uid}/`
4. Add a new child: `isAdmin` with value `true`
5. Refresh your app and you should see the Admin Console link

## Dev User Setup

Admins can grant dev access to users through the Admin Console in the app, or manually:
1. Go to Firebase Console > Realtime Database > Data
2. Navigate to `users/{user-uid}/`
3. Add a new child: `isDev` with value `true`

## Pro User Setup

Admins can grant pro access to users through the Admin Console in the app, or manually:
1. Go to Firebase Console > Realtime Database > Data
2. Navigate to `users/{user-uid}/`
3. Add a new child: `isPro` with value `true`
