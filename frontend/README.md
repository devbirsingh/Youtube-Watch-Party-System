# WatchTogether Frontend

React + Vite frontend for the YouTube Watch Party MVP.

## Run

```bash
npm install
npm run dev
```

Create `.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Included

- Create and join rooms
- YouTube playback synchronization
- Host / Moderator / Participant roles
- Participant approval requests
- Participant management
- Host transfer
- Room chat using Socket.IO
