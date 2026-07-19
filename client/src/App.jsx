import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";
const socket = io(SERVER_URL);

// ─── Category metadata ────────────────────────────────────────────────────────
const CATEGORY_META = {
  sports:      { label: "Sports",       color: "#e53935" },
  food:        { label: "Food & Drinks", color: "#e53935" },
  animals:     { label: "Animals",      color: "#e53935" },
  movies_tv:   { label: "Movies & TV",  color: "#e53935" },
  professions: { label: "Professions",  color: "#e53935" },
  nature:      { label: "Nature",       color: "#e53935" },
  technology:  { label: "Technology",   color: "#e53935" },
  space:       { label: "Space",        color: "#e53935" },
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
  const [myVotedId, setMyVotedId]         = useState(null); // which candidate I voted for
  const [roleRevealed, setRoleRevealed]   = useState(false); // this player has tapped Reveal on their own phone
  const timerRef = useRef(null);

  useEffect(() => {
    socket.on("room:update", (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status !== "voting_phase") { setHasVoted(false); setMyVotedId(null); }
      if (updatedRoom.status !== "results")      setResults(null);
      // reset reveal state when a new round starts
      if (updatedRoom.status === "word_reveal") {
        setRoleRevealed(false);
      }
    });
    socket.on("word:assign", ({ word, isImposter, topic }) => {
      setMyWord(word);
      setAmIImposter(!!isImposter);
      setMyTopic(topic || null);
    });
    socket.on("voting:start", () => { setHasVoted(false); setMyVotedId(null); });
    socket.on("results:reveal", (payload) => setResults(payload));
    socket.on("session:reset", () => {
      setResults(null); setMyWord(null); setAmIImposter(false);
      setMyTopic(null); setHasVoted(false); setMyVotedId(null); setError("");
      setRoleRevealed(false);
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
      setHasVoted(true); setMyVotedId(id); setError("");
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
      const mode    = room.categoryMode || "surprise";
      const selCats = room.selectedCategories || allTopics;

      const toggleCat = (t) => {
        const next = selCats.includes(t)
          ? selCats.filter((c) => c !== t)
          : [...selCats, t];
        saveCategorySettings({ categoryMode: "random", selectedCategories: next.length ? next : [t] });
      };
      const setMode = (m) => {
        if (m === "surprise")  saveCategorySettings({ categoryMode: "surprise" });
        if (m === "single")    saveCategorySettings({ categoryMode: "single", selectedCategory: room.selectedCategory || allTopics[0] });
        if (m === "random")    saveCategorySettings({ categoryMode: "random", selectedCategories: selCats });
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

            {/* Category mode — 3-way segmented control */}
            <div style={S.section}>
              <div style={S.sectionLabel}>📂 WORD CATEGORIES</div>
              <div style={SEG.row}>
                {[
                  { key: "surprise", label: "🎲 Surprise" },
                  { key: "random",   label: "✦ Mix" },
                  { key: "single",   label: "⊙ Single" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    style={{ ...SEG.btn, ...(mode === opt.key ? SEG.active : {}) }}
                    onClick={() => isHost && setMode(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Surprise mode description */}
              {mode === "surprise" && (
                <p style={SEG.desc}>
                  The system will pick a random category from all {allTopics.length} available categories each round.
                </p>
              )}

              {/* Single mode — tap one category */}
              {mode === "single" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {allTopics.map((t) => {
                    const on = room.selectedCategory === t;
                    return (
                      <button key={t}
                        style={{ ...S.pill, background: on ? "#e53935" : "#1e1e1e", color: on ? "#fff" : "#666", border: on ? "none" : "1px solid #2a2a2a", cursor: isHost ? "pointer" : "default" }}
                        onClick={() => isHost && saveCategorySettings({ categoryMode: "single", selectedCategory: t })}
                      >
                        {on && "✓ "}{formatLabel(t)}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Random mode — multi-select */}
              {mode === "random" && (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>{selCats.length}/{allTopics.length} selected</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
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
                </>
              )}
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

    // ── WORD REVEAL — each player sees their own role on their own phone ────
    if (room.status === "word_reveal") {
      // Count how many players have NOT yet revealed (use votedPlayerIds slot reuse
      // is wrong — we track readiness differently). For the host "Start Discussion"
      // button we just always show it once roleRevealed is true for the host.

      // HIDDEN state — player hasn't tapped Reveal yet
      if (!roleRevealed) {
        return (
          <div style={S.page}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={S.eyeSlashBox}>
                <span style={{ fontSize: 36 }}>🙈</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: 22, margin: 0 }}>Your turn to look</h2>
              <p style={{ color: "#555", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 260 }}>
                Make sure no one else can see your screen, then tap to reveal your role
              </p>
            </div>
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={() => setRoleRevealed(true)}>
                👁 REVEAL MY ROLE
              </button>
              <p style={{ color: "#444", fontSize: 11, textAlign: "center", marginTop: 8 }}>
                Make sure only you can see the screen
              </p>
            </div>
          </div>
        );
      }

      // REVEALED state — show word or imposter role
      return (
        <div style={S.page}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 24px" }}>
            <div style={S.ghostBox}><GhostIcon size={44} color="#fff" /></div>
            <div style={{ ...S.roleBadge, background: amIImposter ? "#e53935" : "#2e7d32" }}>
              {amIImposter ? "IMPOSTER" : "CREWMATE"}
            </div>
            <h2 style={{ color: "#fff", fontSize: 24, margin: "4px 0 0", textAlign: "center" }}>
              {amIImposter ? "You are the Imposter!" : "Your word is"}
            </h2>
            {!amIImposter && (
              <div style={S.wordRevealCard}>
                <span style={S.wordRevealText}>{myWord || "…"}</span>
              </div>
            )}
            {amIImposter && (
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
          {/* Host gets the Start Discussion button; everyone else just waits */}
          {isHost ? (
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={startDescribePhase}>START DISCUSSION</button>
            </div>
          ) : (
            <div style={S.bottomBar}>
              <p style={{ color: "#555", fontSize: 14, textAlign: "center" }}>
                Waiting for host to start the discussion…
              </p>
            </div>
          )}
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
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

    // ── VOTING PHASE — WhatsApp poll style ───────────────────────────────────
    if (room.status === "voting_phase") {
      const eligible       = room.eligibleCandidates;
      const allCandidates  = players.filter((p) => !eligible || eligible.includes(p.id));
      const totalVotes     = room.votedPlayerIds?.length ?? 0;
      const totalVoters    = connectedCount(room);
      const waitingCount   = totalVoters - totalVotes;
      const mins = String(Math.floor((timeLeft ?? 0) / 60)).padStart(1, "0");
      const secs = String((timeLeft ?? 0) % 60).padStart(2, "0");

      // myVote: the candidate id this player chose (stored locally after submit)

      return (
        <div style={S.page}>
          {/* Header */}
          <div style={S.settingsHeader}>
            <span style={S.roomCodeBadge}>{room.roomCode}</span>
            <span style={S.settingsTitle}>Vote</span>
            <span style={{ width: 60 }} />
          </div>

          {room.votingAttempt === 2 && (
            <div style={S.warnBanner}>⚠️ Tied! If tied again, imposter wins automatically.</div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>

            {/* Poll bubble card */}
            <div style={WA.card}>
              {/* Poll header */}
              <div style={WA.pollHeader}>
                <span style={WA.pollIcon}>📊</span>
                <div>
                  <div style={WA.pollTitle}>Who is the Imposter?</div>
                  <div style={WA.pollSub}>
                    {eligible ? "Tied round — restricted candidates" : `${totalVotes} of ${totalVoters} voted`}
                  </div>
                </div>
              </div>

              <div style={WA.divider} />

              {/* Timer inside card */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 4px" }}>
                <span style={{ color: "#8696a0", fontSize: 12 }}>⏱ Time left</span>
                <span style={{ color: timeLeft <= 10 ? "#ef5350" : "#fff", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  {mins}:{secs}
                </span>
              </div>

              <div style={WA.divider} />

              {/* Options */}
              {allCandidates.map((p) => {
                const isMe         = p.id === myId;
                const isMineChoice = hasVoted && myVotedId === p.id;
                // Before results: only your choice shows a filled bar (like WhatsApp pre-close)
                const pct = hasVoted ? (isMineChoice ? 100 : 0) : 0;
                const canVote = !hasVoted && !isMe;

                return (
                  <button
                    key={p.id}
                    disabled={!canVote}
                    onClick={() => canVote && submitVote(p.id)}
                    style={{
                      ...WA.option,
                      cursor: canVote ? "pointer" : "default",
                      opacity: !hasVoted && isMe ? 0.4 : 1,
                    }}
                  >
                    {/* Fill bar (visible after voting) */}
                    {hasVoted && (
                      <div style={{ ...WA.fillBar, width: `${pct}%`, background: isMineChoice ? "#00a884" : "#2a3942" }} />
                    )}

                    {/* Radio circle / checkmark */}
                    <div style={{
                      ...WA.radio,
                      borderColor: isMineChoice ? "#00a884" : "#8696a0",
                      background: isMineChoice ? "#00a884" : "transparent",
                    }}>
                      {isMineChoice && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </div>

                    {/* Name */}
                    <span style={{ ...WA.optionName, color: isMineChoice ? "#00a884" : "#e9edef", flex: 1 }}>
                      {p.name}
                      {isMe && <span style={{ color: "#8696a0", fontSize: 11 }}> (you)</span>}
                    </span>

                    {/* Vote count (hidden pre-vote, shows total after) */}
                    {hasVoted && (
                      <span style={WA.voteCount}>{pct}%</span>
                    )}
                  </button>
                );
              })}

              <div style={WA.divider} />

              {/* Footer */}
              <div style={WA.pollFooter}>
                {hasVoted ? (
                  <span style={{ color: "#00a884" }}>
                    ✓ Voted · waiting for {waitingCount} more…
                  </span>
                ) : (
                  <span style={{ color: "#8696a0" }}>Tap an option to vote</span>
                )}
              </div>

              {/* Timestamp */}
              <div style={{ textAlign: "right", marginTop: 4 }}>
                <span style={WA.timestamp}>{mins}:{secs} remaining</span>
              </div>
            </div>

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

// ─── WhatsApp Poll styles ─────────────────────────────────────────────────────
const WA = {
  // Outer chat bubble — matches WhatsApp dark received-message bubble
  card: {
    background: "#1f2c34",
    borderRadius: 12,
    padding: "12px 14px 8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
    marginBottom: 12,
  },

  // Poll header row: 📊 icon + title + subtext
  pollHeader: {
    display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10,
  },
  pollIcon: { fontSize: 22, lineHeight: 1.2 },
  pollTitle: {
    color: "#e9edef", fontSize: 15, fontWeight: 600, lineHeight: 1.3,
  },
  pollSub: {
    color: "#8696a0", fontSize: 12, marginTop: 2,
  },

  divider: {
    height: 1, background: "#2a3942", margin: "8px 0",
  },

  // Each poll option row — position relative for the fill bar
  option: {
    position: "relative",
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 10px",
    background: "transparent", border: "none",
    borderRadius: 8, marginBottom: 4,
    textAlign: "left", overflow: "hidden",
    boxSizing: "border-box",
  },

  // Animated fill bar (behind content via position absolute)
  fillBar: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    borderRadius: 8,
    transition: "width 0.4s ease",
    zIndex: 0,
  },

  // Radio circle — 20px, outlined, fills green when chosen
  radio: {
    width: 20, height: 20, borderRadius: "50%",
    border: "2px solid #8696a0",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, zIndex: 1,
    transition: "border-color 0.2s, background 0.2s",
  },

  optionName: {
    fontSize: 14, fontWeight: 500, zIndex: 1,
  },

  voteCount: {
    color: "#8696a0", fontSize: 12, zIndex: 1, flexShrink: 0,
  },

  // Footer line below options
  pollFooter: {
    color: "#8696a0", fontSize: 12, paddingTop: 2,
  },

  timestamp: {
    color: "#8696a0", fontSize: 11,
  },
};

// ─── Segmented control styles (3-way category mode toggle) ───────────────────
const SEG = {
  row: {
    display: "flex", gap: 6, marginTop: 10,
    background: "#1a1a1a", borderRadius: 10, padding: 4,
  },
  btn: {
    flex: 1, padding: "8px 4px", borderRadius: 8, border: "none",
    background: "transparent", color: "#555", fontSize: 12,
    fontWeight: 600, cursor: "pointer", letterSpacing: 0.3,
  },
  active: {
    background: "#e53935", color: "#fff",
  },
  desc: {
    color: "#555", fontSize: 12, marginTop: 10, lineHeight: 1.5,
    textAlign: "center",
  },
};
