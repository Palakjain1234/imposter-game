import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { pickRandomPair, topicList } from "./wordBank.js";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // tighten this before you deploy publicly
});

const TURN_DURATION_MS = 15_000; // 15 seconds per turn — adjust as needed

// In-memory room store.
// rooms = {
//   ROOMCODE: {
//     hostSocketId,
//     status,        // "lobby" | "word_reveal" | "describe_phase" | "voting_phase"
//     topic,
//     players: [{ id, name, socketId, connected, isImposter, word }],
//     turnOrder,     // array of player IDs, set when describe_phase starts
//     turnIndex,     // current position in turnOrder
//     turnTimer,     // Node.js Timeout ref — cleared on advance/phase-end
//     turnDeadline,  // Date.ms when current turn expires (sent to clients)
//   }
// }
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
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
    status: room.status,
    topic: room.topic || null,
    // describe_phase fields
    turnOrder: room.turnOrder || null,
    currentTurnPlayerId: room.turnOrder ? room.turnOrder[room.turnIndex] : null,
    turnDeadline: room.turnDeadline || null,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      // NOTE: never include word or isImposter here — broadcast to everyone
    })),
  };
}

// Advances turn or ends describe_phase when all players have gone.
function advanceTurn(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.status !== "describe_phase") return;

  // Clear existing timer
  if (room.turnTimer) {
    clearTimeout(room.turnTimer);
    room.turnTimer = null;
  }

  room.turnIndex += 1;

  // All players have had a turn — move to voting
  if (room.turnIndex >= room.turnOrder.length) {
    room.status = "voting_phase";
    room.turnOrder = null;
    room.turnDeadline = null;
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    return;
  }

  // Start next turn timer
  room.turnDeadline = Date.now() + TURN_DURATION_MS;
  room.turnTimer = setTimeout(() => advanceTurn(roomCode), TURN_DURATION_MS);

  io.to(roomCode).emit("room:update", publicRoomState(roomCode));
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("room:create", ({ name }, callback) => {
    const roomCode = generateRoomCode();
    const player = { id: socket.id, name, socketId: socket.id, connected: true };
    rooms[roomCode] = {
      hostSocketId: socket.id,
      status: "lobby",
      topic: null,
      players: [player],
      turnOrder: null,
      turnIndex: 0,
      turnTimer: null,
      turnDeadline: null,
    };

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    callback({ ok: true, roomCode, room: publicRoomState(roomCode), topics: topicList() });
  });

  socket.on("room:join", ({ roomCode, name }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ ok: false, error: "Room not found" });

    const player = { id: socket.id, name, socketId: socket.id, connected: true };
    room.players.push(player);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    callback({ ok: true, roomCode, room: publicRoomState(roomCode) });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  });

  socket.on("game:start", ({ topic }, callback) => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id) {
      return callback?.({ ok: false, error: "Only the host can start the game" });
    }
    if (room.players.length < 3) {
      return callback?.({ ok: false, error: "Need at least 3 players to start" });
    }

    const pair = pickRandomPair(topic);
    if (!pair) return callback?.({ ok: false, error: "Invalid topic" });

    const imposterIndex = Math.floor(Math.random() * room.players.length);
    room.players.forEach((p, i) => {
      p.isImposter = i === imposterIndex;
      p.word = p.isImposter ? pair.imposterWord : pair.majorityWord;
    });

    room.status = "word_reveal";
    room.topic = topic;

    callback?.({ ok: true });

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));

    // Privately send each player their own word only
    room.players.forEach((p) => {
      io.to(p.socketId).emit("word:assign", { word: p.word });
    });
  });

  // Host triggers start of the describe phase
  socket.on("describe:start", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id) {
      return callback?.({ ok: false, error: "Only the host can start the describe phase" });
    }
    if (room.status !== "word_reveal") {
      return callback?.({ ok: false, error: "Game is not in word reveal phase" });
    }

    // Randomize turn order from connected players
    const connected = room.players.filter((p) => p.connected);
    room.turnOrder = connected
      .map((p) => p.id)
      .sort(() => Math.random() - 0.5);
    room.turnIndex = 0;
    room.status = "describe_phase";
    room.turnDeadline = Date.now() + TURN_DURATION_MS;

    callback?.({ ok: true });

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));

    // Start the first turn timer
    room.turnTimer = setTimeout(() => advanceTurn(roomCode), TURN_DURATION_MS);
  });

  // Current player taps "Done" to end their turn early
  socket.on("turn:advance", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.status !== "describe_phase") {
      return callback?.({ ok: false, error: "Not in describe phase" });
    }

    const currentPlayerId = room.turnOrder[room.turnIndex];
    if (socket.id !== currentPlayerId) {
      return callback?.({ ok: false, error: "It's not your turn" });
    }

    callback?.({ ok: true });
    advanceTurn(roomCode);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room = rooms[roomCode];
    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) player.connected = false;

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));

    setTimeout(() => {
      const stillExists = rooms[roomCode];
      if (stillExists && stillExists.players.every((p) => !p.connected)) {
        if (stillExists.turnTimer) clearTimeout(stillExists.turnTimer);
        delete rooms[roomCode];
      }
    }, 60_000);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
