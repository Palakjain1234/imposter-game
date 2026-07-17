import { useEffect, useState } from "react";
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

  useEffect(() => {
    socket.on("room:update", (updatedRoom) => setRoom(updatedRoom));
    socket.on("word:assign", ({ word }) => setMyWord(word));
    return () => {
      socket.off("room:update");
      socket.off("word:assign");
    };
  }, []);

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
    socket.emit(
      "room:join",
      { roomCode: roomCodeInput.trim().toUpperCase(), name },
      (res) => {
        if (!res.ok) return setError(res.error || "Failed to join room");
        setRoom(res.room);
        setScreen("lobby");
        setError("");
      }
    );
  };

  const startGame = () => {
    socket.emit("game:start", { topic: selectedTopic }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to start game");
      setError("");
    });
  };

  const formatTopic = (t) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (screen === "lobby" && room) {
    const isHost = room.hostSocketId === socket.id;

    // Word reveal phase
    if (room.status === "word_reveal") {
      return (
        <div style={styles.container}>
          <h2>Topic: {formatTopic(room.topic)}</h2>
          <div style={styles.wordCard}>
            <p style={{ margin: 0, fontSize: 14, color: "#666" }}>Your word</p>
            <h1 style={{ margin: "8px 0" }}>{myWord || "..."}</h1>
          </div>
          <p style={{ color: "#666", fontSize: 14 }}>
            Don't say this word out loud. Describe it in one word on your turn.
          </p>
          <p style={{ marginTop: 24 }}>Next: turn order + clues (build this next)</p>
        </div>
      );
    }

    // Lobby phase
    return (
      <div style={styles.container}>
        <h2>Room: {room.roomCode}</h2>
        <p>Share this code with the group.</p>
        <h3>Players ({room.players.length})</h3>
        <ul style={{ textAlign: "left" }}>
          {room.players.map((p) => (
            <li key={p.id}>
              {p.name} {p.connected ? "" : "(disconnected)"}
            </li>
          ))}
        </ul>
        {isHost ? (
          <>
            <label style={{ display: "block", margin: "12px 0 4px", fontWeight: "bold" }}>
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
          <p>Waiting for host to start...</p>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Imposter</h1>
      <input
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button style={styles.button} onClick={createRoom}>
        Create Room
      </button>
      <div style={{ margin: "16px 0" }}>— or —</div>
      <input
        style={styles.input}
        placeholder="Room code"
        value={roomCodeInput}
        onChange={(e) => setRoomCodeInput(e.target.value)}
      />
      <button style={styles.button} onClick={joinRoom}>
        Join Room
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
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
  input: {
    display: "block",
    width: "100%",
    padding: 10,
    margin: "8px 0",
    fontSize: 16,
  },
  button: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    cursor: "pointer",
    marginTop: 8,
  },
  wordCard: {
    background: "#f5f5f5",
    borderRadius: 12,
    padding: 24,
    margin: "20px 0",
  },
};
