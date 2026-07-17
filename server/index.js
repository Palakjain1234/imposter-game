import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const clientUrl = (process.env.CLIENT_URL || "*").replace(/\/$/, "");
app.use(cors({ origin: clientUrl }));
const io = new Server(server, {
  cors: { origin: clientUrl },
});

const server = http.createServer(app);

// In-memory room store. Fine for MVP — swap for Redis later if you need
// multiple server instances.
// rooms = { ROOMCODE: { hostSocketId, players: [{id, name, socketId, connected}] } }
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code;
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms[code]);
  return code;
}

function publicRoomState(roomCode) {
  const room = rooms[roomCode];
  if (!room) return null;
  return {
    roomCode,
    hostSocketId: room.hostSocketId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
    })),
  };
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("room:create", ({ name }, callback) => {
    const roomCode = generateRoomCode();
    const player = { id: socket.id, name, socketId: socket.id, connected: true };
    rooms[roomCode] = { hostSocketId: socket.id, players: [player] };

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    callback({ ok: true, roomCode, room: publicRoomState(roomCode) });
  });

  socket.on("room:join", ({ roomCode, name }, callback) => {
    const room = rooms[roomCode];
    if (!room) {
      return callback({ ok: false, error: "Room not found" });
    }

    const player = { id: socket.id, name, socketId: socket.id, connected: true };
    room.players.push(player);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    callback({ ok: true, roomCode, room: publicRoomState(roomCode) });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) player.connected = false;

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));

    // Clean up empty/fully-disconnected rooms after a delay, in case of reconnect
    setTimeout(() => {
      const stillExists = rooms[roomCode];
      if (stillExists && stillExists.players.every((p) => !p.connected)) {
        delete rooms[roomCode];
      }
    }, 60_000);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
