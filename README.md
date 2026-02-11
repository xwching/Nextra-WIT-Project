Docummentation for our App: GatherLah (tentative name)
# GatherLah

A mobile social platform built to bring people together through real-world events, meaningful connections, and AI-powered wellness nudges. GatherLah combats social isolation by making it easy and fun to discover events, grow friendships, and maintain healthy social habits.

> **The final code is in the `master` branch.**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Screens](#screens)
- [AI Social Momentum Agent](#ai-social-momentum-agent)
- [Firebase Collections](#firebase-collections)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## Features

### Core Social
- **Event Discovery & Creation** across 7 categories (Creative, Tech, Games, Social, Learning, Activity, Community)
- **Friend System** with requests, mutual friend counts, shared interest matching, and smart suggestions
- **Direct Messaging** with conversation tracking and unread counts
- **Online/Offline Status** with last-seen timestamps
- **Follow System** (separate from friendships)

### Gamification
- **XP & Leveling** — progressive level system (20+ levels)
- **Daily Streaks** with milestone rewards at 7, 14, 30, 60, and 100 days
- **21 Badges** across 5 categories (Social, Events, Community, Wellness, Special)
- **17 Missions** — Daily, Weekly, Special, and Achievement types

### AI Social Momentum Agent (Strands-style)
- **Loneliness Score** (0-100) computed from 5 weighted behavioral signals
- **Autonomous Agent Loop**: observe -> score -> decide -> nudge -> store -> measure -> adapt
- **GPT-4o-mini Integration** for warm, human-sounding nudges (with template fallback)
- **6 Nudge Categories**: event suggestions, friend reconnects, streak encouragement, general tips, comeback welcomes, milestone celebrations
- **Learning Feedback Loop** — adapts frequency, tone, and threshold based on user response patterns
- **Kid-Safe Mode** with content filtering and simplified language

### Mental Wellness
- Mood tracking with emoji-based check-ins
- Wellness score computed from engagement and mood history
- Wellness-focused badges and missions

### Parent-Child Safety
- Three account types: Normal (13+), Parent, Child (under 13)
- Child accounts restricted to kid-friendly events
- Parent monitoring dashboard
- Friend request filtering for child safety

### Event Competitions
- Entry submissions and community voting
- Event chats with multiple channels
- Moderator system for community management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Expo SDK 54, React Native 0.81 |
| **Language** | TypeScript 5.9 |
| **Navigation** | Expo Router 6 (file-based routing) |
| **Backend** | Firebase (Firestore, Auth, Storage) |
| **AI** | OpenAI GPT-4o-mini (optional, with template fallback) |
| **UI** | React Native Paper, Expo Linear Gradient, Material Community Icons |
| **Chat** | React Native Gifted Chat |
| **State** | React Context (AuthContext) |
| **Animations** | React Native Reanimated, Gesture Handler |

---

## Project Structure

```
GatherLah/
├── app/                              # Screens (Expo Router)
│   ├── (tabs)/                       # Bottom tab screens
│   │   ├── index.tsx                 # Home dashboard
│   │   ├── explore.tsx               # Event discovery & search
│   │   ├── social-pulse.tsx          # AI agent nudges & wellness ring
│   │   ├── events.tsx                # Event management (Now/Upcoming/Past/Mine)
│   │   ├── friends.tsx               # Friends, Requests, Discover tabs
│   │   └── profile.tsx               # User profile & settings
│   ├── auth/                         # Sign-in & Sign-up
│   ├── create-event.tsx              # Event creation form
│   └── event/[id].tsx                # Event detail (dynamic route)
│
├── services/
│   ├── firebase/                     # Firebase config & auth service
│   ├── api/                          # Events, Friends, Gamification, Notifications
│   ├── agent/                        # AI Social Momentum Agent
│   │   ├── social-agent.ts           # Main agent loop & memory
│   │   ├── loneliness-score.ts       # 5-component score engine
│   │   ├── ai-nudge.ts              # GPT generation + template fallback
│   │   └── agent-config.ts          # Thresholds & frequency config
│   └── data/                         # Seed data (badges, missions, sample users)
│
├── types/                            # TypeScript definitions
│   ├── user.types.ts
│   ├── event.types.ts
│   ├── social.types.ts
│   ├── gamification.types.ts
│   └── agent.types.ts
│
├── contexts/AuthContext.tsx           # Global auth state
├── components/                       # Reusable UI components
├── constants/                        # Colors, theme, mock data
└── hooks/                            # Custom React hooks
```

---

## Screens

| Tab | Screen | Description |
|-----|--------|-------------|
| Home | Dashboard | Welcome banner, streak, quick stats, live/upcoming events, friends list |
| Explore | Discovery | Search events, filter by 6 categories, trending events, suggested people |
| Pulse | Social Pulse | AI wellness ring, nudge cards, quick actions, pull-to-refresh agent |
| Events | Management | 4 sub-tabs (Now, Upcoming, Past, Mine) with type filtering |
| Friends | Social | 3 sub-tabs (Friends, Requests, Discover) with smart suggestions |
| Profile | Settings | Stats, privacy toggles, notifications, sign out |

---

## AI Social Momentum Agent

The agent follows a **Strands-style stateful architecture** — it observes, reasons, acts, and learns:

```
┌─────────────────────────────────────────────────┐
│                  AGENT LOOP                      │
│                                                  │
│  1. OBSERVE    → Gather user activity snapshot   │
│  2. SCORE      → Compute loneliness score (0-100)│
│  3. DECIDE     → Should we nudge? What category? │
│  4. GENERATE   → GPT-4o-mini or template fallback│
│  5. STORE      → Save nudge to Firestore         │
│  6. MEASURE    → Check outcomes after 24 hours   │
│  7. ADAPT      → Update memory, frequency, tone  │
└─────────────────────────────────────────────────┘
```

### Loneliness Score Components

| Component | Weight | Max Threshold |
|-----------|--------|---------------|
| Inactivity Days | 30 pts | 14 days |
| Missed Events | 15 pts | 5 events |
| Streak Decay | 20 pts | 7-day expected |
| Chat Inactivity | 20 pts | 7 days |
| Low Friend Count | 15 pts | < 5 friends |

### Safety Rules
- Never uses words like "lonely", "depressed", "isolated"
- Never shames or pressures the user
- Always points toward real people and events
- Respects 20-hour cooldown between nudges (max 2/day)
- Kid-safe content filtering for child accounts

---

## Firebase Collections

The app uses **25 Firestore collections**:

| Collection | Purpose |
|-----------|---------|
| `users` | User profiles, settings, gamification stats |
| `events` | Event details and metadata |
| `eventParticipants` | User-event participation records |
| `eventChats` | Event discussion channels |
| `eventEntries` | Competition submissions |
| `friendRequests` | Pending friend requests |
| `messages` | Direct messages |
| `chats` | Conversation metadata |
| `followers` | Follow relationships |
| `notifications` | User notifications |
| `posts` | Event feed posts |
| `badges` | Badge definitions |
| `userBadges` | Earned badges |
| `missions` | Mission definitions |
| `userMissions` | Mission progress |
| `streaks` | Daily streak records |
| `mentalWellnessLogs` | Mood check-in logs |
| `parentChildLinks` | Parent-child account links |
| `reports` | Content reports |
| `communityEvents` | Community event links |
| `eventModerators` | Event moderator assignments |
| `userActivity` | AI agent activity snapshots |
| `lonelinessScores` | Computed loneliness scores |
| `aiNudges` | Generated AI nudge messages |
| `agentMemory` | Agent learning state per user |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Firestore, Auth, and Storage enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/GatherLah.git
cd GatherLah/GatherLah

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## Environment Variables

Create a `.env` file in the `GatherLah/` directory:

```env
# Firebase (configured in services/firebase/config.ts)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI (optional — enables GPT-powered nudges)
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
```

> When no OpenAI key is set, the AI agent falls back to curated template-based nudges automatically.

---

## License

This project was built for educational purposes.
