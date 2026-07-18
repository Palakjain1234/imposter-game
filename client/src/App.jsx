import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
const socket = io(SERVER_URL);

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META = {
  sports:      { label: "Sports",      color: "#e53935" },
  food:        { label: "Food & Drinks", color: "#e53935" },
  animals:     { label: "Animals",     color: "#e53935" },
  movies_tv:   { label: "Movies",      color: "#e53935" },
  professions: { label: "Professions", color: "#e53935" },
  nature:      { label: "Nature",      color: "#e53935" },
  technology:  { label: "Technology",  color: "#e53935" },
  party:       { label: "Party",       color: "#e53935" },
};

const formatLabel = (t) =>
  CATEGORY_META[t]?.label ?? t?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";

// ─── Ghost icon (SVG) — matches reference ────────────────────────────────────
function GhostIcon({ size = 48, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 4C14.06 4 6 12.06 6 22v18l6-4 6 4 6-4 6 4 6-4v-18C36 12.06 27.94 4 24 4z"
        fill={color}
      />
      <circle cx="18" cy="20" r="3" fill="#1a1a1a" />
      <circle cx="30" cy="20" r="3" fill="#1a1a1a" />
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState("home"); // home | lobby
  const [name, setName]                   = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom]                   = useState(null);
  const [allTopics, setAllTopics]         = useState([]);
  const [myWord, setMyWord]               = useState(null);
  const [amIImposter, setAmIImposter]     = useState(false);
  const [myTopic, setMyTopic]             = useState(null);
  const [error, setError]                 = useState("");
  const [timeLeft, setTimeLeft]           = useState(null);
  const [results, setResults]             = useState(null);
  const [hasVoted, setHasVoted]           = useState(false);
  const [roleRevealed, setRoleRevealed]   = useState(false); // per-player: has tapped "Reveal"
  const [playerRevealIdx, setPlayerRevealIdx] = useState(0); // which player is being shown
  const timerRef = useRef(null);

  useEffect(() => {
    socket.on("room:update", (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status !== "voting_phase") setHasVoted(false);
      if (updatedRoom.status !== "results")      setResults(null);
      // reset reveal state when a new round starts
      if (updatedRoom.status === "word_reveal") {
        setRoleRevealed(false);
        setPlayerRevealIdx(0);
      }
    });
    socket.on("word:assign", ({ word, isImposter, topic }) => {
      setMyWord(word);
      setAmIImposter(!!isImposter);
      setMyTopic(topic || null);
    });
    socket.on("voting:start", () => setHasVoted(false));
    socket.on("results:reveal", (payload) => setResults(payload));
    socket.on("session:reset", () => {
      setResults(null); setMyWord(null); setAmIImposter(false);
      setMyTopic(null); setHasVoted(false); setError("");
      setRoleRevealed(false); setPlayerRevealIdx(0);
    });
    return () => {
      socket.off("room:update"); socket.off("word:assign");
      socket.off("voting:start"); socket.off("results:reveal"); socket.off("session:reset");
    };
  }, []);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const deadline =
      room?.status === "describe_phase" ? room.turnDeadline :
      room?.status === "voting_phase"   ? room.voteDeadline : null;
    if (deadline) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      tick();
      timerRef.current = setInterval(tick, 500);
    } else { setTimeLeft(null); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.status, room?.turnDeadline, room?.currentTurnPlayerId, room?.voteDeadline, room?.votingAttempt]);

  // ── Emitters ───────────────────────────────────────────────────────────────
  const createRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to create room");
      setRoom(res.room); setAllTopics(res.topics || []);
      setScreen("lobby"); setError("");
    });
  };
  const joinRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    if (!roomCodeInput.trim()) return setError("Enter a room code");
    socket.emit("room:join", { roomCode: roomCodeInput.trim().toUpperCase(), name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to join room");
      setRoom(res.room); setScreen("lobby"); setError("");
    });
  };
  const saveCategorySettings = (settings) => {
    socket.emit("category:update", settings, (res) => {
      if (!res.ok) return setError(res.error || "Failed to save categories");
      setError("");
    });
  };
  const startGame = () => {
    socket.emit("game:start", {}, (res) => {
      if (!res.ok) setError(res.error || "Failed to start game");
      else setError("");
    });
  };
  const startDescribePhase = () => {
    socket.emit("describe:start", {}, (res) => {
      if (!res.ok) setError(res.error || "Failed to start");
      else setError("");
    });
  };
  const advanceTurn = () => {
    socket.emit("turn:advance", {}, (res) => {
      if (res && !res.ok) setError(res.error || "Failed to advance turn");
    });
  };
  const submitVote = (id) => {
    socket.emit("vote:submit", { votedForPlayerId: id }, (res) => {
      if (!res.ok) return setError(res.error || "Vote failed");
      setHasVoted(true); setError("");
    });
  };
  const playAgain = () => {
    socket.emit("game:again", {}, (res) => { if (!res.ok) setError(res.error || "Failed"); });
  };
  const endSession = () => {
    socket.emit("session:end", {}, (res) => { if (!res.ok) setError(res.error || "Failed"); });
  };

  // ── HOME SCREEN ────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={S.page}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {/* Ghost icon in red rounded square */}
          <div style={S.ghostBox}><GhostIcon size={52} color="#fff" /></div>
          <h1 style={S.homeTitle}>IMPOSTER</h1>
          <p style={S.homeTagline}>Find the fake. Trust no one.</p>

          {/* Feature pills */}
          <div style={S.featureRow}>
            {[
              { icon: "👤", label: "3-10\nPlayers" },
              { icon: "👁", label: "Secret\nRoles" },
              { icon: "⚡", label: "Quick\nRounds" },
            ].map((f) => (
              <div key={f.label} style={S.featureItem}>
                <span style={{ fontSize: 22 }}>{f.icon}</span>
                <span style={S.featureLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div style={S.homeBottom}>
          <input
            style={S.input}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button style={S.redPill} onClick={createRoom}>START GAME</button>
          <div style={{ margin: "12px 0", color: "#444", fontSize: 13 }}>— or join a room —</div>
          <input
            style={S.input}
            placeholder="Room code"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
          />
          <button style={{ ...S.redPill, background: "#222", border: "1px solid #333" }} onClick={joinRoom}>
            JOIN ROOM
          </button>
          {error && <p style={S.error}>{error}</p>}
        </div>
      </div>
    );
  }

  // ── IN-GAME SCREENS ────────────────────────────────────────────────────────
  if (screen === "lobby" && room) {
    const isHost = room.hostSocketId === socket.id;
    const myId   = socket.id;
    const players = room.players;

    // ── SETTINGS / LOBBY (host pre-game config) ───────────────────────────
    if (room.status === "lobby") {
      const selCats = room.selectedCategories || allTopics;
      const toggleCat = (t) => {
        const next = selCats.includes(t)
          ? selCats.filter((c) => c !== t)
          : [...selCats, t];
        saveCategorySettings({ categoryMode: "random", selectedCategories: next.length ? next : [t] });
      };
      return (
        <div style={S.page}>
          <div style={S.settingsHeader}>
            <span style={S.roomCodeBadge}>{room.roomCode}</span>
            <span style={S.settingsTitle}>Settings</span>
            <span style={{ width: 60 }} />
          </div>

          <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 100px" }}>
            {/* Players list */}
            <div style={S.section}>
              <div style={S.sectionLabel}>👤 PLAYERS ({players.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {players.map((p) => (
                  <div key={p.id} style={{ ...S.pill, background: "#2a2a2a", color: "#eee" }}>
                    {p.name}{!p.connected ? " ·" : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Word categories */}
            <div style={S.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={S.sectionLabel}>📂 WORD CATEGORIES</div>
                <span style={{ fontSize: 12, color: "#555" }}>{selCats.length}/{allTopics.length} selected</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {allTopics.map((t) => {
                  const on = selCats.includes(t);
                  return (
                    <button key={t}
                      style={{ ...S.pill, background: on ? "#e53935" : "#1e1e1e", color: on ? "#fff" : "#666", border: on ? "none" : "1px solid #2a2a2a", cursor: isHost ? "pointer" : "default" }}
                      onClick={() => isHost && toggleCat(t)}
                    >
                      {on && "✓ "}{formatLabel(t)}
                    </button>
                  );
                })}
              </div>
              <p style={{ color: "#444", fontSize: 11, marginTop: 8 }}>Tap to toggle. At least 1 required.</p>
            </div>
          </div>

          {/* Bottom actions */}
          {isHost ? (
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={startGame} disabled={players.length < 3}>
                START GAME
              </button>
              {players.length < 3 && <p style={{ color: "#555", fontSize: 12, marginTop: 6 }}>Need at least 3 players</p>}
            </div>
          ) : (
            <div style={S.bottomBar}>
              <p style={{ color: "#555", textAlign: "center" }}>Waiting for host to start…</p>
            </div>
          )}
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
        </div>
      );
    }

    // ── WORD REVEAL — pass-device flow ───────────────────────────────────────
    if (room.status === "word_reveal") {
      const orderedPlayers = players; // server order is fine
      const total          = orderedPlayers.length;
      const currentP       = orderedPlayers[playerRevealIdx];
      const isMyTurn       = currentP?.id === myId;
      const allDone        = playerRevealIdx >= total;

      // After all players have seen their word, host sees "Start Clues" screen
      if (allDone) {
        return (
          <div style={S.page}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
              <GhostIcon size={56} color="#e53935" />
              <h2 style={{ color: "#fff", marginTop: 20, fontSize: 22 }}>Everyone's ready!</h2>
              <p style={{ color: "#555", marginTop: 8 }}>All players have seen their role.</p>
            </div>
            {isHost && (
              <div style={S.bottomBar}>
                <button style={S.redPill} onClick={startDescribePhase}>START DISCUSSION</button>
              </div>
            )}
            {!isHost && <div style={S.bottomBar}><p style={{ color: "#555", textAlign: "center" }}>Waiting for host…</p></div>}
            {error && <p style={S.error}>{error}</p>}
          </div>
        );
      }

      // Pass-device screen (hidden role)
      if (!roleRevealed || currentP?.id !== myId) {
        return (
          <div style={S.page}>
            <p style={S.stepLabel}>Player {playerRevealIdx + 1} of {total}</p>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={S.eyeSlashBox}>
                <span style={{ fontSize: 36 }}>🙈</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: 22, margin: 0 }}>{currentP?.name ?? "Player"}</h2>
              <p style={{ color: "#555", fontSize: 14, margin: 0 }}>Pass the device to this player</p>
            </div>
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={() => { if (isMyTurn) setRoleRevealed(true); else setRoleRevealed(true); }}>
                👁 REVEAL MY ROLE
              </button>
              <p style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 8 }}>
                Make sure only the current player can see the screen
              </p>
            </div>
          </div>
        );
      }

      // Role reveal screen (my word / imposter)
      return (
        <div style={S.page}>
          <p style={S.stepLabel}>Player {playerRevealIdx + 1} of {total}</p>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 24px" }}>
            <div style={S.ghostBox}><GhostIcon size={44} color="#fff" /></div>
            <div style={{ ...S.roleBadge, background: amIImposter && isMyTurn ? "#e53935" : "#2e7d32" }}>
              {amIImposter && isMyTurn ? "IMPOSTER" : "CREWMATE"}
            </div>
            <h2 style={{ color: "#fff", fontSize: 24, margin: "4px 0 0", textAlign: "center" }}>
              {amIImposter && isMyTurn ? "You are the Imposter!" : `Your word is`}
            </h2>
            {!(amIImposter && isMyTurn) && (
              <div style={S.wordRevealCard}>
                <span style={S.wordRevealText}>{myWord || "…"}</span>
              </div>
            )}
            {amIImposter && isMyTurn && (
              <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", maxWidth: 280 }}>
                You don't know the secret word. Blend in and don't get caught!
              </p>
            )}
            <div style={{ marginTop: 8 }}>
              <span style={{ color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Category Hint</span>
              <p style={{ color: "#f5c842", fontSize: 16, fontWeight: "bold", margin: "4px 0 0" }}>
                {formatLabel(myTopic || room.topic)}
              </p>
            </div>
          </div>
          <div style={S.bottomBar}>
            <button style={S.nextBtn} onClick={() => { setRoleRevealed(false); setPlayerRevealIdx((i) => i + 1); }}>
              NEXT &gt;
            </button>
            <p style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 8 }}>
              Make sure only the current player can see the screen
            </p>
          </div>
        </div>
      );
    }

    // ── DESCRIBE PHASE — discussion timer ────────────────────────────────────
    if (room.status === "describe_phase") {
      const currentPlayer = players.find((p) => p.id === room.currentTurnPlayerId);
      const isMyTurn      = myId === room.currentTurnPlayerId;
      const turnIndex     = room.turnOrder?.indexOf(room.currentTurnPlayerId) ?? 0;
      const totalTurns    = room.turnOrder?.length ?? 0;
      const mins          = String(Math.floor((timeLeft ?? 0) / 60)).padStart(1, "0");
      const secs          = String((timeLeft ?? 0) % 60).padStart(2, "0");

      return (
        <div style={S.page}>
          <p style={S.stepLabel}>Player {turnIndex + 1} of {totalTurns}</p>

          {/* Big timer */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <p style={{ color: "#555", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
              ⏱ Discussion Time
            </p>
            <div style={S.bigTimer}>{mins}:{secs}</div>

            {isMyTurn ? (
              <>
                <p style={{ color: "#aaa", fontSize: 15, margin: 0 }}>Say your one-word clue out loud!</p>
                <button style={S.pauseBtn} onClick={advanceTurn}>DONE</button>
              </>
            ) : (
              <p style={{ color: "#555", fontSize: 15, margin: 0 }}>
                {currentPlayer?.name ?? "…"} is giving their clue…
              </p>
            )}

            {/* Players in this round */}
            <div style={{ width: "100%", padding: "0 20px", marginTop: 16 }}>
              <p style={{ color: "#444", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, textAlign: "left", margin: "0 0 8px" }}>Players in this round</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {players.map((p) => (
                  <div key={p.id} style={{ ...S.playerChip, background: p.id === room.currentTurnPlayerId ? "#2a1a1a" : "#1a1a1a", borderColor: p.id === room.currentTurnPlayerId ? "#e53935" : "#2a2a2a" }}>
                    <span style={{ color: "#e53935", fontSize: 12 }}>▶</span>
                    <span style={{ color: p.id === room.currentTurnPlayerId ? "#fff" : "#777", fontSize: 13, marginLeft: 6 }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {error && <p style={S.error}>{error}</p>}
        </div>
      );
    }

    // ── VOTING PHASE ─────────────────────────────────────────────────────────
    if (room.status === "voting_phase") {
      const eligible     = room.eligibleCandidates;
      const candidates   = players.filter((p) => p.id !== myId && (!eligible || eligible.includes(p.id)));
      const waitingCount = connectedCount(room) - (room.votedPlayerIds?.length ?? 0);
      const mins = String(Math.floor((timeLeft ?? 0) / 60)).padStart(1, "0");
      const secs = String((timeLeft ?? 0) % 60).padStart(2, "0");

      return (
        <div style={S.page}>
          <div style={S.settingsHeader}>
            <span style={S.roomCodeBadge}>{room.roomCode}</span>
            <span style={S.settingsTitle}>Vote</span>
            <span style={{ width: 60 }} />
          </div>

          {room.votingAttempt === 2 && (
            <div style={S.warnBanner}>⚠️ Tied! If tied again, imposter wins automatically.</div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>
            <div style={{ textAlign: "center", margin: "16px 0 20px" }}>
              <div style={S.bigTimer} suppressHydrationWarning>{mins}:{secs}</div>
              <p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Attempt {room.votingAttempt} of 2</p>
            </div>

            {hasVoted ? (
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <p style={{ color: "#4caf50", fontSize: 16, fontWeight: "bold" }}>✓ Vote submitted</p>
                <p style={{ color: "#555", fontSize: 14, marginTop: 4 }}>Waiting for {waitingCount} more…</p>
              </div>
            ) : (
              <>
                <p style={{ color: "#555", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
                  {eligible ? "Vote restricted to tied players:" : "Who is the imposter?"}
                </p>
                {candidates.map((p) => (
                  <button key={p.id} style={S.voteRow} onClick={() => submitVote(p.id)}>
                    <div style={S.voteAvatar}><GhostIcon size={20} color="#e53935" /></div>
                    <span style={{ color: "#eee", flex: 1, textAlign: "left", fontWeight: "600" }}>{p.name}</span>
                    <span style={{ color: "#333", fontSize: 18 }}>›</span>
                  </button>
                ))}
              </>
            )}
          </div>
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
        </div>
      );
    }

    // ── RESULTS ──────────────────────────────────────────────────────────────
    if (room.status === "results") {
      const groupWon       = results?.winner === "group";
      const imposterPlayer = results ? players.find((p) => p.id === results.imposterId) : null;

      let outcomeText = "";
      if (!results) outcomeText = "Tallying votes…";
      else if (results.reason === "tied_twice")           outcomeText = "The imposter fooled everyone and escaped!";
      else if (results.reason === "correct_accusation")   outcomeText = "The group caught the imposter!";
      else                                                 outcomeText = "The imposter fooled everyone!";

      return (
        <div style={S.page}>
          {/* Winner banner */}
          <div style={{ ...S.winnerBanner, background: groupWon ? "#1b3a1b" : "#3a1b1b" }}>
            <GhostIcon size={40} color={groupWon ? "#4caf50" : "#e53935"} />
            <h2 style={{ color: groupWon ? "#4caf50" : "#e53935", margin: "12px 0 4px", fontSize: 24 }}>
              {groupWon ? "Group Wins!" : "Imposter Wins!"}
            </h2>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{outcomeText}</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>
            {/* The imposters */}
            {results && (
              <>
                <p style={S.revealSectionLabel}>THE IMPOSTERS</p>
                {imposterPlayer && (
                  <div style={S.imposterRow}>
                    <div style={S.voteAvatar}><GhostIcon size={18} color="#e53935" /></div>
                    <span style={{ color: "#eee", fontWeight: "600" }}>{imposterPlayer.name}</span>
                  </div>
                )}

                {/* Secret word */}
                <p style={{ ...S.revealSectionLabel, marginTop: 20 }}>THE SECRET WORD WAS</p>
                <p style={S.secretWord}>{results.secretWord ?? myWord ?? "—"}</p>
                <p style={{ color: "#444", fontSize: 12, textAlign: "center", marginTop: 2 }}>
                  {formatLabel(room.topic)}
                </p>

                {/* Vote breakdown */}
                <p style={{ ...S.revealSectionLabel, marginTop: 20 }}>VOTES</p>
                {players.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e1e1e" }}>
                    <span style={{ color: "#aaa" }}>{p.name}</span>
                    <span style={{ color: "#e53935", fontWeight: "bold" }}>{results.votes[p.id]?.votes ?? 0}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Host actions */}
          {isHost && (
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={playAgain}>PLAY AGAIN</button>
              <button style={{ ...S.redPill, background: "transparent", border: "1px solid #333", color: "#555", marginTop: 8 }} onClick={endSession}>
                END SESSION
              </button>
            </div>
          )}
          {!isHost && <div style={S.bottomBar}><p style={{ color: "#555", textAlign: "center", fontSize: 14 }}>Waiting for host…</p></div>}
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
        </div>
      );
    }

    // fallback
    return <div style={S.page}><p style={{ color: "#555", padding: 40 }}>Loading…</p></div>;
  }

  return null;
}

function connectedCount(room) {
  return room.players.filter((p) => p.connected).length;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    maxWidth: 430, margin: "0 auto",
    minHeight: "100dvh", display: "flex", flexDirection: "column",
    background: "#111", fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: "relative", boxSizing: "border-box",
  },

  // Home
  ghostBox: {
    width: 90, height: 90, borderRadius: 22, background: "#e53935",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  homeTitle: {
    color: "#fff", fontSize: 38, fontWeight: 900, letterSpacing: 4,
    margin: "0 0 8px", textAlign: "center",
  },
  homeTagline: { color: "#555", fontSize: 14, margin: "0 0 32px", textAlign: "center" },
  featureRow: { display: "flex", gap: 28, justifyContent: "center", marginBottom: 8 },
  featureItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  featureLabel: { color: "#555", fontSize: 11, textAlign: "center", whiteSpace: "pre-line", lineHeight: 1.3 },
  homeBottom: { padding: "20px 24px 36px" },

  // Shared
  input: {
    display: "block", width: "100%", padding: "13px 16px", margin: "8px 0",
    fontSize: 16, boxSizing: "border-box", background: "#1a1a1a",
    border: "1px solid #2a2a2a", borderRadius: 12, color: "#eee", outline: "none",
  },
  redPill: {
    width: "100%", padding: "15px 0", fontSize: 15, fontWeight: 800,
    letterSpacing: 1, cursor: "pointer", borderRadius: 50, border: "none",
    background: "#e53935", color: "#fff",
  },
  error: { color: "#e53935", fontSize: 13, marginTop: 8, textAlign: "center" },

  // Settings / lobby
  settingsHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1px solid #1e1e1e",
  },
  roomCodeBadge: {
    background: "#1e1e1e", color: "#e53935", borderRadius: 8,
    padding: "4px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 2,
  },
  settingsTitle: { color: "#eee", fontWeight: 700, fontSize: 16 },
  section: { marginTop: 24 },
  sectionLabel: { color: "#555", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" },
  pill: {
    padding: "7px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none",
  },
  bottomBar: {
    padding: "12px 20px 28px", borderTop: "1px solid #1e1e1e",
    background: "#111",
  },

  // Word reveal
  stepLabel: { color: "#555", fontSize: 12, textAlign: "center", margin: "16px 0 0", letterSpacing: 1 },
  eyeSlashBox: {
    width: 80, height: 80, borderRadius: 20, background: "#1e1e1e",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  roleBadge: {
    padding: "4px 16px", borderRadius: 50, fontSize: 12, fontWeight: 800,
    letterSpacing: 2, color: "#fff",
  },
  wordRevealCard: {
    background: "#1a1a1a", borderRadius: 16, padding: "20px 32px",
    border: "1px solid #2a2a2a", marginTop: 4,
  },
  wordRevealText: { color: "#fff", fontSize: 30, fontWeight: 900 },
  nextBtn: {
    width: "100%", padding: "14px 0", fontSize: 14, fontWeight: 700,
    letterSpacing: 1, cursor: "pointer", borderRadius: 12,
    border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#aaa",
  },

  // Discussion timer
  bigTimer: {
    fontSize: 64, fontWeight: 900, color: "#fff",
    letterSpacing: -2, lineHeight: 1, fontVariantNumeric: "tabular-nums",
  },
  pauseBtn: {
    padding: "10px 32px", fontSize: 13, fontWeight: 700, letterSpacing: 1,
    cursor: "pointer", borderRadius: 8, border: "1px solid #333",
    background: "transparent", color: "#aaa",
  },
  playerChip: {
    display: "flex", alignItems: "center", padding: "10px 12px",
    borderRadius: 10, border: "1px solid #2a2a2a",
  },

  // Voting
  voteRow: {
    display: "flex", alignItems: "center", gap: 12, width: "100%",
    padding: "14px 16px", background: "#1a1a1a", borderRadius: 12,
    border: "1px solid #2a2a2a", marginBottom: 10, cursor: "pointer",
    boxSizing: "border-box",
  },
  voteAvatar: {
    width: 36, height: 36, borderRadius: "50%", background: "#2a1a1a",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  warnBanner: {
    background: "#2d1500", border: "1px solid #e65100",
    padding: "10px 20px", color: "#ff9800", fontSize: 13,
  },

  // Results
  winnerBanner: {
    padding: "28px 20px 20px", display: "flex", flexDirection: "column",
    alignItems: "center", textAlign: "center",
  },
  revealSectionLabel: {
    color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: 2,
    textTransform: "uppercase", margin: "0 0 10px",
  },
  imposterRow: {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
    background: "#1e1e1e", borderRadius: 10,
  },
  secretWord: {
    color: "#4caf50", fontSize: 28, fontWeight: 900, textAlign: "center",
    margin: "8px 0 2px",
  },
};
