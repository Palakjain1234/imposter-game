import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { pickRandomPair, pickRandomPairFromTopics, topicList } from "./wordBank.js";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // tighten this before you deploy publicly
});

const TURN_DURATION_MS = 15_000;
const VOTE_DURATION_MS = 25_000;

// ─── Room shape ───────────────────────────────────────────────────────────────
// {
//   hostSocketId, status, topic,
//   players: [{ id, name, socketId, connected, isImposter, word }],
//
//   // category settings (host-controlled, persists across rounds)
//   categoryMode,         // "single" | "random"
//   selectedCategory,     // string  — used when mode === "single"
//   selectedCategories,   // string[] — used when mode === "random"
//
//   // scoreboard — persists across Play Again, reset only by End Session
//   groupScore, imposterScore, roundsPlayed,
//
//   // describe_phase
//   turnOrder, turnIndex, turnTimer, turnDeadline,
//
//   // voting_phase
//   votingAttempt, votes, eligibleCandidates, voteTimer, voteDeadline,
// }
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 5 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
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
    // category settings — safe to broadcast (no secrets)
    categoryMode:       room.categoryMode,
    selectedCategory:   room.selectedCategory,
    selectedCategories: room.selectedCategories,
    // scoreboard
    groupScore:    room.groupScore,
    imposterScore: room.imposterScore,
    roundsPlayed:  room.roundsPlayed,
    // describe_phase
    turnOrder:           room.turnOrder || null,
    currentTurnPlayerId: room.turnOrder ? room.turnOrder[room.turnIndex] : null,
    turnDeadline:        room.turnDeadline || null,
    // voting_phase
    votingAttempt:      room.votingAttempt || null,
    voteDeadline:       room.voteDeadline || null,
    eligibleCandidates: room.eligibleCandidates || null,
    votedPlayerIds:     room.votes ? Object.keys(room.votes) : [],
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      // NOTE: never include word or isImposter here
    })),
  };
}

// Pick the topic for a new round based on the room's category settings.
function pickTopicForRoom(room) {
  if (room.categoryMode === "random" && room.selectedCategories?.length > 0) {
    return room.selectedCategories[
      Math.floor(Math.random() * room.selectedCategories.length)
    ];
  }
  return room.selectedCategory || topicList()[0];
}

// ─── Round state reset (keeps scoreboard + category settings intact) ─────────
function resetRoundState(room) {
  room.status             = "word_reveal";
  room.turnOrder          = null;
  room.turnIndex          = 0;
  room.turnTimer          = null;
  room.turnDeadline       = null;
  room.votingAttempt      = null;
  room.votes              = null;
  room.eligibleCandidates = null;
  room.voteTimer          = null;
  room.voteDeadline       = null;
}

// ─── Turn helpers ─────────────────────────────────────────────────────────────

function connectedPlayers(room) {
  return room.players.filter((p) => p.connected);
}

function advanceTurn(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.status !== "describe_phase") return;

  if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }

  room.turnIndex += 1;

  if (room.turnIndex >= room.turnOrder.length) {
    room.status       = "voting_phase";
    room.turnOrder    = null;
    room.turnDeadline = null;
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    startVoting(roomCode, 1, null);
    return;
  }

  room.turnDeadline = Date.now() + TURN_DURATION_MS;
  room.turnTimer    = setTimeout(() => advanceTurn(roomCode), TURN_DURATION_MS);
  io.to(roomCode).emit("room:update", publicRoomState(roomCode));
}

// ─── Voting helpers ───────────────────────────────────────────────────────────

function startVoting(roomCode, attempt, eligibleCandidates) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.voteTimer) { clearTimeout(room.voteTimer); room.voteTimer = null; }

  room.votingAttempt      = attempt;
  room.votes              = {};
  room.eligibleCandidates = eligibleCandidates;
  room.voteDeadline       = Date.now() + VOTE_DURATION_MS;

  io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  io.to(roomCode).emit("voting:start", {
    attempt,
    timeRemaining: VOTE_DURATION_MS,
    tiedPlayerIds: eligibleCandidates || null,
    warning: attempt === 2,
  });

  room.voteTimer = setTimeout(() => closeVoting(roomCode), VOTE_DURATION_MS);
}

