🎬 YouTube Watch Party System

🍿 Watch YouTube videos together in real time with synchronized playback, rooms, and role-based access.

🚀 Live Application

🌐 Frontend:
https://youtube-watch-party-system-ten.vercel.app/

⚙️ Backend:
https://youtube-watch-party-system-g853.onrender.com/


✨ Features

🏠 Create and join watch party rooms

🎥 Synchronized YouTube playback

▶️ Play / ⏸️ Pause synchronization

⏩ Seek synchronization

🔄 Change YouTube video for everyone

👑 Host role with full control

🛡️ Moderator role for playback control

👤 Participant role with restricted controls

🔐 Backend role-based permission validation

👥 View room participants and roles

🚫 Host can remove participants

🔄 Host can transfer the Host role

📨 Participants can request playback changes for approval

💬 Real-time room chat

🛠️ Tech Stack

Frontend: React + JavaScript + Vite

Backend: Node.js + Express

Database: MongoDB

Real-Time: Socket.IO

Video: YouTube IFrame Player API

⚙️ Setup & Run

🔧 Backend

cd backend
npm install

Create a .env file:

PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173

Run the backend:

npm run dev

Backend:

http://localhost:5000

💻 Frontend

Open a new terminal:

cd frontend
npm install

Create a .env file:

VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

Run the frontend:

npm run dev

Frontend:

http://localhost:5173

🔌 WebSocket Integration

Socket.IO is used for real-time communication between users in the same room.

👤 User Action
      ↓
⚛️ React
      ↓
🔌 Socket.IO
      ↓
🖥️ Backend
      ↓
🔐 Permission Check
      ↓
💾 Update Room State
      ↓
📢 Broadcast Event
      ↓
👥 All Room Participants

When an authorized user plays, pauses, seeks, or changes the video, the server broadcasts the updated state to all connected users so everyone stays synchronized.

🏗️ Architecture

                ⚛️ React Frontend
                       │
             ┌─────────┴─────────┐
             │                   │
          REST API           Socket.IO
             │                   │
             ↓                   ↓
        Express.js         Room Socket Events
             │                   │
             └─────────┬─────────┘
                       ↓
                🧠 Room Service
                       ↓
                 🗄️ MongoDB

🧑‍💻 Code Walkthrough

Backend

server.js → Starts server, Socket.IO and database

roomController.js → Handles room API requests

roomService.js → Contains room and business logic

Room.js → MongoDB schema

roomSocket.js → Handles real-time Socket.IO events

permissions.js → Role-based permission rules

Frontend

RoomPage.jsx → Main watch room

YouTubePlayer.jsx → YouTube player and playback synchronization

SocketContext.jsx → Socket.IO connection

ParticipantsPanel.jsx → Participants and roles

ApprovalPanel.jsx → Participant action requests

📌 Roles

Role

Permissions

👑 Host

Full room and playback control

🛡️ Moderator

Play, pause, seek and change video

👤 Participant

Watch and request changes for approval

🎯 Assignment Deliverables

✅ Working local application

✅ Public deployment

✅ Room creation and joining

✅ Role-based access

✅ Playback synchronization

✅ Seek synchronization

✅ Video change synchronization

✅ Participant management

✅ Approval workflow

✅ Basic chat

✅ Architecture overview