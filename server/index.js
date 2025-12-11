import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const users = {};
const socketToRoom = {};
const socketToName = {};

const roomHosts = {};

io.on("connection", socket => {
    socket.on("join-room", payload => {
        // Handle legacy string payload or new object payload
        const roomID = typeof payload === 'object' ? payload.roomID : payload;
        const username = typeof payload === 'object' ? payload.username : 'Guest';

        console.log(`User ${socket.id} (${username}) joined room ${roomID}`);

        socketToName[socket.id] = username;

        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 30) {
                socket.emit("room-full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
            // First user is the host
            roomHosts[roomID] = socket.id;
            socket.emit("set-host", true);
        }

        console.log(`Room ${roomID} has users:`, users[roomID]);

        socketToRoom[socket.id] = roomID;
        socket.join(roomID); // Join the socket.io room for chat broadcasting
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all-users", usersInThisRoom);

        // Let the user know if they are host (redundant check for non-creators)
        if (roomHosts[roomID] === socket.id) {
            socket.emit("set-host", true);
        } else {
            socket.emit("set-host", false);
        }
    });

    socket.on("sending-signal", payload => {
        // Security & Stability: Force callerID to be the actual socket ID
        io.to(payload.userToSignal).emit("user-joined", {
            signal: payload.signal,
            callerID: socket.id,
            username: payload.username // Pass username through
        });
    });

    socket.on("returning-signal", payload => {
        io.to(payload.callerID).emit("receiving-returned-signal", { signal: payload.signal, id: socket.id });
    });

    socket.on("kick-user", ({ roomID, targetID }) => {
        // Only allow if requester is the host
        if (roomHosts[roomID] === socket.id) {
            io.to(targetID).emit("kicked");
            // Disconnect the user
            io.sockets.sockets.get(targetID)?.disconnect(true);
        }
    });

    socket.on("disconnect", () => {
        const roomID = socketToRoom[socket.id];
        const name = socketToName[socket.id] || 'User';

        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
            // Notify remaining users to remove the peer
            socket.to(roomID).emit('user-left', { id: socket.id, name });

            // Host Migration
            if (roomHosts[roomID] === socket.id) {
                if (room.length > 0) {
                    const newHost = room[0];
                    roomHosts[roomID] = newHost;
                    io.to(newHost).emit("set-host", true);
                } else {
                    delete roomHosts[roomID];
                }
            }

            // Clean up
            delete socketToName[socket.id];
        }
    });

    socket.on("send-message", ({ roomID, message, sender }) => {
        // Broadcast to everyone in room including sender (so they see their own message confirmed from server)
        io.in(roomID).emit("receive-message", { message, sender, type: 'text', timestamp: new Date() });
    });

    socket.on("upload-file", ({ roomID, fileData, fileName, fileType, sender }) => {
        io.in(roomID).emit("receive-message", {
            message: fileName,
            fileData,
            fileType,
            sender,
            type: 'file',
            timestamp: new Date()
        });
    });

    socket.on("send-reaction", ({ roomID, reaction, sender }) => {
        io.in(roomID).emit("receive-reaction", { reaction, sender, id: Math.random().toString(36).substr(2, 9) });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`server is running on port ${PORT}`));
