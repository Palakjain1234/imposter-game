import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { pickPairNoRepeat, topicList, getHint } from "./wordBank.js";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // tighten this before you deploy publicly
});

const VOTE_DURATION_MS = 25_000;

// ─── Room shape ───────────────────────────────────────────────────────────────
// {
//   hostSocketId, status, topic,
//   players: [{ id, name, socketId, connected, isImposter, word, waitingForNextRound }],
//
//   // category settings (host-controlled, persists across rounds)
//   categoryMode,         // "single" | "random" | "surprise"
//   selectedCategory,     // string  — used when mode === "single"
//   selectedCategories,   // string[] — used when mode === "random"
//
//   // no-repeat tracking: Map<topic, Set<usedIndex>> — persists across Play Again,
//   // reset only on End Session
//   usedPairIndexes,
//
//   // scoreboard — persists across Play Again, reset only by End Session
//   groupScore, imposterScore, roundsPlayed,
//
//   // describe_phase (shared discussion timer — no per-player turns)
//   discussionTimer, discussionDeadline,
//
//   // voting_phase
//   votingAttempt, votes, eligibleCandidates, voteTimer, voteDeadline,
//
//   // round words (stored for results reveal)
//   majorityWord, imposterWord, imposterHint,
//
//   // game settings (host-controlled)
//   discussionDuration,   // ms — default 60000
//   imposterCount,        // number — default 1 (only 1 is functional)
//   hintMode,             // "hint" | "none"
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
    // describe_phase — shared discussion timer (replaces per-player turn fields)
    discussionDeadline: room.discussionDeadline || null,
    // voting_phase
    votingAttempt:      room.votingAttempt || null,
    voteDeadline:       room.voteDeadline || null,
    eligibleCandidates: room.eligibleCandidates || null,
    votedPlayerIds:     room.votes ? Object.keys(room.votes) : [],
    // game settings
    discussionDuration: room.discussionDuration,
    imposterCount:      room.imposterCount,
    hintMode:           room.hintMode,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      waitingForNextRound: p.waitingForNextRound || false,
      // NOTE: never include word or isImposter here
    })),
  };
}

// Pick the topic for a new round based on the room's category settings.
function pickTopicForRoom(room) {
  const all = topicList();
  if (room.categoryMode === "surprise") {
    return all[Math.floor(Math.random() * all.length)];
  }
  if (room.categoryMode === "random" && room.selectedCategories?.length > 0) {
    return room.selectedCategories[Math.floor(Math.random() * room.selectedCategories.length)];
  }
  return room.selectedCategory || all[0];
}

// Pick a pair using no-repeat tracking.
function pickPairForRoom(topic, room) {
  return pickPairNoRepeat(topic, room.usedPairIndexes);
}