function closeVoting(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.status !== "voting_phase") return;

  if (room.voteTimer) { clearTimeout(room.voteTimer); room.voteTimer = null; }

  const tally = {};
  for (const votedForId of Object.values(room.votes)) {
    tally[votedForId] = (tally[votedForId] || 0) + 1;
  }

  const maxVotes   = Math.max(0, ...Object.values(tally));
  const topPlayers = Object.keys(tally).filter((id) => tally[id] === maxVotes);

  const imposter   = room.players.find((p) => p.isImposter);
  const imposterId = imposter?.id ?? null;

  const voteBreakdown = {};
  room.players.forEach((p) => {
    voteBreakdown[p.id] = { name: p.name, votes: tally[p.id] || 0 };
  });

  room.status = "results";

  if (topPlayers.length > 1) {
    if (room.votingAttempt === 1) {
      startVoting(roomCode, 2, topPlayers);
      return;
    }
    room.imposterScore += 1;
    room.roundsPlayed  += 1;
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    io.to(roomCode).emit("results:reveal", {
      imposterId,
      accusedId: null,
      tied: true,
      votes: voteBreakdown,
      winner: "imposter",
      reason: "tied_twice",
      secretWord: imposter?.word ?? null,
      groupScore:    room.groupScore,
      imposterScore: room.imposterScore,
      roundsPlayed:  room.roundsPlayed,
    });
    return;
  }

  const accusedId         = topPlayers[0] ?? null;
  const accusedIsImposter = accusedId === imposterId;
  const winner            = accusedIsImposter ? "group" : "imposter";

  if (winner === "group") room.groupScore    += 1;
  else                    room.imposterScore += 1;
  room.roundsPlayed += 1;

  io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  io.to(roomCode).emit("results:reveal", {
    imposterId,
    accusedId,
    tied: false,
    votes: voteBreakdown,
    winner,
    reason: accusedIsImposter ? "correct_accusation" : "wrong_accusation",
    secretWord: imposter?.word ?? null,
    groupScore:    room.groupScore,
    imposterScore: room.imposterScore,
    roundsPlayed:  room.roundsPlayed,
  });
}

function maybeCloseVotingEarly(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.status !== "voting_phase") return;
  const allVoted = connectedPlayers(room).every((p) => room.votes[p.id] !== undefined);
  if (allVoted) closeVoting(roomCode);
}

