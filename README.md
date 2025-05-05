# 📅 FullCalendar.io Clone — Powered by Firebase + React + TypeScript

A feature-rich calendar app inspired by [FullCalendar.io](https://fullcalendar.io), supercharged with:

* 🔐 Firebase Authentication
* 💬 Real-time Chat (with availability filtering)
* 📆 Smart Meeting Scheduling
* 🎥 Jitsi Meet Video Calls
* 🔔 Push Notifications
* ⚛️ Built with React + TypeScript

---

## 🧩 Features

### ✅ Authentication

* Secure login via Firebase Auth
* Supports email/password + OAuth (configurable)

### 💬 Real-Time Chat

* Built using Firebase Firestore
* Chat is only enabled between users with scheduled events
* Interfaces: `ChatBox.tsx`, `MessagesSection.tsx`
* State managed by `ChatContext.tsx`

### 📆 Intelligent Event Scheduling

* Events created via `Calendar.tsx` + `EventModal.tsx`
* Suggests available users dynamically via `UserSearchModal.tsx`
* Scheduled users are notified and added to calendar
* Creates eligibility for chat & video call

### 🎥 Video Meetings via Jitsi

* Jitsi Meet integrated for seamless in-browser video calls
* Accessible only with participants of scheduled events
* No app installation required

### 📤 Push Notifications

* Integrated with Firebase Cloud Messaging
* Alerts for:

  * Chat messages
  * Event invitations
  * Video meeting reminders

---

## 🏗️ Project Structure

```
src/
├── components/
│   └── views/
│       ├── Calendar.tsx
│       ├── ChatBox.tsx
│       ├── EventModal.tsx
│       ├── NewEventPopover.tsx
│       ├── UserSearchModal.tsx
│       ├── MessagesSection.tsx
│       ├── Header.tsx
│       └── JitsiMeetRoom.tsx         # (video call logic, if modularized)
│
├── context/
│   ├── ChatContext.tsx
│   ├── EventContext.tsx
│   └── UserSearchContext.tsx
│
├── auth.tsx
├── firebaseConfig.ts
├── types.ts
├── App.tsx
├── main.tsx
└── index.css
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

* Event is created in `EventModal.tsx`
* System checks Firestore for available users using `UserSearchModal.tsx`
* Once scheduled:

  * Event added to both calendars
  * Participants can chat and join Jitsi meetings
  * Notifications sent via FCM

---

## 🔐 Security

* Role-based access via Firestore rules
* Chat and video calls scoped only to event participants
* All actions gated through Firebase Auth

---

## 🧑‍💻 Author

**Priyanka Hotkar**
[GitHub](https://github.com/priyankahotkar) · [LinkedIn](https://linkedin.com/in/priyanka-hotkar-3a667a259) · [Portfolio](https://priyankahotkar.github.io/Portfolio/)

---

## 🌟 Future Enhancements

* Calendar analytics dashboards
* Advanced availability conflict resolution
* Cross-platform meeting reminders

---

🚀 Live Demo
Check out the working application here:
👉 https://fullcalender-1bddf.web.app/

🌐 Hosted via Firebase Hosting | Best viewed on desktop
