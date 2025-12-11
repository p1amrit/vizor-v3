# VIZOR - Video Conferencing Application
## Technical Documentation & Project Report

### 1. Project Overview
VIZOR is a real-time video conferencing application designed to facilitate seamless communication through video, audio, and text chat. It allows instant meetings without login requirements, emphasizing ease of use and performance.

### 2. Technology Stack

#### Frontend (Client-Side)
*   **Framework**: React.js (Vite) - Chosen for its speed and component-based architecture.
*   **Language**: JavaScript (ES6+).
*   **Styling**: Tailwind CSS - For modern, responsive, and rapid UI development.
*   **State Management**: React Hooks (`useState`, `useEffect`, `useRef`).
*   **Routing**: React Router DOM - For managing navigation between Home and Room pages.
*   **Animations**: Framer Motion - For smooth UI transitions.
*   **Icons**: Lucide React.

#### Backend (Server-Side)
*   **Runtime**: Node.js.
*   **Framework**: Express.js - Lightweight server for handling HTTP requests.
*   **Real-time Communication**: Socket.IO - Used for signaling (handshake) between peers.

#### Core Communication Technologies
*   **WebRTC (Web Real-Time Communication)**: The core technology enabling peer-to-peer (P2P) audio and video streaming directly between browsers without going through the server (reducing latency and server load).
*   **Simple-Peer**: A wrapper library around WebRTC to simplify the creation of P2P connections and signaling.

### 3. System Architecture

VIZOR follows a **Mesh Network Topology** for video calls:
1.  **Signaling Server**: The Node.js server acts as a "matchmaker". It helps two browsers find each other by exchanging "signals" (SDP - Session Description Protocol). Once connected, the server is largely out of the loop for video data.
2.  **P2P Connections**: Every user creates a direct connection with every other user in the room.
    *   *Example*: If there are 3 users (A, B, C), A connects to B, A connects to C, and B connects to C.
    *   *Pros*: Low latency, high privacy (video doesn't transit the server).
    *   *Cons*: High bandwidth usage on the client side for large groups.

### 4. Key Features & Implementation Details

#### A. Video & Audio Calling
*   **How it works**: Uses `navigator.mediaDevices.getUserMedia` to access the camera/mic. The stream is attached to a `<video>` element locally and sent via the WebRTC stream to peers.

#### B. Screen Sharing
*   **How it works**: Uses `navigator.mediaDevices.getDisplayMedia`.
*   **Logic**: When activated, the app replaces the *video track* in the outgoing stream with the *screen track*. This allows peers to see the screen immediately without needing to re-connect.
*   **Mobile Handling**: Explicitly restricted on mobile browsers due to OS limitations, preventing crashes.

#### C. Real-time Chat, File Sharing, & Reactions
*   **Chat**: Goes through Socket.IO. User A types -> Server Broadcasts -> All Users Render.
*   **File Sharing**: converted to `DataURL` (base64) strings (5MB limit).
*   **Reactions**: Users can send animated floating emojis (👍, ❤️, 😂, etc.) that appear on everyone's screen instantly using `framer-motion`.

#### D. Dynamic Room & User Management
*   **Room IDs**: Generated randomly or user-defined URLs.
*   **Join Logic**: Users enter a Name -> Name saved to LocalStorage -> Join Room.
*   **Peer Discovery**: When User A joins, the server sends them a list of existing users. User A creates "Initiator" peers for each existing user.

### 5. Deployment Pipeline

*   **Frontend**: Deployed on **Vercel**.
    *   *Benefits*: Global CDN, automatic builds from Git, fast loading.
*   **Backend**: Deployed on **Render**.
    *   *Benefits*: Managed Node.js environment, automatic HTTPS, continuous deployment.

### 6. Challenges Solved
*   **Video Glitches**: Solved by ensuring the `signal` event contains the correct `socket.id` of the caller, preventing conflicting peer IDs.
*   **Mobile Typing**: Fixed the "zoom-in" issue on mobile by enforcing 16px font size on inputs and switching from `textarea` to `input` handling.
*   **Auto-Join Bug**: Fixed a logic error where checking `!username` caused the app to join immediately upon typing one character.

### 7. Future Scope
*   **Turn Server**: Implementing a custom TURN server to bypass strict firewalls (currently using public STUN servers).
*   **Authentication**: Adding Google/Email login for persistent user history.
*   **Recording**: Adding server-side recording capabilities.

---
*Built by Amrit Kumar Gupta & Team (Sunny Yadav, Abhinav Singh, Talib Shiddique) under the guidance of Mr. Vidhu Sharma & Mr. Rahul Gupta at SRGI Lucknow.*