// ─── Socket handlers ──────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("room:create", ({ name }, callback) => {
    const roomCode = generateRoomCode();
    const topics   = topicList();
    const player   = { id: socket.id, name, socketId: socket.id, connected: true };
    rooms[roomCode] = {
      hostSocketId: socket.id,
      status: "lobby",
      topic: null,
      players: [player],
      // category settings — default to single mode, first topic selected
      categoryMode:       "single",
      selectedCategory:   topics[0],
      selectedCategories: [...topics], // all on by default in random mode
      // scoreboard
      groupScore:    0,
      imposterScore: 0,
      roundsPlayed:  0,
      // describe
      turnOrder: null, turnIndex: 0, turnTimer: null, turnDeadline: null,
      // voting
      votingAttempt: null, votes: null, eligibleCandidates: null,
      voteTimer: null, voteDeadline: null,
    };
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    callback({ ok: true, roomCode, room: publicRoomState(roomCode), topics });
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

  // Host updates category settings (available any time from lobby or results)
  socket.on("category:update", ({ categoryMode, selectedCategory, selectedCategories }, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can change categories" });

    if (categoryMode === "single") {
      if (!selectedCategory) return callback?.({ ok: false, error: "No category selected" });
      room.categoryMode     = "single";
      room.selectedCategory = selectedCategory;
    } else if (categoryMode === "random") {
      if (!selectedCategories || selectedCategories.length === 0)
        return callback?.({ ok: false, error: "Select at least one category" });
      room.categoryMode       = "random";
      room.selectedCategories = selectedCategories;
    } else {
      return callback?.({ ok: false, error: "Invalid category mode" });
    }

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  });

  socket.on("game:start", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can start the game" });
    if (room.players.length < 3)
      return callback?.({ ok: false, error: "Need at least 3 players to start" });

    const topic = pickTopicForRoom(room);
    const pair  = pickRandomPair(topic);
    if (!pair) return callback?.({ ok: false, error: "Could not pick a word pair" });

    const imposterIndex = Math.floor(Math.random() * room.players.length);
    room.players.forEach((p, i) => {
      p.isImposter = i === imposterIndex;
      p.word       = p.isImposter ? pair.imposterWord : pair.majorityWord;
    });
    room.status = "word_reveal";
    room.topic  = topic;

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    room.players.forEach((p) => {
      io.to(p.socketId).emit("word:assign", { word: p.word, isImposter: p.isImposter, topic });
    });
  });

  socket.on("describe:start", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can start the describe phase" });
    if (room.status !== "word_reveal")
      return callback?.({ ok: false, error: "Game is not in word reveal phase" });

    const connected   = connectedPlayers(room);
    room.turnOrder    = connected.map((p) => p.id).sort(() => Math.random() - 0.5);
    room.turnIndex    = 0;
    room.status       = "describe_phase";
    room.turnDeadline = Date.now() + TURN_DURATION_MS;

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    room.turnTimer = setTimeout(() => advanceTurn(roomCode), TURN_DURATION_MS);
  });

  socket.on("turn:advance", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.status !== "describe_phase")
      return callback?.({ ok: false, error: "Not in describe phase" });
    if (socket.id !== room.turnOrder[room.turnIndex])
      return callback?.({ ok: false, error: "It's not your turn" });

    callback?.({ ok: true });
    advanceTurn(roomCode);
  });

  socket.on("vote:submit", ({ votedForPlayerId }, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.status !== "voting_phase")
      return callback?.({ ok: false, error: "Not in voting phase" });
    if (room.votes[socket.id] !== undefined)
      return callback?.({ ok: false, error: "You already voted" });
    if (votedForPlayerId === socket.id)
      return callback?.({ ok: false, error: "You can't vote for yourself" });
    if (room.eligibleCandidates && !room.eligibleCandidates.includes(votedForPlayerId))
      return callback?.({ ok: false, error: "That player is not a valid candidate in this round" });
    if (!room.players.find((p) => p.id === votedForPlayerId))
      return callback?.({ ok: false, error: "Player not found" });

    room.votes[socket.id] = votedForPlayerId;
    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    maybeCloseVotingEarly(roomCode);
  });

  // Play Again — resets round state, picks a new topic, keeps scoreboard
  socket.on("game:again", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can restart" });

    if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }
    if (room.voteTimer) { clearTimeout(room.voteTimer); room.voteTimer = null; }

    const topic = pickTopicForRoom(room);
    const pair  = pickRandomPair(topic);
    if (!pair) return callback?.({ ok: false, error: "Could not pick word pair" });

    const imposterIndex = Math.floor(Math.random() * room.players.length);
    room.players.forEach((p, i) => {
      p.isImposter = i === imposterIndex;
      p.word       = p.isImposter ? pair.imposterWord : pair.majorityWord;
    });

    resetRoundState(room);
    room.topic = topic;

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    room.players.forEach((p) => {
      io.to(p.socketId).emit("word:assign", { word: p.word, isImposter: p.isImposter, topic });
    });
  });

  // End Session — resets scores AND returns everyone to lobby
  socket.on("session:end", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can end the session" });

    if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }
    if (room.voteTimer) { clearTimeout(room.voteTimer); room.voteTimer = null; }

    room.players.forEach((p) => { p.isImposter = false; p.word = null; });
    room.status             = "lobby";
    room.topic              = null;
    room.groupScore         = 0;
    room.imposterScore      = 0;
    room.roundsPlayed       = 0;
    room.turnOrder          = null;
    room.turnIndex          = 0;
    room.turnDeadline       = null;
    room.votingAttempt      = null;
    room.votes              = null;
    room.eligibleCandidates = null;
    room.voteDeadline       = null;
    // category settings survive — host keeps their preferences

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    io.to(roomCode).emit("session:reset");
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    const room   = rooms[roomCode];
    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) player.connected = false;

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));

    if (room.status === "voting_phase") maybeCloseVotingEarly(roomCode);

    setTimeout(() => {
      const stillExists = rooms[roomCode];
      if (stillExists && stillExists.players.every((p) => !p.connected)) {
        if (stillExists.turnTimer) clearTimeout(stillExists.turnTimer);
        if (stillExists.voteTimer) clearTimeout(stillExists.voteTimer);
        delete rooms[roomCode];
      }
    }, 60_000);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
