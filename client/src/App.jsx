import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import imposterImg from "./assets/imposter.png";
import mafiaImg    from "./assets/Mafia.png";

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

// ─── Ghost icon (SVG) ─────────────────────────────────────────────────────────
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

// ─── Landing page ─────────────────────────────────────────────────────────────
function LandingPage({ onPlay }) {
  const [modal, setModal] = useState(null); // "imposter" | "mafia" | null

  const games = [
    {
      id: "imposter",
      title: "Imposter",
      quote: "Trust no one. The faker is closer than you think.",
      image: imposterImg,
      accentColor: "#e8543a",
      playDisabled: false,
      comingSoon: false,
      quoteStyle: {
        fontFamily: "'Trebuchet MS', 'Arial', sans-serif",
        fontWeight: 600,
        fontSize: 15,
      },
      modal: {
        title: "How to Play — Imposter",
        sections: [
          { heading: "Goal", body: "Find the imposter before they fool everyone — or blend in perfectly if you're the one faking it." },
          { heading: "Setup", body: "Everyone joins the same room using a code. The host picks a category and starts the game." },
          { heading: "Word reveal", body: "Each player privately sees their secret word. The imposter gets a similar but different word — they don't know the majority word." },
          { heading: "Discussion", body: "Players discuss and give clues about their word. Be descriptive enough to prove you know it, but vague enough not to give it away." },
          { heading: "Voting", body: "After discussion, everyone votes for who they think is the imposter. Majority wins. If it's a tie, a second round of restricted voting happens." },
          { heading: "Win conditions", body: "Group wins if they correctly vote out the imposter. Imposter wins if they survive the vote — or if the vote ties twice." },
        ],
      },
    },
    {
      id: "mafia",
      title: "Mafia",
      quote: "By day you vote. By night, they hunt. Can you survive?",
      image: mafiaImg,
      accentColor: "#e8543a",
      playDisabled: true,
      comingSoon: true,
      quoteStyle: {
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontStyle: "italic",
        fontSize: 15,
      },
      modal: {
        title: "How to Play — Mafia",
        sections: [
          { heading: "Goal", body: "Villagers must identify and eliminate all Mafia members before the Mafia outnumbers them." },
          { heading: "Roles", body: "Mafia: knows who the other Mafia are and eliminates one player per night. Detective: investigates one player per night. Doctor: can save one player per night. Villager: uses deduction and discussion to vote out suspects." },
          { heading: "Night phase", body: "Everyone closes their eyes. The Mafia silently choose a target. The Detective checks a player. The Doctor protects someone." },
          { heading: "Day phase", body: "The narrator reveals who was eliminated. Everyone discusses and votes to eliminate a suspect." },
          { heading: "Win conditions", body: "Villagers win when all Mafia are eliminated. Mafia win when they equal or outnumber the Villagers." },
        ],
      },
    },
  ];

  return (
    <div style={LP.page}>
      <style>{`
        @keyframes shimmerHeading {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lp-heading {
          background: linear-gradient(90deg, #fff 20%, #e8543a 50%, #fff 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerHeading 3s linear infinite, fadeUp 0.6s ease both;
        }
      `}</style>

      {/* More Games pill */}
      <div style={LP.topBar}>
        <button style={LP.moreBtn}>🎮 More Games</button>
      </div>

      {/* Hero text — heading only, subtext removed */}
      <div style={LP.hero}>
        <h1 style={LP.heading} className="lp-heading">Our Party Games</h1>
      </div>

      {/* Cards grid */}
      <div style={LP.grid}>
        {games.map((g) => (
          <div key={g.id} style={LP.card}>
            {/* Full-bleed background image */}
            <img src={g.image} alt={g.title} style={LP.cardBg} />

            {/* Frosted blur overlay — reduced height & blur */}
            <div style={LP.frostedOverlay} />

            {/* Text content */}
            <div style={LP.cardContent}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ ...LP.cardTitle, color: g.accentColor }}>{g.title}</span>
                {g.comingSoon && <span style={LP.comingSoonBadge}>Coming Soon</span>}
              </div>
              <p style={{ ...LP.cardQuote, ...g.quoteStyle }}>{g.quote}</p>

              {/* Button row */}
              <div style={LP.btnRow}>
                <button
                  style={{
                    ...LP.playBtn,
                    background: g.playDisabled ? "#333" : g.accentColor,
                    color: g.playDisabled ? "#666" : "#fff",
                    cursor: g.playDisabled ? "not-allowed" : "pointer",
                  }}
                  disabled={g.playDisabled}
                  onClick={() => !g.playDisabled && onPlay()}
                >
                  {g.playDisabled ? "Coming Soon" : "▶  Play"}
                </button>
                <button
                  style={LP.infoBtn}
                  title="How to play"
                  onClick={() => setModal(g.id)}
                >
                  ?
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How-to-play modal */}
      {modal && (() => {
        const g = games.find((x) => x.id === modal);
        return (
          <div style={LP.modalOverlay} onClick={() => setModal(null)}>
            <div style={LP.modalSheet} onClick={(e) => e.stopPropagation()}>
              <div style={LP.modalHeader}>
                <span style={LP.modalTitle}>{g.modal.title}</span>
                <button style={LP.modalClose} onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={LP.modalBody}>
                {g.modal.sections.map((s) => (
                  <div key={s.heading} style={{ marginBottom: 16 }}>
                    <div style={LP.modalSectionHeading}>{s.heading}</div>
                    <p style={LP.modalSectionBody}>{s.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Landing page styles ──────────────────────────────────────────────────────
const LP = {
  page: {
    minHeight: "100dvh",
    background: "#0e0e0e",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: "0 0 60px",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
  moreBtn: {
    background: "#1e2a2a",
    border: "1px solid #2a3a3a",
    borderRadius: 50,
    color: "#7ecec4",
    fontSize: 13,
    fontWeight: 600,
    padding: "7px 18px",
    cursor: "pointer",
    letterSpacing: 0.3,
  },
  hero: {
    textAlign: "center",
    padding: "12px 24px 32px",
    maxWidth: 680,
    margin: "0 auto",
  },
  heading: {
    fontSize: "clamp(28px, 6vw, 48px)",
    fontWeight: 900,
    margin: "0 0 0",
    lineHeight: 1.1,
  },
  // Cards
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 20px",
  },
  card: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    aspectRatio: "3 / 4",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  cardBg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    display: "block",
  },
  // Reduced height (38%) and lighter blur (6px) — gradient fades to near-opaque at bottom
  frostedOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "38%",
    background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.88) 100%)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "16px 18px 18px",
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: 0.3,
    lineHeight: 1,
  },
  comingSoonBadge: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 50,
    color: "#aaa",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },
  cardQuote: {
    color: "rgba(255,255,255,0.7)",
    margin: "5px 0 14px",
    lineHeight: 1.4,
  },
  btnRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  playBtn: {
    flex: "0 0 80%",
    maxWidth: "80%",
    padding: "12px 0",
    border: "none",
    borderRadius: 50,
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  infoBtn: {
    flex: 1,
    height: 44,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "#ccc",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modalSheet: {
    background: "#1a1a1a",
    borderRadius: "20px 20px 0 0",
    width: "100%",
    maxWidth: 520,
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 20px 14px",
    borderBottom: "1px solid #2a2a2a",
    flexShrink: 0,
  },
  modalTitle: { color: "#eee", fontSize: 16, fontWeight: 700 },
  modalClose: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: 20,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
  },
  modalBody: { overflowY: "auto", padding: "16px 20px 32px" },
  modalSectionHeading: {
    color: "#e8543a",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  modalSectionBody: { color: "#aaa", fontSize: 14, lineHeight: 1.6, margin: 0 },
};

// ─── Settings Panel (inline, host-only, used in lobby + results) ──────────────
function SettingsPanel({ room, allTopics, onClose, isHost }) {
  const DURATION_OPTIONS = [
    { label: "30s",  value: 30_000 },
    { label: "60s",  value: 60_000 },
    { label: "90s",  value: 90_000 },
    { label: "2m",   value: 120_000 },
  ];

  const updateSettings = (patch) => {
    socket.emit("settings:update", patch);
  };
  const updateCategory = (patch) => {
    socket.emit("category:update", patch);
  };

  const mode    = room.categoryMode || "surprise";
  const selCats = room.selectedCategories || allTopics;

  const toggleCat = (t) => {
    const next = selCats.includes(t)
      ? selCats.filter((c) => c !== t)
      : [...selCats, t];
    updateCategory({ categoryMode: "random", selectedCategories: next.length ? next : [t] });
  };
  const setMode = (m) => {
    if (m === "surprise") updateCategory({ categoryMode: "surprise" });
    if (m === "single")   updateCategory({ categoryMode: "single", selectedCategory: room.selectedCategory || allTopics[0] });
    if (m === "random")   updateCategory({ categoryMode: "random", selectedCategories: selCats });
  };

  return (
    <div style={SETTINGSPANEL.overlay} onClick={onClose}>
      <div style={SETTINGSPANEL.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={SETTINGSPANEL.header}>
          <span style={SETTINGSPANEL.title}>⚙ Settings</span>
          <button style={SETTINGSPANEL.close} onClick={onClose}>✕</button>
        </div>
        <div style={SETTINGSPANEL.body}>

          {/* Category mode */}
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
                  disabled={!isHost}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {mode === "surprise" && (
              <p style={SEG.desc}>Picks a random category from all {allTopics.length} available each round.</p>
            )}
            {mode === "single" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {allTopics.map((t) => {
                  const on = room.selectedCategory === t;
                  return (
                    <button key={t}
                      style={{ ...S.pill, background: on ? "#e53935" : "#1e1e1e", color: on ? "#fff" : "#666", border: on ? "none" : "1px solid #2a2a2a", cursor: isHost ? "pointer" : "default" }}
                      onClick={() => isHost && updateCategory({ categoryMode: "single", selectedCategory: t })}
                    >
                      {on && "✓ "}{formatLabel(t)}
                    </button>
                  );
                })}
              </div>
            )}
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
              </>
            )}
          </div>

          {/* Discussion duration */}
          <div style={{ ...S.section, marginTop: 20 }}>
            <div style={S.sectionLabel}>⏱ DISCUSSION TIMER</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {DURATION_OPTIONS.map((opt) => (
                <button key={opt.value}
                  style={{ ...S.pill, background: room.discussionDuration === opt.value ? "#e53935" : "#1e1e1e", color: room.discussionDuration === opt.value ? "#fff" : "#666", border: room.discussionDuration === opt.value ? "none" : "1px solid #2a2a2a", cursor: isHost ? "pointer" : "default" }}
                  onClick={() => isHost && updateSettings({ discussionDuration: opt.value })}
                  disabled={!isHost}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Imposter count */}
          <div style={{ ...S.section, marginTop: 20 }}>
            <div style={S.sectionLabel}>👻 IMPOSTER COUNT</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[1, 2, 3].map((n) => (
                <button key={n}
                  style={{ ...S.pill, background: room.imposterCount === n ? "#e53935" : "#1e1e1e", color: room.imposterCount === n ? "#fff" : "#666", border: room.imposterCount === n ? "none" : "1px solid #2a2a2a", cursor: isHost ? "pointer" : "default", minWidth: 44 }}
                  onClick={() => isHost && updateSettings({ imposterCount: n })}
                  disabled={!isHost}
                >
                  {n}
                </button>
              ))}
            </div>
            {room.imposterCount > 1 && <p style={{ color: "#555", fontSize: 11, marginTop: 6 }}>Only 1 imposter is functional — multi-imposter coming soon.</p>}
          </div>

          {/* Hint mode */}
          <div style={{ ...S.section, marginTop: 20 }}>
            <div style={S.sectionLabel}>💡 IMPOSTER HINT</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[
                { key: "hint", label: "Give hint" },
                { key: "none", label: "No hint" },
              ].map((opt) => (
                <button key={opt.key}
                  style={{ ...S.pill, background: (room.hintMode || "hint") === opt.key ? "#e53935" : "#1e1e1e", color: (room.hintMode || "hint") === opt.key ? "#fff" : "#666", border: (room.hintMode || "hint") === opt.key ? "none" : "1px solid #2a2a2a", cursor: isHost ? "pointer" : "default" }}
                  onClick={() => isHost && updateSettings({ hintMode: opt.key })}
                  disabled={!isHost}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p style={{ color: "#555", fontSize: 11, marginTop: 6 }}>
              {(room.hintMode || "hint") === "hint"
                ? "Imposter gets a private clue about the category context."
                : "Imposter gets no extra hint."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SETTINGSPANEL = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
    zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center",
  },
  sheet: {
    background: "#1a1a1a", borderRadius: "20px 20px 0 0",
    width: "100%", maxWidth: 430, maxHeight: "85vh",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px 12px", borderBottom: "1px solid #2a2a2a", flexShrink: 0,
  },
  title: { color: "#eee", fontWeight: 700, fontSize: 16 },
  close: { background: "none", border: "none", color: "#666", fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1 },
  body: { overflowY: "auto", padding: "0 20px 32px", flex: 1 },
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]               = useState("landing");
  const [name, setName]                   = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom]                   = useState(null);
  const [allTopics, setAllTopics]         = useState([]);
  const [myWord, setMyWord]               = useState(null);
  const [myHint, setMyHint]               = useState(null);
  const [amIImposter, setAmIImposter]     = useState(false);
  const [myTopic, setMyTopic]             = useState(null);
  const [error, setError]                 = useState("");
  const [timeLeft, setTimeLeft]           = useState(null);
  const [results, setResults]             = useState(null);
  const [hasVoted, setHasVoted]           = useState(false);
  const [myVotedId, setMyVotedId]         = useState(null);
  const [roleRevealed, setRoleRevealed]   = useState(false);
  const [showSettings, setShowSettings]   = useState(false);
  const [leftRoom, setLeftRoom]           = useState(false);
  const [lastRoomCode, setLastRoomCode]   = useState("");
  const timerRef = useRef(null);

  // ── Session rejoin on app load ─────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("imposter_session");
    if (!stored) return;
    try {
      const { roomCode, playerId, name: storedName } = JSON.parse(stored);
      socket.emit("player:rejoin", { roomCode, playerId, name: storedName }, (res) => {
        if (res.ok) {
          setRoom(res.room);
          setAllTopics(res.topics || []);
          setName(storedName || "");
          setScreen("lobby");
        } else {
          sessionStorage.removeItem("imposter_session");
        }
      });
    } catch {
      sessionStorage.removeItem("imposter_session");
    }
  }, []);

  // ── Beforeunload warning during active gameplay ────────────────────────────
  useEffect(() => {
    if (screen === "lobby" && room?.status !== "lobby") {
      const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [screen, room?.status]);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    socket.on("room:update", (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status !== "voting_phase") { setHasVoted(false); setMyVotedId(null); }
      if (updatedRoom.status !== "results")      setResults(null);
      if (updatedRoom.status === "word_reveal")  { setRoleRevealed(false); setMyHint(null); }
    });
    socket.on("word:assign", ({ word, isImposter, topic, hint }) => {
      setMyWord(word);
      setAmIImposter(!!isImposter);
      setMyTopic(topic || null);
      setMyHint(hint || null);
    });
    socket.on("voting:start", () => { setHasVoted(false); setMyVotedId(null); });
    socket.on("results:reveal", (payload) => setResults(payload));
    socket.on("session:reset", () => {
      setResults(null); setMyWord(null); setMyHint(null); setAmIImposter(false);
      setMyTopic(null); setHasVoted(false); setMyVotedId(null); setError("");
      setRoleRevealed(false);
    });
    return () => {
      socket.off("room:update"); socket.off("word:assign");
      socket.off("voting:start"); socket.off("results:reveal"); socket.off("session:reset");
    };
  }, []);

  // ── Countdown — now uses discussionDeadline for describe_phase ────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const deadline =
      room?.status === "describe_phase" ? room.discussionDeadline :
      room?.status === "voting_phase"   ? room.voteDeadline : null;
    if (deadline) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      tick();
      timerRef.current = setInterval(tick, 500);
    } else { setTimeLeft(null); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.status, room?.discussionDeadline, room?.voteDeadline, room?.votingAttempt]);

  // ── Emitters ───────────────────────────────────────────────────────────────
  const createRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    socket.emit("room:create", { name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to create room");
      setRoom(res.room); setAllTopics(res.topics || []);
      setScreen("lobby"); setError("");
      sessionStorage.setItem("imposter_session", JSON.stringify({
        roomCode: res.roomCode, playerId: socket.id, name: name.trim(),
      }));
    });
  };
  const joinRoom = () => {
    if (!name.trim()) return setError("Enter your name first");
    if (!roomCodeInput.trim()) return setError("Enter a room code");
    socket.emit("room:join", { roomCode: roomCodeInput.trim().toUpperCase(), name }, (res) => {
      if (!res.ok) return setError(res.error || "Failed to join room");
      setRoom(res.room); setScreen("lobby"); setError("");
      sessionStorage.setItem("imposter_session", JSON.stringify({
        roomCode: res.roomCode, playerId: socket.id, name: name.trim(),
      }));
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
  const endDiscussionEarly = () => {
    socket.emit("discussion:end", {}, (res) => {
      if (res && !res.ok) setError(res.error || "Failed to end discussion");
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
  const quitRoom = () => {
    const rc = room?.roomCode || "";
    setLastRoomCode(rc);
    socket.emit("player:leave", {}, () => {});
    sessionStorage.removeItem("imposter_session");
    setRoom(null); setScreen("landing"); setMyWord(null); setMyHint(null);
    setAmIImposter(false); setMyTopic(null); setResults(null);
    setHasVoted(false); setMyVotedId(null); setRoleRevealed(false);
    setError(""); setShowSettings(false); setLeftRoom(true);
  };

  // ── LANDING PAGE ──────────────────────────────────────────────────────────
  if (screen === "landing") {
    if (leftRoom) {
      // "You left the room" screen with Rejoin option
      return (
        <div style={S.page}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
            <div style={{ fontSize: 48 }}>👋</div>
            <h2 style={{ color: "#fff", fontSize: 22, margin: 0, textAlign: "center" }}>You left the room</h2>
            {lastRoomCode && (
              <p style={{ color: "#555", fontSize: 14, margin: 0, textAlign: "center" }}>
                Room code was <span style={{ color: "#e53935", fontWeight: 700, letterSpacing: 2 }}>{lastRoomCode}</span>
              </p>
            )}
          </div>
          <div style={S.homeBottom}>
            {lastRoomCode && (
              <button style={S.redPill} onClick={() => {
                setRoomCodeInput(lastRoomCode);
                setLeftRoom(false);
                setScreen("home");
              }}>
                REJOIN ROOM
              </button>
            )}
            <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#555" }}
              onClick={() => { setLeftRoom(false); }}>
              BACK TO GAMES
            </button>
          </div>
        </div>
      );
    }
    return <LandingPage onPlay={() => setScreen("home")} />;
  }

  // ── HOME SCREEN ────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div style={S.page}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={S.ghostBox}><GhostIcon size={52} color="#fff" /></div>
          <h1 style={S.homeTitle}>IMPOSTER</h1>
          <p style={S.homeTagline}>Find the fake. Trust no one.</p>
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
    const isHost  = room.hostSocketId === socket.id;
    const myId    = socket.id;
    const players = room.players;

    // ── Waiting for next round ────────────────────────────────────────────
    const myEntry = players.find((p) => p.id === myId);
    if (myEntry?.waitingForNextRound) {
      return (
        <div style={S.page}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
            <div style={{ fontSize: 48 }}>⏳</div>
            <h2 style={{ color: "#fff", fontSize: 22, margin: 0, textAlign: "center" }}>Waiting for next round…</h2>
            <p style={{ color: "#555", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 280 }}>
              A round is already in progress. You'll join automatically when the next round starts.
            </p>
          </div>
          <div style={S.bottomBar}>
            <button style={{ ...S.redPill, background: "transparent", border: "1px solid #333", color: "#666" }} onClick={quitRoom}>
              QUIT ROOM
            </button>
          </div>
        </div>
      );
    }

    // ── LOBBY (host pre-game config) ──────────────────────────────────────
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
            {isHost
              ? <button style={S.gearBtn} onClick={() => setShowSettings(true)}>⚙</button>
              : <span style={{ width: 44 }} />
            }
          </div>

          {showSettings && (
            <SettingsPanel
              room={room}
              allTopics={allTopics}
              isHost={isHost}
              onClose={() => setShowSettings(false)}
            />
          )}

          <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 100px" }}>
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

            {/* Category mode — host sees interactive controls, non-host sees a simple summary */}
            <div style={S.section}>
              <div style={S.sectionLabel}>📂 WORD CATEGORIES</div>
              {isHost ? (
                <>
                  <div style={SEG.row}>
                    {[
                      { key: "surprise", label: "🎲 Surprise" },
                      { key: "random",   label: "✦ Mix" },
                      { key: "single",   label: "⊙ Single" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        style={{ ...SEG.btn, ...(mode === opt.key ? SEG.active : {}) }}
                        onClick={() => setMode(opt.key)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {mode === "surprise" && (
                    <p style={SEG.desc}>Picks a random category from all {allTopics.length} available each round.</p>
                  )}
                  {mode === "single" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {allTopics.map((t) => {
                        const on = room.selectedCategory === t;
                        return (
                          <button key={t}
                            style={{ ...S.pill, background: on ? "#e53935" : "#1e1e1e", color: on ? "#fff" : "#666", border: on ? "none" : "1px solid #2a2a2a" }}
                            onClick={() => saveCategorySettings({ categoryMode: "single", selectedCategory: t })}
                          >
                            {on && "✓ "}{formatLabel(t)}
                          </button>
                        );
                      })}
                    </div>
                  )}
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
                              style={{ ...S.pill, background: on ? "#e53935" : "#1e1e1e", color: on ? "#fff" : "#666", border: on ? "none" : "1px solid #2a2a2a" }}
                              onClick={() => toggleCat(t)}
                            >
                              {on && "✓ "}{formatLabel(t)}
                            </button>
                          );
                        })}
                      </div>
                      <p style={{ color: "#444", fontSize: 11, marginTop: 8 }}>Tap to toggle. At least 1 required.</p>
                    </>
                  )}
                </>
              ) : (
                // Non-host: single-line read-only summary
                <p style={{ color: "#555", fontSize: 13, marginTop: 8 }}>
                  {mode === "surprise" && `🎲 Random from all ${allTopics.length} categories`}
                  {mode === "single"   && `⊙ ${formatLabel(room.selectedCategory)}`}
                  {mode === "random"   && `✦ Mix · ${selCats.length} categories selected`}
                </p>
              )}
            </div>
          </div>

          {isHost ? (
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={startGame} disabled={players.length < 3}>
                START GAME
              </button>
              {players.length < 3 && <p style={{ color: "#555", fontSize: 12, marginTop: 6 }}>Need at least 3 players</p>}
              <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          ) : (
            <div style={S.bottomBar}>
              <p style={{ color: "#555", textAlign: "center" }}>Waiting for host to start…</p>
              <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          )}
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
        </div>
      );
    }

    // ── WORD REVEAL ───────────────────────────────────────────────────────────
    if (room.status === "word_reveal") {
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

      // REVEALED state — same card structure for everyone (no role badge)
      // Imposter sees their word; crewmate sees the majority word.
      // Identity is NOT revealed here — only in results.
      return (
        <div style={S.page}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 24px" }}>
            <div style={S.ghostBox}><GhostIcon size={44} color="#fff" /></div>
            <h2 style={{ color: "#fff", fontSize: 24, margin: "4px 0 0", textAlign: "center" }}>
              Your word is
            </h2>
            <div style={S.wordRevealCard}>
              <span style={S.wordRevealText}>{myWord || "…"}</span>
            </div>
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <span style={{ color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Category</span>
              <p style={{ color: "#f5c842", fontSize: 16, fontWeight: "bold", margin: "4px 0 0" }}>
                {formatLabel(myTopic || room.topic)}
              </p>
            </div>
            {myHint && (
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <span style={{ color: "#666", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Hint</span>
                <p style={{ color: "#aaa", fontSize: 14, margin: "4px 0 0", fontStyle: "italic" }}>
                  {myHint}
                </p>
              </div>
            )}
          </div>
          {isHost ? (
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={startDescribePhase}>START DISCUSSION</button>
              <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          ) : (
            <div style={S.bottomBar}>
              <p style={{ color: "#555", fontSize: 14, textAlign: "center" }}>
                Waiting for host to start the discussion…
              </p>
              <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          )}
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
        </div>
      );
    }

    // ── DESCRIBE PHASE — shared discussion timer (no per-player turns) ────────
    if (room.status === "describe_phase") {
      const mins = String(Math.floor((timeLeft ?? 0) / 60)).padStart(1, "0");
      const secs = String((timeLeft ?? 0) % 60).padStart(2, "0");

      return (
        <div style={S.page}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <p style={{ color: "#555", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
              ⏱ Discussion Time
            </p>
            <div style={S.bigTimer}>{mins}:{secs}</div>
            <p style={{ color: "#aaa", fontSize: 15, margin: 0, textAlign: "center", maxWidth: 300 }}>
              Talk about your clues out loud. Discuss who you think the imposter is.
            </p>

            {/* All players in the round — simple grid, no "current player" highlight */}
            <div style={{ width: "100%", padding: "0 20px", marginTop: 16 }}>
              <p style={{ color: "#444", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, textAlign: "left", margin: "0 0 8px" }}>Players in this round</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {players.filter((p) => !p.waitingForNextRound).map((p) => (
                  <div key={p.id} style={{ ...S.playerChip, background: "#1a1a1a", borderColor: "#2a2a2a" }}>
                    <span style={{ color: "#e53935", fontSize: 12 }}>●</span>
                    <span style={{ color: "#777", fontSize: 13, marginLeft: 6 }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Host sees End Discussion button; others see nothing extra */}
          {isHost && (
            <div style={S.bottomBar}>
              <button
                style={{ ...S.redPill, background: "#c62828" }}
                onClick={endDiscussionEarly}
              >
                END DISCUSSION
              </button>
              <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          )}
          {!isHost && (
            <div style={S.bottomBar}>
              <button style={{ ...S.redPill, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          )}
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

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>
            <div style={WA.card}>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 4px" }}>
                <span style={{ color: "#8696a0", fontSize: 12 }}>⏱ Time left</span>
                <span style={{ color: timeLeft <= 10 ? "#ef5350" : "#fff", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                  {mins}:{secs}
                </span>
              </div>
              <div style={WA.divider} />
              {allCandidates.map((p) => {
                const isMe         = p.id === myId;
                const isMineChoice = hasVoted && myVotedId === p.id;
                const pct          = hasVoted ? (isMineChoice ? 100 : 0) : 0;
                const canVote      = !hasVoted && !isMe;
                return (
                  <button
                    key={p.id}
                    disabled={!canVote}
                    onClick={() => canVote && submitVote(p.id)}
                    style={{ ...WA.option, cursor: canVote ? "pointer" : "default", opacity: !hasVoted && isMe ? 0.4 : 1 }}
                  >
                    {hasVoted && (
                      <div style={{ ...WA.fillBar, width: `${pct}%`, background: isMineChoice ? "#00a884" : "#2a3942" }} />
                    )}
                    <div style={{ ...WA.radio, borderColor: isMineChoice ? "#00a884" : "#8696a0", background: isMineChoice ? "#00a884" : "transparent" }}>
                      {isMineChoice && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ ...WA.optionName, color: isMineChoice ? "#00a884" : "#e9edef", flex: 1 }}>
                      {p.name}
                      {isMe && <span style={{ color: "#8696a0", fontSize: 11 }}> (you)</span>}
                    </span>
                    {hasVoted && <span style={WA.voteCount}>{pct}%</span>}
                  </button>
                );
              })}
              <div style={WA.divider} />
              <div style={WA.pollFooter}>
                {hasVoted
                  ? <span style={{ color: "#00a884" }}>✓ Voted · waiting for {waitingCount} more…</span>
                  : <span style={{ color: "#8696a0" }}>Tap an option to vote</span>
                }
              </div>
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
      else if (results.reason === "tied_twice")         outcomeText = "The imposter fooled everyone and escaped!";
      else if (results.reason === "correct_accusation") outcomeText = "The group caught the imposter!";
      else                                               outcomeText = "The imposter fooled everyone!";

      return (
        <div style={S.page}>
          {/* Gear icon for host */}
          {isHost && (
            <button
              style={{ ...S.gearBtn, position: "absolute", top: 16, right: 20, zIndex: 10 }}
              onClick={() => setShowSettings(true)}
            >
              ⚙
            </button>
          )}
          {showSettings && (
            <SettingsPanel
              room={room}
              allTopics={allTopics}
              isHost={isHost}
              onClose={() => setShowSettings(false)}
            />
          )}

          <div style={{ ...S.winnerBanner, background: groupWon ? "#1b3a1b" : "#3a1b1b" }}>
            <GhostIcon size={40} color={groupWon ? "#4caf50" : "#e53935"} />
            <h2 style={{ color: groupWon ? "#4caf50" : "#e53935", margin: "12px 0 4px", fontSize: 24 }}>
              {groupWon ? "Group Wins!" : "Imposter Wins!"}
            </h2>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>{outcomeText}</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>
            {results && (
              <>
                <p style={S.revealSectionLabel}>THE IMPOSTER</p>
                {imposterPlayer && (
                  <div style={S.imposterRow}>
                    <div style={S.voteAvatar}><GhostIcon size={18} color="#e53935" /></div>
                    <span style={{ color: "#eee", fontWeight: "600" }}>{imposterPlayer.name}</span>
                  </div>
                )}

                {/* Two-word reveal: majority word (green) + imposter word (amber) */}
                <p style={{ ...S.revealSectionLabel, marginTop: 20 }}>THE WORD WAS</p>
                <p style={S.secretWord}>{results.majorityWord ?? "—"}</p>
                <p style={{ color: "#444", fontSize: 12, textAlign: "center", marginTop: 2 }}>
                  {formatLabel(room.topic)}
                </p>

                <p style={{ ...S.revealSectionLabel, marginTop: 16 }}>THE IMPOSTER&apos;S WORD WAS</p>
                <p style={{ ...S.secretWord, color: "#f5a623" }}>{results.imposterWord ?? "—"}</p>

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

          {isHost && (
            <div style={S.bottomBar}>
              <button style={S.redPill} onClick={playAgain}>PLAY AGAIN</button>
              <button style={{ ...S.redPill, background: "transparent", border: "1px solid #333", color: "#555", marginTop: 8 }} onClick={endSession}>
                END SESSION
              </button>
              <button style={{ ...S.redPill, marginTop: 8, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          )}
          {!isHost && (
            <div style={S.bottomBar}>
              <p style={{ color: "#555", textAlign: "center", fontSize: 14 }}>Waiting for host…</p>
              <button style={{ ...S.redPill, marginTop: 10, background: "transparent", border: "1px solid #333", color: "#666", fontSize: 13 }} onClick={quitRoom}>
                QUIT ROOM
              </button>
            </div>
          )}
          {error && <p style={{ ...S.error, padding: "0 20px" }}>{error}</p>}
        </div>
      );
    }

    return <div style={S.page}><p style={{ color: "#555", padding: 40 }}>Loading…</p></div>;
  }

  return null;
}

function connectedCount(room) {
  return room.players.filter((p) => p.connected && !p.waitingForNextRound).length;
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

  // Settings / lobby header
  settingsHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1px solid #1e1e1e",
  },
  roomCodeBadge: {
    background: "#1e1e1e", color: "#e53935", borderRadius: 8,
    padding: "4px 10px", fontSize: 12, fontWeight: 700, letterSpacing: 2,
  },
  settingsTitle: { color: "#eee", fontWeight: 700, fontSize: 16 },
  gearBtn: {
    width: 44, height: 44, borderRadius: 12, background: "#1e1e1e",
    border: "1px solid #2a2a2a", color: "#aaa", fontSize: 18,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    padding: 0,
  },
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
  card: {
    background: "#1f2c34",
    borderRadius: 12,
    padding: "12px 14px 8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
    marginBottom: 12,
  },
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
  option: {
    position: "relative",
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 10px",
    background: "transparent", border: "none",
    borderRadius: 8, marginBottom: 4,
    textAlign: "left", overflow: "hidden",
    boxSizing: "border-box",
  },
  fillBar: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    borderRadius: 8,
    transition: "width 0.4s ease",
    zIndex: 0,
  },
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
