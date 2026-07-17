import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
const socket = io(SERVER_URL);

export default function App() {
  const [screen, setScreen] = useState("home"); // home | lobby
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [myWord, setMyWord] = useState(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    socket.on("room:update", (updatedRoom) => setRoom(updatedRoom));
    socket.on("word:assign", ({ word }) => setMyWord(word));
    return () => {
      socket.off("room:update");
      socket.off("word:assign");
    };
  }, []);

  // Countdown ticker — syncs to server-provided deadline
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (room?.status === "describe_phase" && room.turnDeadline) {
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((room.turnDeadline - Date.now()) / 1000));
        setTimeLeft(remaining);
      };
      tick();
      timerRef.current = setInterval(tick, 500);
    } else {
      setTimeLeft(null);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.status, room?.turnDeadline, room?.currentTurnPlayerId]);

  const createRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to create room");
      setRoom(res.room);
      setTopics(res.topics || []);
      if (res.topics?.length) setSelectedTopic(res.topics[0]);
      setScreen("lobby");
      setError("");
    });
  };

  const joinRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    if (!roomCodeInput.trim()) return setError("Enter a room code");
    socket.emit("room:join", { roomCode: roomCodeInput.trim().toUpperCase(), name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to join room");
      setRoom(res.room);
      setScreen("lobby");
      setError("");
    });
  };

  const startGame = () => {
    socket.emit("game:start", { topic: selectedTopic }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to start game");
      setError("");
    });
  };

  const startDescribePhase = () => {
    socket.emit("describe:start", {}, (res) => {
      if (!res.ok) return setError(res.error || "Failed to start describe phase");
      setError("");
    });
  };

  const advanceTurn = () => {
    socket.emit("turn:advance", {}, (res) => {
      if (res && !res.ok) return setError(res.error || "Failed to advance turn");
      setError("");
    });
  };

  const formatTopic = (t) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (screen === "lobby" && room) {
    const isHost = room.hostSocketId === socket.id;
    const myId = socket.id;

    // ── Voting phase ────────────────────────────────────────────────────────
    if (room.status === "voting_phase") {
      return (
        <div style={styles.container}>
          <h2 style={{ color: "#333" }}>Time to vote!</h2>
          <p style={{ color: "#666" }}>
            Everyone has given their clue. Discuss and decide — who's the imposter?
          </p>
          <p style={{ marginTop: 24, color: "#888", fontSize: 14 }}>
            Voting UI coming next.
          </p>
        </div>
      );
    }

    // ── Describe phase ───────────────────────────────────────────────────────
    if (room.status === "describe_phase") {
      const currentPlayer = room.players.find((p) => p.id === room.currentTurnPlayerId);
      const isMyTurn = myId === room.currentTurnPlayerId;
      const turnIndex = room.turnOrder?.indexOf(room.currentTurnPlayerId) ?? 0;
      const totalTurns = room.turnOrder?.length ?? 0;

      return (
        <div style={styles.container}>
          <p style={styles.roomCode}>Room: {room.roomCode}</p>

          {/* Turn progress */}
          <p style={{ color: "#888", fontSize: 13, margin: "4px 0 16px" }}>
            Turn {turnIndex + 1} of {totalTurns}
          </p>

          {/* Countdown ring */}
          <div style={{
            ...styles.timerCircle,
            borderColor: timeLeft <= 5 ? "#e53935" : "#4caf50",
          }}>
            <span style={styles.timerText}>{timeLeft ?? "–"}</span>
          </div>

          {isMyTurn ? (
            <div style={{ marginTop: 20 }}>
              <h2 style={{ color: "#1565c0", margin: "0 0 6px" }}>Your turn!</h2>
              <p style={{ color: "#555", margin: "0 0 20px" }}>
                Say your one-word clue out loud.
              </p>
              <button style={styles.doneButton} onClick={advanceTurn}>
                Done
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              <h2 style={{ color: "#333", margin: "0 0 6px" }}>
                {currentPlayer?.name ?? "..."}'s turn
              </h2>
              <p style={{ color: "#888", fontSize: 14 }}>
                Waiting for them to say their clue…
              </p>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}
        </div>
      );
    }

    // ── Word reveal phase ────────────────────────────────────────────────────
    if (room.status === "word_reveal") {
      return (
        <div style={styles.container}>
          <p style={styles.roomCode}>Room: {room.roomCode}</p>
          <h2 style={{ color: "#333" }}>Topic: {formatTopic(room.topic)}</h2>
          <div style={styles.wordCard}>
            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Your word</p>
            <h1 style={{ margin: "8px 0", color: "#111" }}>{myWord || "…"}</h1>
          </div>
          <p style={{ color: "#666", fontSize: 14, margin: "0 0 24px" }}>
            Don't say this word out loud. Describe it in one word when it's your turn.
          </p>
          {isHost ? (
            <button style={styles.button} onClick={startDescribePhase}>
              Everyone's ready — Start Clues
            </button>
          ) : (
            <p style={{ color: "#888", fontSize: 14 }}>
              Waiting for host to start the clue round…
            </p>
          )}
          {error && <p style={styles.error}>{error}</p>}
        </div>
      );
    }

    // ── Lobby phase ──────────────────────────────────────────────────────────
    return (
      <div style={styles.container}>
        <h2 style={{ color: "#333" }}>Room: {room.roomCode}</h2>
        <p style={{ color: "#666" }}>Share this code with the group.</p>
        <h3 style={{ color: "#333" }}>Players ({room.players.length})</h3>
        <ul style={{ textAlign: "left" }}>
          {room.players.map((p) => (
            <li key={p.id} style={{ color: "#444", marginBottom: 4 }}>
              {p.name} {p.connected ? "" : "(disconnected)"}
            </li>
          ))}
        </ul>
        {isHost ? (
          <>
            <label style={{ display: "block", margin: "12px 0 4px", fontWeight: "bold", color: "#333" }}>
              Topic
            </label>
            <select
              style={styles.input}
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {formatTopic(t)}
                </option>
              ))}
            </select>
            <button
              style={styles.button}
              onClick={startGame}
              disabled={room.players.length < 3}
            >
              Start Game
            </button>
            {room.players.length < 3 && (
              <p style={{ color: "#888", fontSize: 14 }}>Need at least 3 players to start.</p>
            )}
          </>
        ) : (
          <p style={{ color: "#666" }}>Waiting for host to start…</p>
        )}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }

  // ── Home screen ────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <h1 style={{ color: "#111" }}>Imposter</h1>
      <input
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button style={styles.button} onClick={createRoom}>
        Create Room
      </button>
      <div style={{ margin: "16px 0", color: "#888" }}>— or —</div>
      <input
        style={styles.input}
        placeholder="Room code"
        value={roomCodeInput}
        onChange={(e) => setRoomCodeInput(e.target.value)}
      />
      <button style={styles.button} onClick={joinRoom}>
        Join Room
      </button>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: "40px auto",
    padding: 24,
    fontFamily: "sans-serif",
    textAlign: "center",
  },
  roomCode: {
    fontSize: 13,
    color: "#999",
    margin: "0 0 4px",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    display: "block",
    width: "100%",
    padding: 10,
    margin: "8px 0",
    fontSize: 16,
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    cursor: "pointer",
    marginTop: 8,
    borderRadius: 6,
    border: "none",
    background: "#1565c0",
    color: "#fff",
  },
  doneButton: {
    width: "100%",
    padding: 14,
    fontSize: 18,
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: 8,
    border: "none",
    background: "#2e7d32",
    color: "#fff",
  },
  wordCard: {
    background: "#f5f5f5",
    borderRadius: 12,
    padding: 24,
    margin: "20px 0",
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    border: "5px solid #4caf50",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    transition: "border-color 0.3s",
  },
  timerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  error: {
    color: "red",
    marginTop: 8,
  },
};
