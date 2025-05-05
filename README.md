# 📅 FullCalendar.io Clone — Powered by Firebase + React + TypeScript

A feature-rich calendar app inspired by [FullCalendar.io](https://fullcalendar.io), supercharged with:

* 🔐 Firebase Authentication
* 💬 Real-time Chat
* 📆 Intelligent Meeting Scheduling
* 🔔 Push Notifications
* ⚛️ Built with React + TypeScript

---

## 🧩 Features

### ✅ Authentication

* Secure login via Firebase Auth
* Supports email/password + OAuth (configurable)

### 💬 Real-Time Chat

* Built using Firebase Firestore
* Seamless messaging via `ChatBox.tsx` and `MessagesSection.tsx`
* State managed by `ChatContext.tsx`

### 📆 Event Scheduling

* Schedule events in the `Calendar.tsx` component
* Auto-suggests available users for meetings using logic from `UserSearchModal.tsx` and `EventModal.tsx`
* Event creation and availability handled via Firestore & `EventContext.tsx`

### 📤 Push Notifications

* Integrated with Firebase Cloud Messaging
* Users receive instant notifications for:

  * Meeting invites
  * Chat messages
  * Event updates

---

## 🏗️ Project Structure

```
src/
├── components/
│   └── views/
│       ├── Calendar.tsx           # FullCalendar integration + events
│       ├── ChatBox.tsx            # Chat input and display
│       ├── EventModal.tsx         # Create/edit events
│       ├── NewEventPopover.tsx    # Quick event creation UI
│       ├── UserSearchModal.tsx    # Meeting participant selector
│       ├── MessagesSection.tsx    # Chat thread display
│       └── Header.tsx             # Navigation and user info
│
├── context/
│   ├── ChatContext.tsx
│   ├── EventContext.tsx
│   └── UserSearchContext.tsx
│
├── auth.tsx               # Authentication hooks and login state
├── firebaseConfig.ts      # Firebase setup and exports
├── types.ts               # TypeScript interfaces and types
├── App.tsx                # Root component
├── main.tsx               # React DOM render logic
└── index.css              # Global styles
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/priyankahotkar/fullcalendarNextVersion-clone.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project and enable:

* Authentication
* Firestore Database
* Firebase Cloud Messaging

Replace contents of `firebaseConfig.ts`:

```ts
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4. Start the Development Server

```bash
npm run dev
```

---

## 🧠 How Smart Scheduling Works

* On event creation (`EventModal.tsx`), app:

  * Queries Firestore for available users via `UserSearchModal.tsx`
  * If users are available:

    * Assigns one to the event
    * Notifies both via FCM and ChatContext
    * Adds event to both users’ calendars

---

## 🔐 Security

* Role-based access via Firestore rules
* All API and UI interactions secured through Firebase Auth
* Chat and meeting data scoped to authenticated users

---


## 🧑‍💻 Author

**Your Name**
[GitHub](https://github.com/priyankahotkar) · [LinkedIn](https://linkedin.com/in/priyanka-hotkar-3a667a259) · [Portfolio](https://priyankahotkar.github.io/Portfolio/) .

---

## 🌟 Future Enhancements

* Video call integration via Jitsi
* Weekly/monthly availability dashboards
* Group meeting coordination

---
