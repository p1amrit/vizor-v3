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

io.on("connection", socket => {
    socket.on("join-room", roomID => {
        console.log(`User ${socket.id} joined room ${roomID}`);
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 10) {
                socket.emit("room-full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }

        console.log(`Room ${roomID} has users:`, users[roomID]);

        socketToRoom[socket.id] = roomID;
        socket.join(roomID); // Join the socket.io room for chat broadcasting
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("all-users", usersInThisRoom);
    });

    socket.on("sending-signal", payload => {
        io.to(payload.userToSignal).emit("user-joined", { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning-signal", payload => {
        io.to(payload.callerID).emit("receiving-returned-signal", { signal: payload.signal, id: socket.id });
    });

    socket.on("disconnect", () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        socket.broadcast.emit('user-left', socket.id);
    });

    socket.on("send-message", ({ roomID, message, sender }) => {
        io.to(roomID).emit("receive-message", { message, sender, type: 'text', timestamp: new Date() });
    });

    socket.on("upload-file", ({ roomID, fileData, fileName, fileType, sender }) => {
        socket.to(roomID).emit("receive-message", {
            message: fileName,
            fileData,
            fileType,
            sender,
            type: 'file',
            timestamp: new Date()
        });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`server is running on port ${PORT}`));
