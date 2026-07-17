import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Point this at your server's address. On your phone during local testing,
// use your computer's LAN IP, not "localhost" (e.g. http://192.168.1.5:4000).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
const socket = io(SERVER_URL);

export default function App() {
  const [screen, setScreen] = useState("home"); // home | lobby
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    socket.on("room:update", (updatedRoom) => setRoom(updatedRoom));
    return () => socket.off("room:update");
  }, []);

  const createRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to create room");
      setRoom(res.room);
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

  if (screen === "lobby" && room) {
    const isHost = room.hostSocketId === socket.id;
    return (
      <div style={styles.container}>
        <h2>Room: {room.roomCode}</h2>
        <p>Share this code with the group.</p>
        <h3>Players ({room.players.length})</h3>
        <ul>
          {room.players.map((p) => (
            <li key={p.id}>
              {p.name} {p.connected ? "" : "(disconnected)"}
            </li>
          ))}
        </ul>
        {isHost ? (
          <button style={styles.button} disabled>
            Start Game (build this next)
          </button>
        ) : (
          <p>Waiting for host to start...</p>
        )}
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
  },
};