// ─── Round state reset (keeps scoreboard + category settings intact) ─────────
function resetRoundState(room) {
  room.status             = "word_reveal";
  room.discussionTimer    = null;
  room.discussionDeadline = null;
  room.votingAttempt      = null;
  room.votes              = null;
  room.eligibleCandidates = null;
  room.voteTimer          = null;
  room.voteDeadline       = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function connectedPlayers(room) {
  return room.players.filter((p) => p.connected && !p.waitingForNextRound);
}

// ─── Discussion phase helpers ─────────────────────────────────────────────────

function endDiscussion(roomCode) {
  const room = rooms[roomCode];
  if (!room || room.status !== "describe_phase") return;

  if (room.discussionTimer) { clearTimeout(room.discussionTimer); room.discussionTimer = null; }

  room.status             = "voting_phase";
  room.discussionDeadline = null;
  io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  startVoting(roomCode, 1, null);
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
      majorityWord: room.majorityWord ?? null,
      imposterWord: room.imposterWord ?? null,
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
    majorityWord: room.majorityWord ?? null,
    imposterWord: room.imposterWord ?? null,
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
    const player   = { id: socket.id, name, socketId: socket.id, connected: true, waitingForNextRound: false };
    rooms[roomCode] = {
      hostSocketId: socket.id,
      status: "lobby",
      topic: null,
      players: [player],
      // category settings — default to surprise mode (pick from all categories)
      categoryMode:       "surprise",
      selectedCategory:   topics[0],
      selectedCategories: [...topics],
      // no-repeat tracking — persists across Play Again, reset on End Session
      usedPairIndexes: new Map(),
      // scoreboard
      groupScore:    0,
      imposterScore: 0,
      roundsPlayed:  0,
      // describe_phase (shared discussion timer)
      discussionTimer: null, discussionDeadline: null,
      // voting
      votingAttempt: null, votes: null, eligibleCandidates: null,
      voteTimer: null, voteDeadline: null,
      // round words
      majorityWord: null, imposterWord: null, imposterHint: null,
      // game settings
      discussionDuration: 60_000, // default 60 seconds
      imposterCount: 1,           // TODO: multi-imposter logic
      hintMode: "hint",
    };
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    callback({ ok: true, roomCode, room: publicRoomState(roomCode), topics });
  });

  socket.on("room:join", ({ roomCode, name }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ ok: false, error: "Room not found" });

    const waitingForNextRound = room.status !== "lobby";
    const player = {
      id: socket.id,
      name,
      socketId: socket.id,
      connected: true,
      waitingForNextRound,
    };
    room.players.push(player);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    callback({ ok: true, roomCode, room: publicRoomState(roomCode), waitingForNextRound });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  });

  // Rejoin after page refresh — restore player's socket association
  socket.on("player:rejoin", ({ roomCode, playerId, name }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ ok: false, error: "Session expired" });

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return callback({ ok: false, error: "Session expired" });

    // Update socket reference and reconnect
    player.socketId = socket.id;
    player.connected = true;
    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    callback({ ok: true, room: publicRoomState(roomCode), topics: topicList() });
  });

  // Player explicitly leaves the room (Quit button)
  socket.on("player:leave", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: true });

    // Remove the player entirely
    room.players = room.players.filter((p) => p.socketId !== socket.id);
    socket.leave(roomCode);
    socket.data.roomCode = null;

    // If room is empty, clean it up
    if (room.players.length === 0) {
      if (room.discussionTimer) clearTimeout(room.discussionTimer);
      if (room.voteTimer)       clearTimeout(room.voteTimer);
      delete rooms[roomCode];
      return callback?.({ ok: true });
    }

    // If host left, promote next player
    if (room.hostSocketId === socket.id && room.players.length > 0) {
      room.hostSocketId = room.players[0].socketId;
    }

    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    if (room.status === "voting_phase") maybeCloseVotingEarly(roomCode);
    callback?.({ ok: true });
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
    } else if (categoryMode === "surprise") {
      room.categoryMode = "surprise";
    } else {
      return callback?.({ ok: false, error: "Invalid category mode" });
    }
    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
  });

  // Host updates game settings (discussion duration, imposter count, hint mode)
  socket.on("settings:update", ({ discussionDuration, imposterCount, hintMode }, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can change settings" });

    if (discussionDuration !== undefined) room.discussionDuration = discussionDuration;
    if (imposterCount      !== undefined) room.imposterCount      = imposterCount; // TODO: multi-imposter logic
    if (hintMode           !== undefined) room.hintMode           = hintMode;

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

    // Clear waitingForNextRound for all players at the start of a fresh round
    room.players.forEach((p) => { p.waitingForNextRound = false; });

    const topic = pickTopicForRoom(room);
    const pair  = pickPairForRoom(topic, room);
    if (!pair) return callback?.({ ok: false, error: "Could not pick a word pair" });

    // Store majority/imposter words on the room for results reveal
    room.majorityWord = pair.majorityWord;
    room.imposterWord = pair.imposterWord;

    // Get hint for this pair (used only if hintMode === "hint")
    const hint = getHint(topic, pair.pairIndex);
    room.imposterHint = hint;

    // Bug 3 fix: only pick imposter from connected players
    const connected = connectedPlayers(room);
    const imposterPlayer = connected[Math.floor(Math.random() * connected.length)];
    room.players.forEach((p) => {
      p.isImposter = p.id === imposterPlayer.id;
      p.word       = p.isImposter ? pair.imposterWord : pair.majorityWord;
    });
    room.status = "word_reveal";
    room.topic  = topic;

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    room.players.forEach((p) => {
      const sendHint = (p.isImposter && room.hintMode === "hint") ? hint : null;
      io.to(p.socketId).emit("word:assign", {
        word: p.word,
        isImposter: p.isImposter,
        topic,
        hint: sendHint,
      });
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

    room.status             = "describe_phase";
    room.discussionDeadline = Date.now() + room.discussionDuration;

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    room.discussionTimer = setTimeout(() => endDiscussion(roomCode), room.discussionDuration);
  });

  // Host-only: end discussion early and move to voting
  socket.on("discussion:end", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can end discussion early" });
    if (room.status !== "describe_phase")
      return callback?.({ ok: false, error: "Not in discussion phase" });

    callback?.({ ok: true });
    endDiscussion(roomCode);
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

    if (room.discussionTimer) { clearTimeout(room.discussionTimer); room.discussionTimer = null; }
    if (room.voteTimer)       { clearTimeout(room.voteTimer);       room.voteTimer = null; }

    // Clear waitingForNextRound for all players when a new round begins
    room.players.forEach((p) => { p.waitingForNextRound = false; });

    const topic = pickTopicForRoom(room);
    const pair  = pickPairForRoom(topic, room);
    if (!pair) return callback?.({ ok: false, error: "Could not pick word pair" });

    // Store majority/imposter words on the room for results reveal
    room.majorityWord = pair.majorityWord;
    room.imposterWord = pair.imposterWord;

    // Get hint for this pair
    const hint = getHint(topic, pair.pairIndex);
    room.imposterHint = hint;

    // Bug 3 fix: only pick imposter from connected players
    const connected = connectedPlayers(room);
    const imposterPlayer = connected[Math.floor(Math.random() * connected.length)];
    room.players.forEach((p) => {
      p.isImposter = p.id === imposterPlayer.id;
      p.word       = p.isImposter ? pair.imposterWord : pair.majorityWord;
    });

    resetRoundState(room);
    room.topic = topic;

    callback?.({ ok: true });
    io.to(roomCode).emit("room:update", publicRoomState(roomCode));
    room.players.forEach((p) => {
      const sendHint = (p.isImposter && room.hintMode === "hint") ? hint : null;
      io.to(p.socketId).emit("word:assign", {
        word: p.word,
        isImposter: p.isImposter,
        topic,
        hint: sendHint,
      });
    });
  });

  // End Session — resets scores AND returns everyone to lobby
  socket.on("session:end", (_, callback) => {
    const roomCode = socket.data.roomCode;
    const room     = rooms[roomCode];
    if (!room) return callback?.({ ok: false, error: "Room not found" });
    if (room.hostSocketId !== socket.id)
      return callback?.({ ok: false, error: "Only the host can end the session" });

    if (room.discussionTimer) { clearTimeout(room.discussionTimer); room.discussionTimer = null; }
    if (room.voteTimer)       { clearTimeout(room.voteTimer);       room.voteTimer = null; }

    room.players.forEach((p) => { p.isImposter = false; p.word = null; p.waitingForNextRound = false; });
    room.status             = "lobby";
    room.topic              = null;
    room.groupScore         = 0;
    room.imposterScore      = 0;
    room.roundsPlayed       = 0;
    room.usedPairIndexes    = new Map(); // reset no-repeat tracking
    room.discussionDeadline = null;
    room.votingAttempt      = null;
    room.votes              = null;
    room.eligibleCandidates = null;
    room.voteDeadline       = null;
    room.majorityWord       = null;
    room.imposterWord       = null;
    room.imposterHint       = null;
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
        if (stillExists.discussionTimer) clearTimeout(stillExists.discussionTimer);
        if (stillExists.voteTimer)       clearTimeout(stillExists.voteTimer);
        delete rooms[roomCode];
      }
    }, 60_000);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
