import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Info, X, Flame, Eye, EyeOff, Users, Monitor, ChevronLeft, Menu } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
function createAudioCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
}
function playCardRustle(ctx) {
  if (!ctx) return;
  try {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2) * 0.55;
    [0, 0.045, 0.095, 0.14].forEach(t => {
      const s = Math.floor(t * ctx.sampleRate);
      for (let i = s; i < Math.min(s + 900, d.length); i++) d[i] += (Math.random() * 2 - 1) * 0.85 * Math.exp(-(i - s) / 180);
    });
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3000; f.Q.value = 0.9;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.85, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
  } catch {}
}
function playBasraFanfare(ctx, streak) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const freqs = streak >= 2 ? [523.25, 659.25, 783.99, 1046.5, 1318.51] : [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i % 2 === 0 ? "triangle" : "sine"; o.frequency.value = freq;
      const t = now + i * 0.1;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(streak >= 2 ? 0.38 : 0.26, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.45);
    });
    if (streak >= 2) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(2093, now + 0.42); o.frequency.exponentialRampToValueAtTime(2793, now + 0.78);
      g.gain.setValueAtTime(0.16, now + 0.42); g.gain.exponentialRampToValueAtTime(0.001, now + 0.82);
      o.connect(g); g.connect(ctx.destination); o.start(now + 0.42); o.stop(now + 0.85);
    }
  } catch {}
}
function playWhoosh(ctx) {
  if (!ctx) return;
  try {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / d.length) * 0.45;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "highpass";
    f.frequency.setValueAtTime(500, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(3500, ctx.currentTime + 0.25);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.65, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
  } catch {}
}
function playTick(ctx, urgent) {
  if (!ctx) return;
  try {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = urgent ? 880 : 440;
    g.gain.setValueAtTime(urgent ? 0.18 : 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.07);
  } catch {}
}
function playTimeoutBuzz(ctx) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [0, 0.1, 0.2].forEach(off => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 180;
      g.gain.setValueAtTime(0.3, now + off); g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.09);
      o.connect(g); g.connect(ctx.destination); o.start(now + off); o.stop(now + off + 0.1);
    });
  } catch {}
}
function playPassDevice(ctx) {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [392, 523.25, 659.25].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.28);
    });
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// ETHIOPIAN ORNAMENTAL BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════

// Single tile: 8-pointed star rosette — core motif of Ethiopian geometric art
// (Lalibela church ceilings, habesha textiles, timket processional shields)
function EthiopianTile({ x, y, size, opacity }) {
  const s = size / 2;
  const r1 = s * 0.44;   // outer star radius
  const r2 = s * 0.18;   // inner star radius
  const r3 = s * 0.30;   // ring radius
  const r4 = s * 0.10;   // center dot
  // 8-pointed star path
  const starPts = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    starPts.push(`${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`);
  }
  const star = `M${starPts.join("L")}Z`;

  // Diamond cross inset
  const dc = s * 0.24;
  const diamond = `M${x},${y - dc} L${x + dc * 0.5},${y} L${x},${y + dc} L${x - dc * 0.5},${y}Z`;

  return (
    <g opacity={opacity} fill="none">
      {/* Outer decorative ring */}
      <circle cx={x} cy={y} r={r3} stroke="#d4af37" strokeWidth="0.5" />
      {/* 8-pointed star */}
      <path d={star} stroke="#d4af37" strokeWidth="0.6" />
      {/* Diamond overlay */}
      <path d={diamond} stroke="#c8922a" strokeWidth="0.5" />
      {/* Center dot */}
      <circle cx={x} cy={y} r={r4} fill="#d4af37" />
      {/* Corner accent dots at star tips */}
      {[0, 1, 2, 3].map(i => {
        const a = (i * Math.PI) / 2;
        return <circle key={i} cx={x + r1 * Math.cos(a)} cy={y + r1 * Math.sin(a)} r={s * 0.025} fill="#d4af37" />;
      })}
    </g>
  );
}

// Interlocking cross motif — Ethiopian Orthodox cross geometry
function EthiopianCross({ x, y, size, opacity }) {
  const s = size;
  const arm = s * 0.38;
  const w = s * 0.13;
  const notch = s * 0.06;
  // Cross with flared ends
  const path = `
    M${x - w},${y - arm + notch} L${x - w + notch},${y - arm}
    L${x - notch},${y - arm} L${x},${y - arm - notch}
    L${x + notch},${y - arm} L${x + w - notch},${y - arm}
    L${x + w},${y - arm + notch} L${x + w},${y - w}
    L${x + arm - notch},${y - w} L${x + arm},${y - w + notch}
    L${x + arm},${y + w - notch} L${x + arm - notch},${y + w}
    L${x + w},${y + w} L${x + w},${y + arm - notch}
    L${x + w - notch},${y + arm} L${x - w + notch},${y + arm}
    L${x - w},${y + arm - notch} L${x - w},${y + w}
    L${x - arm + notch},${y + w} L${x - arm},${y + w - notch}
    L${x - arm},${y - w + notch} L${x - arm + notch},${y - w}
    L${x - w},${y - w} Z
  `;
  return (
    <g opacity={opacity}>
      <path d={path} fill="none" stroke="#d4af37" strokeWidth="0.55" />
      <circle cx={x} cy={y} r={s * 0.07} fill="#c8922a" opacity="0.7" />
    </g>
  );
}

// Border band: repeating chevron / zigzag — habesha woven textile pattern
function EthiopianBorder({ y, width, height, opacity }) {
  const unit = 18;
  const cols = Math.ceil(width / unit) + 2;
  const pts = [];
  for (let i = 0; i <= cols; i++) {
    pts.push(`${i * unit},${y + (i % 2 === 0 ? 0 : height)}`);
  }
  const zigzag = `M${pts.join("L")}`;
  // Second mirror strip
  const pts2 = [];
  for (let i = 0; i <= cols; i++) {
    pts2.push(`${i * unit},${y + height + (i % 2 === 0 ? height : 0)}`);
  }
  return (
    <g opacity={opacity} fill="none" stroke="#d4af37" strokeWidth="0.6">
      <path d={zigzag} />
      <path d={`M${pts2.join("L")}`} />
    </g>
  );
}

// Full background: tiled rosettes + crosses + borders
function EthiopianBackground({ forMenu = false }) {
  const tileSize = 90;
  const cols = 8, rows = 14;
  const tiles = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * tileSize + tileSize / 2;
      const cy = row * tileSize + tileSize / 2;
      const isEven = (row + col) % 2 === 0;
      tiles.push({ id: `${row}-${col}`, cx, cy, isEven });
    }
  }

  const crossPositions = [
    { x: 45, y: 45 }, { x: 135, y: 45 }, { x: 225, y: 45 }, { x: 315, y: 45 },
    { x: 45, y: 135 }, { x: 225, y: 135 }, { x: 315, y: 135 },
    { x: 90, y: 90 }, { x: 270, y: 90 },
    // scatter more
    { x: 180, y: 180 }, { x: 360, y: 180 }, { x: 90, y: 270 }, { x: 270, y: 270 },
    { x: 45, y: 315 }, { x: 315, y: 315 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <svg
        width="100%" height="100%"
        viewBox="0 0 720 1200"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tiled rosette grid */}
        {tiles.map(t => (
          <EthiopianTile
            key={t.id}
            x={t.cx} y={t.cy}
            size={tileSize}
            opacity={t.isEven ? 0.07 : 0.04}
          />
        ))}

        {/* Cross motifs at alternating positions */}
        {crossPositions.map((p, i) => (
          <EthiopianCross
            key={i}
            x={p.x + 45} y={p.y + 45}
            size={22}
            opacity={0.06}
          />
        ))}

        {/* Horizontal border bands */}
        <EthiopianBorder y={0}   width={720} height={8}  opacity={0.12} />
        <EthiopianBorder y={298} width={720} height={8}  opacity={0.09} />
        <EthiopianBorder y={596} width={720} height={8}  opacity={0.09} />
        <EthiopianBorder y={894} width={720} height={8}  opacity={0.07} />

        {/* Corner ornament clusters */}
        {[
          [60, 60], [660, 60], [60, 1140], [660, 1140],
          [360, 60], [360, 600], [360, 1140],
        ].map(([cx, cy], i) => (
          <EthiopianTile key={`corner-${i}`} x={cx} y={cy} size={50} opacity={0.13} />
        ))}

        {/* Diagonal lattice lines — subtle grid linking rosettes */}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`dl-${i}`}
            x1={i * 72 - 72} y1={0}
            x2={i * 72 + 400} y2={1200}
            stroke="#d4af37" strokeWidth="0.25" opacity="0.05"
          />
        ))}
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`dr-${i}`}
            x1={i * 72 + 72} y1={0}
            x2={i * 72 - 400} y2={1200}
            stroke="#d4af37" strokeWidth="0.25" opacity="0.05"
          />
        ))}

        {/* Outer frame border */}
        <rect x="2" y="2" width="716" height="1196" fill="none"
          stroke="#d4af37" strokeWidth="1.2" opacity="0.08" rx="0" />
        <rect x="8" y="8" width="704" height="1184" fill="none"
          stroke="#d4af37" strokeWidth="0.5" opacity="0.05" rx="0" />
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const RANK_VALUES = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };

const cardValue = (c) => RANK_VALUES[c.rank];
const isJack = (c) => c.rank === "J";
const is7Diamonds = (c) => c.rank === "7" && c.suit === "♦";
const is2Spades = (c) => c.rank === "2" && c.suit === "♠";
const is10Diamonds = (c) => c.rank === "10" && c.suit === "♦";
const isAce = (c) => c.rank === "A";
const isSpecialClear = (c) => isJack(c) || is7Diamonds(c);

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit, id: `${rank}${suit}` });
  return deck;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME LOGIC
// ═══════════════════════════════════════════════════════════════════════════════
// ─── Capture Logic ─────────────────────────────────────────────────────────────
// Returns the best set of table cards to capture with `card`.
// Rules: capture ALL cards matching by rank + ALL non-overlapping subsets summing to val.
// Example: table=[5,5,10], play 10 → captures [10] by rank + [5,5] by sum = all 3.

function getAllCaptureCombinations(card, tableCards) {
  if (isSpecialClear(card)) return tableCards.length > 0 ? [tableCards] : [];
  const val = cardValue(card);
  const isFaceCard = ["Q", "K"].includes(card.rank);

  // Step 1: byRank — all table cards matching value exactly
  const byRank = tableCards.filter(c => cardValue(c) === val);

  // Face cards (Q, K) can ONLY capture by rank — never by sum
  if (isFaceCard) {
    return byRank.length > 0 ? [byRank] : [];
  }

  const nonRank = tableCards.filter(c => cardValue(c) !== val);

  // Step 2: find all subsets of nonRank that sum to val
  const sumSubsets = [];
  const n = nonRank.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0; const subset = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) { sum += cardValue(nonRank[i]); subset.push(nonRank[i]); }
    }
    if (sum === val) sumSubsets.push(subset);
  }

  // Step 3: find the maximum set of NON-OVERLAPPING sum subsets
  function maxNonOverlapping(subsets) {
    let best = [];
    function recurse(idx, usedIds, current) {
      if (idx === subsets.length) {
        if (current.length > best.length) best = [...current];
        return;
      }
      const sub = subsets[idx];
      const overlap = sub.some(c => usedIds.has(c.id));
      recurse(idx + 1, usedIds, current);
      if (!overlap) {
        sub.forEach(c => usedIds.add(c.id));
        recurse(idx + 1, usedIds, [...current, ...sub]);
        sub.forEach(c => usedIds.delete(c.id));
      }
    }
    recurse(0, new Set(), []);
    return best;
  }

  const bestSumCapture = maxNonOverlapping(sumSubsets);

  // Step 4: build result options
  const results = [];
  if (byRank.length > 0) results.push(byRank);
  if (bestSumCapture.length > 0) results.push(bestSumCapture);
  if (byRank.length > 0 && bestSumCapture.length > 0) {
    results.push([...byRank, ...bestSumCapture]);
  }

  return results;
}

function canCapture(card, table) { return getAllCaptureCombinations(card, table).length > 0; }

function bestCapture(card, table) {
  const sets = getAllCaptureCombinations(card, table);
  if (!sets.length) return null;
  // Prefer full table clear (basra), then largest capture
  const fullClear = sets.find(s => {
    const capturedIds = new Set(s.map(c => c.id));
    return table.every(c => capturedIds.has(c.id));
  });
  if (fullClear) return fullClear;
  return sets.reduce((a, b) => b.length > a.length ? b : a, sets[0]);
}

// Backwards compat alias used in getCaptureSets-dependent places
function getCaptureSets(card, tableCards) { return getAllCaptureCombinations(card, tableCards); }
function cpuChooseCard(hand, tableCards, playerHand) {
  // ── OFFENSE ────────────────────────────────────────────────────────────────
  // Priority 1: CPU can make basra
  for (const card of hand) {
    if (!isSpecialClear(card) && !["Q", "K"].includes(card.rank)) {
      const cap = bestCapture(card, tableCards);
      if (cap && cap.length === tableCards.length && tableCards.length > 0) return { card, capture: cap };
    }
  }
  // Priority 2: 7♦ koma
  const sevenD = hand.find(is7Diamonds);
  if (sevenD && tableCards.length > 0) {
    const isFaceCard = (c) => ["J", "Q", "K"].includes(c.rank);
    const tableHas7D = tableCards.some(is7Diamonds);
    const allNumbers = tableCards.every(c => !isFaceCard(c)) && !tableHas7D;
    const faceOnly = tableCards.length === 1 && isFaceCard(tableCards[0]);
    const tableSum = tableCards.reduce((s, c) => s + cardValue(c), 0);
    if (faceOnly || (allNumbers && tableSum <= 10)) return { card: sevenD, capture: tableCards };
  }
  // Priority 3: Jack clears 3+ cards
  const jack = hand.find(isJack);
  if (jack && tableCards.length >= 3) return { card: jack, capture: tableCards };

  // ── DEFENSE ────────────────────────────────────────────────────────────────
  // Check if player can make basra on next turn — if so, disrupt the table
  if (playerHand && tableCards.length > 0) {
    const playerCanBasra = playerHand.some(pc => {
      if (isSpecialClear(pc) || ["Q", "K"].includes(pc.rank)) return false;
      const cap = bestCapture(pc, tableCards);
      return cap && cap.length === tableCards.length;
    });
    if (playerCanBasra) {
      // Try to add a card to the table to break the basra opportunity
      // Prefer lowest-value non-capturing card
      const disruptors = hand
        .filter(c => !bestCapture(c, tableCards)) // cards that don't capture (would just add to table)
        .sort((a, b) => cardValue(a) - cardValue(b));
      if (disruptors.length > 0) return { card: disruptors[0], capture: null };
      // Fallback: capture something (even partial) to change table state
      let partialBest = null, partialCount = 0;
      for (const card of hand) {
        const cap = bestCapture(card, tableCards);
        if (cap && cap.length < tableCards.length && cap.length > partialCount) {
          partialCount = cap.length; partialBest = { card, capture: cap };
        }
      }
      if (partialBest) return partialBest;
    }
  }

  // ── NORMAL PLAY ────────────────────────────────────────────────────────────
  // Priority 4: capture most cards
  let best = null, bestCount = 0;
  for (const card of hand) {
    const cap = bestCapture(card, tableCards);
    if (cap && cap.length > bestCount) { bestCount = cap.length; best = { card, capture: cap }; }
  }
  if (best) return best;
  // Priority 5: protect high-value cards — play lowest first
  return { card: [...hand].sort((a, b) => cardValue(a) - cardValue(b))[0], capture: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME PHASES
// ═══════════════════════════════════════════════════════════════════════════════
const PHASE = {
  PLAYER_TURN: "player_turn",
  CPU_TURN: "cpu_turn",
  P2_TURN: "p2_turn",
  PASS_SCREEN: "pass_screen", // show "pass device" overlay in local MP
  GAME_END: "game_end",
};
const MODE = { VS_CPU: "vs_cpu", LOCAL_MP: "local_mp" };

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Fire particles
const FIRE_COLORS = ["#ff9500", "#ff6000", "#ff3d00", "#ffcc00", "#ff4500"];
function FireParticle({ x, y, delay, size, color, drift, dist }) {
  return (
    <motion.div
      initial={{ x, y, opacity: 0.9, scale: 1 }}
      animate={{ x: x + drift, y: y - dist, opacity: 0, scale: 0.15 }}
      transition={{ duration: 0.8 + Math.random() * 0.4, delay, ease: "easeOut" }}
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: `radial-gradient(circle, ${color}, transparent)`, filter: "blur(3px)" }}
    />
  );
}
function FireOverlay({ active, streak }) {
  if (!active) return null;
  const count = streak >= 3 ? 42 : 28;
  const w = typeof window !== "undefined" ? window.innerWidth : 400;
  const h = typeof window !== "undefined" ? window.innerHeight : 700;
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i, x: Math.random() * w, y: h - Math.random() * 100,
    delay: Math.random() * 0.45, size: 10 + Math.random() * 28,
    color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
    drift: (Math.random() - 0.5) * 80, dist: 100 + Math.random() * 140,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {particles.map(p => <FireParticle key={p.id} {...p} />)}
    </div>
  );
}

function GoldFlash({ show, double: dbl }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, dbl ? 0.75 : 0.5, 0.2, dbl ? 0.6 : 0.4, 0] }}
          transition={{ duration: 1.0, times: [0, 0.12, 0.38, 0.62, 1] }}
          className="fixed inset-0 pointer-events-none z-30"
          style={{ background: dbl
            ? "radial-gradient(ellipse at center, rgba(255,100,0,0.7) 0%, rgba(255,215,0,0.5) 40%, transparent 75%)"
            : "radial-gradient(ellipse at center, rgba(255,215,0,0.65) 0%, rgba(212,120,0,0.3) 55%, transparent 80%)" }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Screen Shake ─────────────────────────────────────────────────────────────
// Wraps children and shakes the entire view on demand via shakeKey prop
function ScreenShake({ shake, children }) {
  const shakeAnim = shake ? {
    x: [0, -8, 10, -10, 8, -6, 6, -4, 3, -2, 0],
    y: [0, 4, -6, 5, -4, 3, -3, 2, -1, 1, 0],
  } : { x: 0, y: 0 };
  return (
    <motion.div
      animate={shakeAnim}
      transition={shake ? { duration: 0.55, ease: "easeOut" } : { duration: 0 }}
      style={{ width: "100%", height: "100%" }}>
      {children}
    </motion.div>
  );
}

// ─── Basra Pop Announcement ───────────────────────────────────────────────────
function BasraPopup({ show, isPlayer, streak, is7D, p2Label }) {
  const double = streak >= 2;
  const mainWord = is7D ? "קומא!" : (double ? `בסרה ×${streak}!` : "בסרה!");
  const color = is7D ? "#b44fff" : (double ? "#ff6000" : "#d4af37");
  const shadow = is7D
    ? "0 0 40px rgba(180,79,255,0.9), 0 4px 0 #4a007a, 0 8px 20px rgba(0,0,0,0.7)"
    : double
    ? "0 0 40px rgba(255,96,0,0.9), 0 4px 0 #7a2d00, 0 8px 20px rgba(0,0,0,0.7)"
    : "0 0 30px rgba(212,175,55,0.9), 0 4px 0 #7a5c00, 0 8px 20px rgba(0,0,0,0.7)";
  const stroke = is7D ? "2px #7700cc" : (double ? "2px #ff3d00" : "2px #a87d00");

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`basra-pop-${Date.now()}`}
          initial={{ opacity: 0, scale: 0.2, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0,
            transition: { type: "spring", stiffness: 420, damping: 18 } }}
          exit={{ opacity: 0, scale: 1.6, y: -60,
            transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div style={{ textAlign: "center" }}>
            {/* Who made it */}
            {!isPlayer && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
                style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.08em" }}>
                {p2Label || "מחשב"} עשה
              </motion.div>
            )}
            <motion.div
              animate={{ rotate: [-3, 3, -2, 2, 0] }}
              transition={{ duration: 0.4, delay: 0.05 }}
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: (double || is7D) ? "clamp(64px, 18vw, 96px)" : "clamp(52px, 15vw, 80px)",
                fontWeight: 900,
                letterSpacing: "0.04em",
                lineHeight: 1,
                color,
                textShadow: shadow,
                WebkitTextStroke: stroke,
              }}>
              {mainWord}
            </motion.div>
            {is7D && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.18 } }}
                style={{ fontSize: 22, marginTop: 6 }}>
                ♦ 7
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.22 } }}
              style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginTop: 8, fontWeight: 600 }}>
              +10 נקודות
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Dealing animation: cards fly from deck position ─────────────────────────
// Each card in the hand receives a staggered "fly-in from deck" animation
// The deck is visually at bottom-left of the table area; we simulate origin from there
function DealingCard({ card, index, total, small, fromDeck = false, children }) {
  // Each card flies in from the deck corner with a random slight rotation
  const rot = (index - total / 2) * 3;
  return (
    <motion.div
      key={card.id}
      initial={fromDeck ? {
        opacity: 0,
        x: -120 + Math.random() * 20,
        y: -80 + Math.random() * 20,
        scale: 0.5,
        rotate: rot - 15,
      } : { opacity: 0, y: 30, scale: 0.7 }}
      animate={{
        opacity: 1, x: 0, y: 0, scale: 1, rotate: 0,
        transition: {
          delay: index * 0.10,
          type: "spring", stiffness: 280, damping: 22,
        }
      }}
      exit={{ opacity: 0, x: -60, scale: 0.45, transition: { duration: 0.25 } }}>
      {children}
    </motion.div>
  );
}

// ─── Sweep overlay: Jack/7♦ collects all table cards to center then sweeps ─
function SweepOverlay({ cards, show, isPlayer, onDone }) {
  useEffect(() => {
    if (!show || !cards.length) return;
    // After gather (0.4s) + sweep (0.3s) = 0.7s total, then notify done
    const t = setTimeout(onDone, 720);
    return () => clearTimeout(t);
  }, [show, cards.length, onDone]);

  if (!show || !cards.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
      <AnimatePresence>
        {cards.map((card, i) => {
          const isRed = redSuits.has(card.suit);
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 1, x: (i - cards.length / 2) * 48, y: (i % 2 === 0 ? -20 : 20), scale: 1, rotate: (i - cards.length / 2) * 8 }}
              animate={[
                // Phase 1: gather to center (400ms)
                { x: 0, y: 0, scale: 0.95, rotate: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1], delay: i * 0.04 } },
                // Phase 2: fly to capture pile (300ms after gather)
                { x: isPlayer ? 160 : -160, y: isPlayer ? 200 : -200, scale: 0.3, opacity: 0, rotate: isPlayer ? 25 : -25, transition: { duration: 0.3, ease: "easeIn", delay: 0.4 } },
              ]}
              style={{
                position: "absolute",
                width: 64, height: 96,
                borderRadius: 8,
                border: "2px solid rgba(255,255,255,0.2)",
                background: "linear-gradient(135deg,#fff 0%,#f0f0f0 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
                color: isRed ? "#dc2626" : "#1e293b",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                fontWeight: "bold",
              }}>
              {card.suit}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function StreakMeter({ streak, small }) {
  const max = 5, active = Math.min(streak, max);
  if (streak === 0 && small) return null;
  return (
    <div className="flex flex-col items-center gap-0.5">
      {!small && <div className="text-xs text-white/40 mb-0.5">רצף</div>}
      <div className="flex gap-0.5 items-end">
        {Array.from({ length: max }).map((_, i) => {
          const lit = i < active, isTop = i === active - 1;
          return (
            <motion.div key={i} initial={false}
              animate={lit ? { scale: isTop ? [1, 1.4, 1] : 1, opacity: 1 } : { scale: 0.65, opacity: 0.15 }}
              transition={lit && isTop ? { duration: 0.35 } : {}}>
              <Flame size={isTop && lit ? (small ? 18 : 20) : (small ? 13 : 15)}
                style={{ color: lit ? (streak >= 3 ? "#ff3d00" : streak >= 2 ? "#ff7700" : "#fbbf24") : "#ffffff33",
                  filter: lit && streak >= 2 ? `drop-shadow(0 0 ${streak >= 3 ? 6 : 3}px orange)` : "none", transition: "all 0.3s" }} />
            </motion.div>
          );
        })}
        {streak > max && <span className="text-xs text-orange-400 font-bold">×{streak}</span>}
      </div>
    </div>
  );
}

const redSuits = new Set(["♥", "♦"]);

// Face card center illustrations — same symbol per rank regardless of suit
const FACE_ART = {
  K: "♔",
  Q: "♕",
  J: "♘",
};

function CardFace({ card, small, selected, onClick, highlight }) {
  const isRed = redSuits.has(card.suit);
  const faceArt = FACE_ART[card.rank];

  return (
    <div onClick={onClick}
      className={`relative rounded-lg select-none flex flex-col justify-between shadow-lg border-2 transition-all duration-150 overflow-hidden
        ${selected ? "border-yellow-400 scale-110 shadow-yellow-400/60 shadow-xl" : highlight ? "border-yellow-400/50" : "border-white/20"}
        ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={{
        background: "linear-gradient(135deg, #fff 0%, #f0f0f0 100%)",
        width: small ? "clamp(36px, 9vw, 48px)" : "clamp(44px, 11vw, 60px)",
        height: small ? "clamp(50px, 12vw, 64px)" : "clamp(62px, 15vw, 88px)",
        padding: "clamp(2px, 0.5vw, 4px)",
      }}>
      {/* Top-left rank + suit */}
      <div className={`font-bold leading-none ${isRed ? "text-red-600" : "text-slate-900"}`}
        style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
        <div style={{ lineHeight: 1 }}>{card.rank}</div>
        <div style={{ lineHeight: 1, fontSize: "clamp(9px, 2.2vw, 11px)" }}>{card.suit}</div>
      </div>
      {/* Center — face card art or suit symbol */}
      {faceArt ? (
        <div className="flex items-center justify-center"
          style={{
            fontSize: small ? "clamp(10px, 2.5vw, 16px)" : "clamp(14px, 3.5vw, 24px)",
            color: isRed ? "#b91c1c" : "#1e1b4b",
            lineHeight: 1,
          }}>
          {faceArt}
        </div>
      ) : (
        <div className={`text-center font-bold ${isRed ? "text-red-500" : "text-slate-800"}`}
          style={{ fontSize: small ? "clamp(8px, 2vw, 14px)" : "clamp(11px, 2.8vw, 18px)" }}>
          {card.suit}
        </div>
      )}
      {/* Bottom rank + suit (rotated) */}
      <div className={`font-bold leading-none rotate-180 self-end ${isRed ? "text-red-600" : "text-slate-900"}`}
        style={{ fontSize: "clamp(10px, 2.8vw, 13px)" }}>
        <div style={{ lineHeight: 1 }}>{card.rank}</div>
        <div style={{ lineHeight: 1, fontSize: "clamp(9px, 2.2vw, 11px)" }}>{card.suit}</div>
      </div>
      {(is2Spades(card) || is10Diamonds(card) || is7Diamonds(card) || isAce(card) || isJack(card)) && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 border border-yellow-600" />
      )}
    </div>
  );
}
function CardBack({ small }) {
  return (
    <div
      className="rounded-lg border-2 border-white/20 shadow-lg"
      style={{
        width: small ? "clamp(36px, 9vw, 48px)" : "clamp(44px, 11vw, 60px)",
        height: small ? "clamp(50px, 12vw, 64px)" : "clamp(62px, 15vw, 88px)",
        background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)",
      }}>
      <div className="w-full h-full rounded-md m-0.5 border border-blue-300/30"
        style={{ background: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,0.05) 3px,rgba(255,255,255,0.05) 6px)" }} />
    </div>
  );
}

function ScoreBadge({ label, score, cards, isActive, basras, captured, opponentCards }) {
  // Live bonus preview
  const has2S = captured?.some(is2Spades);
  const has10D = captured?.some(is10Diamonds);
  const aces = captured?.filter(isAce).length ?? 0;
  const jacks = captured?.filter(isJack).length ?? 0;
  const isLeading = opponentCards !== undefined && cards > opponentCards;
  const isTied = opponentCards !== undefined && cards === opponentCards;

  return (
    <motion.div
      animate={isActive ? { boxShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 16px rgba(212,175,55,0.4)", "0 0 0px rgba(212,175,55,0)"] } : { boxShadow: "none" }}
      transition={isActive ? { repeat: Infinity, duration: 1.6 } : {}}
      className={`flex-1 rounded-2xl border transition-all duration-300 overflow-hidden
        ${isActive ? "border-yellow-400/60 bg-white/10" : "border-white/10 bg-white/5"}`}>

      {/* Top: label + main score */}
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex flex-col items-start">
          <div className="text-xs text-white/50 leading-none mb-1">{label}</div>
          <motion.div
            key={score}
            initial={{ scale: 1.3, color: "#d4af37" }}
            animate={{ scale: 1, color: "#ffffff" }}
            transition={{ duration: 0.4, type: "spring" }}
            className="text-3xl font-bold text-white leading-none">
            {score}
          </motion.div>
          <div className="text-xs text-white/30 mt-0.5">נקודות</div>
        </div>

        {/* Right side: cards count + lead indicator */}
        <div className="flex flex-col items-end gap-1 pt-0.5">
          <div className="text-sm font-semibold text-white/70">{cards}</div>
          <div className="text-xs text-white/30">קלפים</div>
          {isLeading && (
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
              className="text-xs px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
              מוביל +6
            </motion.div>
          )}
          {isTied && opponentCards > 0 && (
            <div className="text-xs text-white/30 px-1.5 py-0.5 rounded-full border border-white/10">שווה</div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />

      {/* Bottom: bonus breakdown */}
      <div className="flex items-center gap-2 flex-wrap px-3 py-1.5">
        {basras > 0 && (
          <div className="flex items-center gap-0.5">
            <Flame size={10} style={{ color: "#ff7700" }} />
            <span className="text-xs text-orange-400">{basras}×10</span>
          </div>
        )}
        {has2S && <div className="text-xs text-yellow-300/80">♠+2</div>}
        {has10D && <div className="text-xs text-yellow-300/80">♦+3</div>}
        {aces > 0 && <div className="text-xs text-yellow-300/80">A×{aces}</div>}
        {jacks > 0 && <div className="text-xs text-yellow-300/80">J×{jacks}</div>}
        {basras === 0 && !has2S && !has10D && aces === 0 && jacks === 0 && (
          <div className="text-xs text-white/20">—</div>
        )}
      </div>
    </motion.div>
  );
}

function Toast({ message, emoji, big }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.65 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 17 } }}
      exit={{ opacity: 0, y: -30, scale: 0.8, transition: { duration: 0.22 } }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl font-bold ${big ? "text-xl" : "text-base"}`}
      style={{
        background: big ? "linear-gradient(135deg,#ff6000,#ffaa00,#ff6000)" : "linear-gradient(135deg,#d4af37,#f5d16e,#d4af37)",
        color: "#1a1a1a",
        boxShadow: big ? "0 0 50px rgba(255,120,0,0.9),0 4px 24px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.4)",
      }}>
      <span className={big ? "text-3xl" : "text-xl"}>{emoji}</span>
      <span>{message}</span>
    </motion.div>
  );
}

function CountdownRing({ timeLeft, total = 30 }) {
  const r = 22, circ = 2 * Math.PI * r;
  const progress = Math.max(0, timeLeft / total);
  const offset = circ * (1 - progress);
  const critical = timeLeft <= 5, urgent = timeLeft <= 10;
  const color = critical ? "#ef4444" : urgent ? "#f97316" : "#d4af37";
  return (
    <motion.div animate={critical ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={critical ? { repeat: Infinity, duration: 0.6 } : {}}
      className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <svg width="56" height="56" className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <motion.circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset, stroke: color }}
          transition={{ duration: 0.4, ease: "linear" }}
          style={{ filter: critical ? `drop-shadow(0 0 4px ${color})` : "none" }} />
      </svg>
      <motion.span key={timeLeft}
        initial={{ scale: urgent ? 1.25 : 1, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="font-bold text-sm relative z-10" style={{ color, fontVariantNumeric: "tabular-nums" }}>
        {timeLeft}
      </motion.span>
    </motion.div>
  );
}

function ConfirmRestartModal({ onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full text-right shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="text-3xl mb-3 text-center">🔄</div>
        <h2 className="text-lg font-bold text-white mb-2 text-center">את/ה בטוח רוצה משחק חדש?</h2>
        <p className="text-sm text-white/50 text-center mb-5">המשחק הנוכחי יאבד.</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/15 hover:bg-white/8 transition-all">
            המשך לשחק
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg,#d4af37,#f5d16e)", color: "#1a1a1a" }}>
            כן, משחק חדש
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmQuitModal({ onConfirm, onCancel }) {  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-xs w-full text-right shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="text-3xl mb-3 text-center">🚪</div>
        <h2 className="text-lg font-bold text-white mb-2 text-center">את/ה בטוח רוצה לפרוש?</h2>
        <p className="text-sm text-white/50 text-center mb-5">המשחק הנוכחי לא יישמר.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/15 hover:bg-white/8 transition-all">
            המשך לשחק
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}>
            כן, פרוש
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoModal({ onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.82, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.82, y: 40 }}
        className="relative bg-slate-900 border border-white/10 rounded-2xl max-w-sm w-full shadow-2xl text-right overflow-hidden"
        style={{ maxHeight: "85vh" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
          <h2 className="text-lg font-bold text-yellow-400">⚡ חוקי המשחק</h2>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 py-4 space-y-5" style={{ maxHeight: "calc(85vh - 64px)" }}>

          {/* Goal */}
          <section>
            <h3 className="text-yellow-300 font-bold text-sm mb-1.5 flex items-center gap-1.5">🎯 מטרת המשחק</h3>
            <p className="text-white/70 text-xs leading-relaxed">
              לצבור <span className="text-white font-semibold">יותר נקודות מהיריב</span> עד שנגמרים כל 52 הקלפים בחבילה. אין מספר קבוע לניצחון — מי שגמר עם יותר נקודות, ניצח.
            </p>
          </section>

          {/* How to play */}
          <section>
            <h3 className="text-yellow-300 font-bold text-sm mb-1.5 flex items-center gap-1.5">🃏 איך משחקים?</h3>
            <div className="space-y-2 text-xs text-white/70 leading-relaxed">
              <p>• כל שחקן מקבל <span className="text-white font-semibold">4 קלפים</span> ביד, ו-4 קלפים מונחים על השולחן.</p>
              <p>• בכל תור שחקן <span className="text-white font-semibold">זורק קלף אחד</span> מהיד שלו.</p>
              <p>• אם הקלף <span className="text-white font-semibold">תואם בערך</span> לקלף על השולחן — הוא לוכד אותו.</p>
              <p>• אם הקלף <span className="text-white font-semibold">שווה לסכום</span> של כמה קלפים על השולחן — הוא לוכד את כולם. לדוגמא: 9 לוכד 5+4.</p>
              <p>• אם אין לכידה — הקלף נשאר על השולחן.</p>
            </div>
          </section>

          {/* Basra */}
          <section>
            <h3 className="text-yellow-300 font-bold text-sm mb-1.5 flex items-center gap-1.5">🔥 בסרה</h3>
            <p className="text-white/70 text-xs leading-relaxed">
              אם לכדת את <span className="text-white font-semibold">כל הקלפים על השולחן</span> בבת אחת (לא עם ג'וקר) — זה <span className="text-yellow-300 font-semibold">בסרה</span>! מקבלים +10 נקודות מיד. רצף של שתי בסרות ברצף מקבל אנימציית אש 🔥
            </p>
          </section>

          {/* Special cards */}
          <section>
            <h3 className="text-yellow-300 font-bold text-sm mb-1.5 flex items-center gap-1.5">✨ קלפים מיוחדים</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5">
                <span className="text-yellow-300 font-bold w-10 shrink-0">J (ג'וקר)</span>
                <span className="text-white/70">מנקה את כל השולחן אוטומטית — אבל <span className="text-white">לא</span> נחשב בסרה. שווה 1 נקודה בסיום.</span>
              </div>
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5">
                <span className="text-yellow-300 font-bold w-10 shrink-0">7 ♦</span>
                <span className="text-white/70"><span className="text-purple-300 font-semibold">קומא</span> — מנקה כמו ג'וקר, אבל נחשב קומא (+10) אם על השולחן יש: ציור בודד, או קלפי ספרות שסכומם עד 10.</span>
              </div>
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5">
                <span className="text-yellow-300 font-bold w-10 shrink-0">A (אס)</span>
                <span className="text-white/70">שווה 1 נקודה בסיום לכל אס שאספת (מקסימום 4).</span>
              </div>
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5">
                <span className="text-yellow-300 font-bold w-10 shrink-0">2 ♠</span>
                <span className="text-white/70">שווה 2 נקודות נוספות בסיום.</span>
              </div>
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5">
                <span className="text-yellow-300 font-bold w-10 shrink-0">10 ♦</span>
                <span className="text-white/70">שווה 3 נקודות נוספות בסיום.</span>
              </div>
            </div>
          </section>

          {/* Scoring summary */}
          <section>
            <h3 className="text-yellow-300 font-bold text-sm mb-1.5 flex items-center gap-1.5">🏆 ניקוד וניצחון</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
              {[
                ["בסרה / קומא", "+10 נקודות"],
                ["ג'וקר (J)", "+1 נקודה"],
                ["אס (A)", "+1 לכל אחד"],
                ["2 ♠", "+2 נקודות"],
                ["10 ♦", "+3 נקודות"],
                ["הכי הרבה קלפים", "+6 נקודות"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between bg-white/5 rounded-lg px-2.5 py-1.5">
                  <span className="text-white/60">{k}</span>
                  <span className="text-yellow-300 font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-yellow-400/10 border border-yellow-400/25 rounded-xl p-3 text-xs">
              <div className="text-yellow-300 font-bold mb-1">🎖️ איך מנצחים?</div>
              <p className="text-white/70 leading-relaxed">
                המשחק נגמר כשנגמרים כל 52 הקלפים. <span className="text-white font-semibold">מי שצבר יותר נקודות — מנצח.</span> הניקוד המקסימלי התיאורטי הוא כ-57 נקודות (4 בסרות + כל הקלפים המיוחדים + בונוס קלפים), אבל ברוב המשחקים מנצחים עם <span className="text-white font-semibold">15–35 נקודות</span>. אם יש תיקו — המשחק מסתיים בתיקו.
              </p>
            </div>
          </section>

          {/* Timer */}
          <section className="pb-1">
            <h3 className="text-yellow-300 font-bold text-sm mb-1.5 flex items-center gap-1.5">⏱️ טיימר</h3>
            <p className="text-white/70 text-xs leading-relaxed">
              יש לך <span className="text-white font-semibold">30 שניות</span> לכל תור. אם הזמן נגמר — קלף רנדומלי ישוחק אוטומטית.
            </p>
          </section>

        </div>
      </motion.div>
    </motion.div>
  );
}

function EndScreen({ result, playerScore, cpuScore, playerBasras, cpuBasras, mode, onRestart, onMenu, playerCaptured, cpuCaptured }) {
  const isMP = mode === MODE.LOCAL_MP;
  const p1Label = isMP ? "שחקן 1" : "אתה";
  const p2Label = isMP ? "שחקן 2" : "מחשב";
  const won = result === "player", tied = result === "tie";

  // Build score breakdown for each player
  const breakdown = (captured, basras) => {
    const items = [];
    if (basras > 0) items.push({ label: `בסרה ×${basras}`, pts: basras * 10 });
    const aces = captured.filter(isAce).length;
    if (aces > 0) items.push({ label: `אס ×${aces}`, pts: aces });
    const jacks = captured.filter(isJack).length;
    if (jacks > 0) items.push({ label: `ג'וקר ×${jacks}`, pts: jacks });
    if (captured.some(is2Spades)) items.push({ label: "2 ♠", pts: 2 });
    if (captured.some(is10Diamonds)) items.push({ label: "10 ♦", pts: 3 });
    // Most cards bonus (+6)
    const pLen = playerCaptured?.length ?? 0;
    const cLen = cpuCaptured?.length ?? 0;
    const iWonCards = captured === playerCaptured ? pLen > cLen : cLen > pLen;
    if (iWonCards) items.push({ label: "הכי הרבה קלפים", pts: 6 });
    return items;
  };

  const pBreak = breakdown(playerCaptured ?? [], playerBasras);
  const cBreak = breakdown(cpuCaptured ?? [], cpuBasras);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.6, y: 60 }} animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 18 } }}
        className="text-center rounded-3xl border shadow-2xl w-full mx-auto overflow-hidden"
        style={{ maxWidth: 340, background: "linear-gradient(135deg,#0f172a,#1e293b)", borderColor: won ? "#d4af37" : tied ? "#64748b" : "#ef4444" }}>

        {/* Result header */}
        <div className="px-6 pt-6 pb-4">
          <div className="text-5xl mb-3">{won ? "🏆" : tied ? "🤝" : "😔"}</div>
          <h2 className="text-xl font-bold" style={{ color: won ? "#d4af37" : tied ? "#94a3b8" : "#ef4444" }}>
            {won ? (isMP ? "שחקן 1 ניצח!" : "ניצחת!") : tied ? "תיקו!" : (isMP ? "שחקן 2 ניצח!" : "המחשב ניצח!")}
          </h2>
        </div>

        {/* Score columns */}
        <div className="flex gap-3 px-4 pb-4 text-right">
          {/* Player 1 */}
          <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: won ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-white/50 mb-1">{p1Label}</div>
            <div className="text-2xl font-bold text-white mb-2">{playerScore}</div>
            {pBreak.length > 0 ? (
              <div className="space-y-1">
                {pBreak.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-yellow-300">+{item.pts}</span>
                    <span className="text-white/50">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-xs text-white/25">—</div>}
            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/30">
              {playerCaptured?.length ?? 0} קלפים
            </div>
          </div>

          {/* Player 2 / CPU */}
          <div className="flex-1 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.05)", border: !won && !tied ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs text-white/50 mb-1">{p2Label}</div>
            <div className="text-2xl font-bold text-white mb-2">{cpuScore}</div>
            {cBreak.length > 0 ? (
              <div className="space-y-1">
                {cBreak.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-yellow-300">+{item.pts}</span>
                    <span className="text-white/50">{item.label}</span>
                  </div>
                ))}
              </div>
            ) : <div className="text-xs text-white/25">—</div>}
            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/30">
              {cpuCaptured?.length ?? 0} קלפים
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 px-4 pb-5">
          <button onClick={onMenu} className="flex-1 py-2.5 rounded-xl font-bold text-white/70 border border-white/20 hover:bg-white/10 transition-all text-sm flex items-center justify-center gap-1">
            <ChevronLeft size={14} /> תפריט
          </button>
          <button onClick={onRestart}
            className="flex-1 py-2.5 rounded-xl font-bold text-slate-900 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#d4af37,#f5d16e)" }}>
            <RefreshCw size={14} /> שוב
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Pass-Device Screen (Local MP) ─────────────────────────────────────────────
function PassDeviceScreen({ toPlayer, onReveal }) {
  return (
    <motion.div
      key="pass-screen"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.35 } }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #0a1628 0%, #040d07 100%)" }}>

      <EthiopianBackground />

      <div className="relative z-10 flex flex-col items-center">
      {/* Animated divider lines */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="w-24 h-0.5 mb-8 rounded-full" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-center px-8">
        <div className="text-5xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#d4af37" }}>
          תור {toPlayer}!
        </h2>
        <p className="text-white/50 text-sm mb-8">
          העבר את המכשיר לשחקן {toPlayer}.<br />לחץ "חשוף קלפים" כשאתה מוכן.
        </p>

        <motion.button
          onClick={onReveal}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 mx-auto px-8 py-4 rounded-2xl font-bold text-slate-900 text-lg shadow-2xl"
          style={{ background: "linear-gradient(135deg,#d4af37,#f5d16e)", boxShadow: "0 0 30px rgba(212,175,55,0.4)" }}>
          <Eye size={20} />
          חשוף קלפים
        </motion.button>
      </motion.div>

      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="w-24 h-0.5 mt-8 rounded-full" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
      </div>
    </motion.div>
  );
}

// ─── Mode Selector Screen ──────────────────────────────────────────────────────
function ModeSelector({ onSelect }) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <div dir="rtl" lang="he" className="relative min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2e1a 0%, #071a0e 60%, #040d07 100%)", fontFamily: "'Segoe UI',Tahoma,Geneva,sans-serif" }}>

      <EthiopianBackground forMenu />

      <AnimatePresence>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center w-full">
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="text-center mb-10">
        <h1 className="text-5xl font-bold tracking-widest mb-2"
          style={{ color: "#d4af37", textShadow: "0 0 40px rgba(212,175,55,0.6)" }}>בסרה</h1>
        <div className="text-white/30 text-sm tracking-widest">BASRA CARD GAME</div>
        {/* Decorative cards */}
        <div className="flex justify-center gap-2 mt-5">
          {["♠", "♥", "♦", "♣"].map((s, i) => (
            <motion.div key={s}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, type: "spring" }}
              className="text-2xl" style={{ color: s === "♥" || s === "♦" ? "#ef4444" : "#e2e8f0" }}>
              {s}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mode cards */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <motion.button
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, type: "spring" }}
          onClick={() => onSelect(MODE.VS_CPU)}
          whileHover={{ scale: 1.03, x: -4 }} whileTap={{ scale: 0.97 }}
          className="relative overflow-hidden rounded-2xl p-5 text-right border border-white/10 hover:border-yellow-400/40 transition-all group"
          style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))" }}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-hover:text-white/20 transition-all">
            <Monitor size={36} />
          </div>
          <div className="text-yellow-400 font-bold text-lg mb-1">נגד המחשב</div>
          <div className="text-white/50 text-sm">שחק לבד מול AI חכם</div>
          <div className="mt-2 flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400/70 border border-yellow-400/20">AI חכם</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400/70 border border-yellow-400/20">טיימר 30 שנ׳</span>
          </div>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, type: "spring" }}
          className="relative overflow-hidden rounded-2xl p-5 text-right border border-white/10 opacity-50 cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))" }}>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10">
            <Users size={36} />
          </div>
          <div className="absolute top-3 left-3">
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(59,130,246,0.25)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}>
              בקרוב
            </span>
          </div>
          <div className="text-blue-400/50 font-bold text-lg mb-1">שחקנים מקומיים</div>
          <div className="text-white/30 text-sm">שני שחקנים על אותו מכשיר</div>
          <div className="mt-2 flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/5 text-blue-400/30 border border-blue-400/10">2 שחקנים</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/5 text-blue-400/30 border border-blue-400/10">הסתרת קלפים</span>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="mt-4">
        <button
          onClick={() => setShowInfo(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/5 hover:text-white/80 hover:border-white/20 transition-all">
          <Info size={14} />
          חוקי המשחק
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="mt-4 text-white/20 text-xs text-center">52 קלפים · בסרה ישראלית קלאסית</motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="mt-3 text-center">
        <span className="text-white/45 text-xs tracking-wider">נוצר ע"י </span>
        <span className="text-yellow-400/70 text-xs font-semibold tracking-wider">אמיר נגט</span>
      </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME STATE INIT
// ═══════════════════════════════════════════════════════════════════════════════
function initGame(mode) {
  let deck = shuffle(buildDeck());
  let tableCards = [];
  let attempts = 0;
  while (tableCards.length < 4 && attempts < 100) {
    attempts++;
    const card = deck.shift();
    if (isSpecialClear(card)) { deck.push(card); deck = shuffle(deck); }
    else tableCards.push(card);
  }
  return {
    mode,
    deck, tableCards,
    playerHand: deck.splice(0, 4),   // P1 always
    cpuHand: deck.splice(0, 4),       // P2 or CPU
    playerCaptured: [], cpuCaptured: [],
    playerScore: 0, cpuScore: 0,
    playerBasras: 0, cpuBasras: 0,
    playerStreak: 0, cpuStreak: 0,
    lastCaptor: null,
    phase: PHASE.PLAYER_TURN,
    selectedCard: null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function BasraGame() {
  const [screen, setScreen] = useState("menu"); // "menu" | "game"
  const [mode, setMode] = useState(null);
  const [game, setGame] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [goldFlash, setGoldFlash] = useState(false);
  const [fireActive, setFireActive] = useState(false);
  const [fireKey, setFireKey] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  // Local MP: whether the current player's cards are revealed
  const [cardsRevealed, setCardsRevealed] = useState(true);
  // New animation states
  const [screenShake, setScreenShake] = useState(false);
  const [basraPopup, setBasraPopup] = useState({ show: false, isPlayer: true, streak: 1 });
  const [sweepCards, setSweepCards] = useState([]);
  const [sweepShow, setSweepShow] = useState(false);
  const [sweepIsPlayer, setSweepIsPlayer] = useState(true);
  const [dealKey, setDealKey] = useState(0); // bumped on each new deal to retrigger fly-in
  const TURN_SECONDS = 30;

  const cpuTimer = useRef(null);
  const countdownRef = useRef(null);
  const timeLeftRef = useRef(30);
  const audioCtx = useRef(null);

  const audio = () => {
    if (!audioCtx.current) audioCtx.current = createAudioCtx();
    try { if (audioCtx.current?.state === "suspended") audioCtx.current.resume(); } catch {}
    return audioCtx.current;
  };

  const addToast = useCallback((msg, emoji, big = false) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message: msg, emoji, big }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), big ? 2800 : 2100);
  }, []);

  const triggerBasraFX = useCallback((streak, isPlayer, did7D = false, p2Lbl = "מחשב") => {
    playBasraFanfare(audio(), streak);
    setGoldFlash(true); setTimeout(() => setGoldFlash(false), 1050);
    setCurrentStreak(streak);
    setScreenShake(false);
    setTimeout(() => setScreenShake(true), 20);
    setTimeout(() => setScreenShake(false), 600);
    setBasraPopup({ show: true, isPlayer, streak, is7D: did7D, p2Label: p2Lbl });
    setTimeout(() => setBasraPopup(p => ({ ...p, show: false })), 1200);
    if (streak >= 2) {
      setFireKey(k => k + 1); setFireActive(true); setTimeout(() => setFireActive(false), 1500);
      addToast(isPlayer ? `🔥 רצף בסרה ×${streak}!` : `${p2Lbl}: רצף ×${streak}! 🔥`, "🔥", true);
    } else {
      addToast(isPlayer
        ? (did7D ? "קומא! +10" : "בסרה! +10")
        : (did7D ? `${p2Lbl}: קומא! +10` : `${p2Lbl}: בסרה! +10`), "🎉");
    }
  }, [addToast]);

  const computeFinalScore = useCallback((g) => {
    let ps = g.playerScore, cs = g.cpuScore;
    if (g.playerCaptured.some(is2Spades)) ps += 2;
    if (g.cpuCaptured.some(is2Spades)) cs += 2;
    if (g.playerCaptured.some(is10Diamonds)) ps += 3;
    if (g.cpuCaptured.some(is10Diamonds)) cs += 3;
    ps += g.playerCaptured.filter(isAce).length;
    cs += g.cpuCaptured.filter(isAce).length;
    ps += g.playerCaptured.filter(isJack).length;
    cs += g.cpuCaptured.filter(isJack).length;
    if (g.playerCaptured.length > g.cpuCaptured.length) ps += 6;
    else if (g.cpuCaptured.length > g.playerCaptured.length) cs += 6;
    return { playerScore: ps, cpuScore: cs };
  }, []);

  const playCardMove = useCallback((card, isPlayer) => {
    setGame(prev => {
      if (!prev) return prev;
      const expectedPhase = isPlayer ? PHASE.PLAYER_TURN : (prev.mode === MODE.LOCAL_MP ? PHASE.P2_TURN : PHASE.CPU_TURN);
      if (prev.phase !== expectedPhase) return prev;

      const g = { ...prev };
      const hand = isPlayer ? [...g.playerHand] : [...g.cpuHand];
      const idx = hand.findIndex(c => c.id === card.id);
      if (idx === -1) return prev;
      hand.splice(idx, 1);

      const capture = bestCapture(card, g.tableCards);
      let newTable = [...g.tableCards];
      let captured = [];
      // Compute all flags right here, synchronously, in the updater
      const didCapture = !!capture;
      const didJack = isJack(card);
      const did7D = is7Diamonds(card);
      let didBasra = false;

      if (capture) {
        captured = [...capture, card];
        const ids = new Set(capture.map(c => c.id));
        newTable = newTable.filter(c => !ids.has(c.id));
        // Basra: cleared whole table, not with Jack/7D/Q/K, AND the table didn't consist only of Jacks/7D
        const isFaceCardPlayed = ["Q", "K"].includes(card.rank);
        const tableWasOnlySpecial = prev.tableCards.length > 0 &&
          prev.tableCards.every(c => isSpecialClear(c));
        if (!didJack && !did7D && !isFaceCardPlayed && newTable.length === 0 && !tableWasOnlySpecial) didBasra = true;
        // Koma (7♦): valid only if table has cards AND:
        //   - exactly one face card (J/Q/K) alone, OR
        //   - all cards are number cards (A-10, not 7♦) with total sum ≤ 10
        if (did7D && capture.length > 0) {
          const tableBefore = prev.tableCards;
          const isFaceCard = (c) => ["J", "Q", "K"].includes(c.rank);
          const tableHas7D = tableBefore.some(is7Diamonds);
          const faceCount = tableBefore.filter(isFaceCard).length;
          const allNumbers = tableBefore.every(c => !isFaceCard(c)) && !tableHas7D;
          const tableSum = tableBefore.reduce((s, c) => s + cardValue(c), 0);
          const validKoma =
            (faceCount === 1 && tableBefore.length === 1) || // single face card alone
            (allNumbers && tableSum <= 10);                   // all numbers (no 7♦) summing ≤10
          if (validKoma) didBasra = true;
        }
      } else {
        newTable = [...newTable, card];
      }

      if (isPlayer) {
        g.playerHand = hand;
        if (capture) {
          g.playerCaptured = [...g.playerCaptured, ...captured];
          g.lastCaptor = "player";
          if (didBasra) {
            g.playerScore += 10; g.playerBasras++;
            g.playerStreak = prev.playerStreak + 1; g.cpuStreak = 0;
          } else { g.playerStreak = 0; }
        }
      } else {
        g.cpuHand = hand;
        if (capture) {
          g.cpuCaptured = [...g.cpuCaptured, ...captured];
          g.lastCaptor = "cpu";
          if (didBasra) {
            g.cpuScore += 10; g.cpuBasras++;
            g.cpuStreak = prev.cpuStreak + 1; g.playerStreak = 0;
          } else { g.cpuStreak = 0; }
        }
      }

      g.tableCards = newTable;
      g.selectedCard = null;

      // Next phase / dealing
      const p1Empty = g.playerHand.length === 0, p2Empty = g.cpuHand.length === 0;
      const dealNew = !!(p1Empty && p2Empty && g.deck.length > 0);

      // Attach FX metadata to state — useEffect will read it and fire effects
      const streak = isPlayer ? g.playerStreak : g.cpuStreak;
      g._pendingFX = { didBasra, didCapture, didJack, did7D, isPlayer, streak, dealNew,
        p2Label: prev.mode === MODE.LOCAL_MP ? "שחקן 2" : "מחשב",
        sweepCards: (didJack || did7D) && prev.tableCards.length > 0 ? [...prev.tableCards, card] : [],
        _id: (prev._pendingFX?._id ?? 0) + 1 };

      if (p1Empty && p2Empty) {
        if (g.deck.length >= 8) {
          g.playerHand = g.deck.splice(0, 4);
          g.cpuHand = g.deck.splice(0, 4);
          if (g.mode === MODE.LOCAL_MP) {
            g._nextPhaseAfterPass = PHASE.PLAYER_TURN;
            g.phase = PHASE.PASS_SCREEN;
          } else {
            g.phase = PHASE.PLAYER_TURN;
          }
        } else if (g.deck.length > 0 && g.deck.length < 8) {
          // Deal remaining cards evenly (up to 4 each)
          g.playerHand = g.deck.splice(0, Math.min(4, g.deck.length));
          if (g.deck.length > 0) g.cpuHand = g.deck.splice(0, Math.min(4, g.deck.length));
          if (g.mode === MODE.LOCAL_MP) {
            g._nextPhaseAfterPass = PHASE.PLAYER_TURN;
            g.phase = PHASE.PASS_SCREEN;
          } else {
            g.phase = PHASE.PLAYER_TURN;
          }
        } else {
          // No cards left — give remaining table cards to last captor
          if (g.lastCaptor === "player") g.playerCaptured = [...g.playerCaptured, ...g.tableCards];
          else if (g.lastCaptor === "cpu") g.cpuCaptured = [...g.cpuCaptured, ...g.tableCards];
          g.tableCards = [];
          const final = computeFinalScore(g);
          g.playerScore = final.playerScore; g.cpuScore = final.cpuScore;
          g.phase = PHASE.GAME_END;
        }
      } else {
        if (g.mode === MODE.LOCAL_MP) {
          g._nextPhaseAfterPass = isPlayer ? PHASE.P2_TURN : PHASE.PLAYER_TURN;
          g.phase = PHASE.PASS_SCREEN;
        } else {
          g.phase = isPlayer ? PHASE.CPU_TURN : PHASE.PLAYER_TURN;
        }
      }

      return g;
    });
  }, [computeFinalScore]);

  // CPU turn
  useEffect(() => {
    if (!game || game.phase !== PHASE.CPU_TURN) return;
    cpuTimer.current = setTimeout(() => {
      const { card } = cpuChooseCard(game.cpuHand, game.tableCards, game.playerHand);
      playCardMove(card, false);
    }, 1300);
    return () => clearTimeout(cpuTimer.current);
  }, [game?.phase, game?.cpuHand, game?.tableCards, playCardMove]);

  // Fire all sound/animation effects based on _pendingFX stored in state
  const lastFXRef = useRef(null);
  useEffect(() => {
    if (!game?._pendingFX) return;
    const fx = game._pendingFX;
    if (lastFXRef.current === fx._id) return;
    lastFXRef.current = fx._id;

    const { didBasra, didCapture, didJack, did7D, isPlayer, streak, sweepCards: sc, dealNew } = fx;

    if (didBasra) {
      const p2Lbl = fx.p2Label || "מחשב";
      setTimeout(() => triggerBasraFX(streak, isPlayer, did7D, p2Lbl), 80);
    } else if (didCapture) {
      if ((didJack || did7D) && sc?.length > 0) {
        setSweepCards(sc);
        setSweepIsPlayer(isPlayer);
        setSweepShow(true);
        setTimeout(() => playWhoosh(audio()), 30);
        if (didJack) setTimeout(() => addToast(isPlayer ? "ג'וקר! שולחן נוקה" : "ג'וקר!", "♠️"), 60);
      } else {
        setTimeout(() => playWhoosh(audio()), 60);
      }
    } else {
      setTimeout(() => playCardRustle(audio()), 60);
    }

    if (dealNew) {
      setTimeout(() => { playCardRustle(audio()); setDealKey(k => k + 1); }, 300);
    }
  }, [game?._pendingFX, triggerBasraFX, addToast]);

  // Countdown — runs for PLAYER_TURN and P2_TURN in local MP (when cardsRevealed)
  const activePlayerPhase = game?.phase === PHASE.PLAYER_TURN || game?.phase === PHASE.P2_TURN;
  useEffect(() => {
    clearInterval(countdownRef.current);
    if (!game || !activePlayerPhase || !cardsRevealed || game.phase === PHASE.PASS_SCREEN) return;
    timeLeftRef.current = TURN_SECONDS;
    setTimeLeft(TURN_SECONDS);
    countdownRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 10 && timeLeftRef.current > 0) playTick(audio(), timeLeftRef.current <= 5);
      if (timeLeftRef.current <= 0) {
        clearInterval(countdownRef.current);
        const isP1 = game.phase === PHASE.PLAYER_TURN;
        setGame(prev => {
          if (!prev) return prev;
          const hand = isP1 ? prev.playerHand : prev.cpuHand;
          if (hand.length === 0) return prev;
          const randomCard = hand[Math.floor(Math.random() * hand.length)];
          setTimeout(() => { playTimeoutBuzz(audio()); addToast("הזמן נגמר! קלף רנדומלי", "⏱️"); playCardMove(randomCard, isP1); }, 50);
          return prev;
        });
      }
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [game?.phase, cardsRevealed, activePlayerPhase, playCardMove, addToast]);

  // When pass screen appears, hide cards
  useEffect(() => {
    if (game?.phase === PHASE.PASS_SCREEN) {
      setCardsRevealed(false);
    }
  }, [game?.phase]);

  const handleReveal = () => {
    setCardsRevealed(true);
    playPassDevice(audio());
    // Transition from pass screen to actual turn
    setGame(g => {
      if (!g || g.phase !== PHASE.PASS_SCREEN) return g;
      return { ...g, phase: g._nextPhaseAfterPass || PHASE.PLAYER_TURN };
    });
  };

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setGame(initGame(selectedMode));
    setScreen("game");
    setCardsRevealed(true);
    setToasts([]);
    setGoldFlash(false); setFireActive(false); setCurrentStreak(0); setTimeLeft(30);
    setScreenShake(false); setBasraPopup({ show: false, isPlayer: true, streak: 1 });
    setSweepShow(false); setSweepCards([]);
    lastFXRef.current = null;
    setTimeout(() => { playCardRustle(audio()); setDealKey(k => k + 1); }, 200);
  };

  const restart = () => {
    clearTimeout(cpuTimer.current); clearInterval(countdownRef.current);
    setGame(initGame(mode));
    setCardsRevealed(true);
    setToasts([]); setGoldFlash(false); setFireActive(false); setCurrentStreak(0); setTimeLeft(30);
    setScreenShake(false); setBasraPopup({ show: false, isPlayer: true, streak: 1 });
    setSweepShow(false); setSweepCards([]);
    lastFXRef.current = null;
    setTimeout(() => { playCardRustle(audio()); setDealKey(k => k + 1); }, 200);
  };

  const goMenu = () => setConfirmQuit(true);

  const handleConfirmQuit = () => {
    clearTimeout(cpuTimer.current); clearInterval(countdownRef.current);
    setConfirmQuit(false);
    setScreen("menu"); setGame(null); setMode(null);
  };

  // From EndScreen — no confirmation needed, game is already over
  const goMenuDirect = () => {
    clearTimeout(cpuTimer.current); clearInterval(countdownRef.current);
    setScreen("menu"); setGame(null); setMode(null);
  };

  if (screen === "menu") return <ModeSelector onSelect={startGame} />;
  if (!game) return null;

  const isMP = mode === MODE.LOCAL_MP;
  const isP1Turn = game.phase === PHASE.PLAYER_TURN;
  const isP2Turn = game.phase === PHASE.P2_TURN;
  const isCpuTurn = game.phase === PHASE.CPU_TURN;
  const isPassScreen = game.phase === PHASE.PASS_SCREEN;
  const activeIsPlayer = isP1Turn; // "player" side is always P1
  const showCountdown = (isP1Turn || isP2Turn) && cardsRevealed;

  // Labels
  const p1Label = isMP ? "שחקן 1" : "אתה";
  const p2Label = isMP ? "שחקן 2" : "מחשב";

  // Which hand is "active" (bottom = current player)
  // In VS CPU: P1 always bottom, CPU always top
  // In Local MP: rotate — P1 turn → P1 bottom, P2 turn → P2 bottom
  const bottomHand = isMP
    ? (isP2Turn ? game.cpuHand : game.playerHand)
    : game.playerHand;
  const topHand = isMP
    ? (isP2Turn ? game.playerHand : game.cpuHand)
    : game.cpuHand;
  const bottomLabel = isMP ? (isP2Turn ? p2Label : p1Label) : p1Label;
  const topLabel = isMP ? (isP2Turn ? p1Label : p2Label) : p2Label;
  const bottomIsP1 = !isMP || !isP2Turn; // is the bottom hand P1's hand?

  const result = game.phase === PHASE.GAME_END
    ? game.playerScore > game.cpuScore ? "player" : game.cpuScore > game.playerScore ? "cpu" : "tie"
    : null;

  const timeCritical = timeLeft <= 5, timeUrgent = timeLeft <= 10;

  return (
    <div dir="rtl" lang="he"
      className="relative min-h-screen flex flex-col items-stretch select-none overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2e1a 0%, #071a0e 60%, #040d07 100%)", fontFamily: "'Segoe UI',Tahoma,Geneva,sans-serif" }}
      onClick={() => { try { if (audioCtx.current?.state === "suspended") audioCtx.current.resume(); } catch {} }}>

      <EthiopianBackground />

      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
      <GoldFlash show={goldFlash} double={currentStreak >= 2} />
      <AnimatePresence>
        {fireActive && <FireOverlay key={fireKey} active streak={currentStreak} />}
      </AnimatePresence>
      <AnimatePresence mode="sync">
        {toasts.map(t => <Toast key={t.id} message={t.message} emoji={t.emoji} big={t.big} />)}
      </AnimatePresence>

      {/* Basra Impact Pop */}
      <BasraPopup show={basraPopup.show} isPlayer={basraPopup.isPlayer} streak={basraPopup.streak} is7D={basraPopup.is7D} p2Label={basraPopup.p2Label} />

      {/* Sweep animation for Jack/7♦ */}
      <SweepOverlay
        cards={sweepCards}
        show={sweepShow}
        isPlayer={sweepIsPlayer}
        onDone={() => { setSweepShow(false); setSweepCards([]); }}
      />
      <AnimatePresence>
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirmQuit && (
          <ConfirmQuitModal onConfirm={handleConfirmQuit} onCancel={() => setConfirmQuit(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmRestart && (
          <ConfirmRestartModal
            onConfirm={() => { setConfirmRestart(false); restart(); }}
            onCancel={() => setConfirmRestart(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {game.phase === PHASE.GAME_END && (
          <EndScreen result={result} playerScore={game.playerScore} cpuScore={game.cpuScore}
            playerBasras={game.playerBasras} cpuBasras={game.cpuBasras}
            playerCaptured={game.playerCaptured} cpuCaptured={game.cpuCaptured}
            mode={mode} onRestart={restart} onMenu={goMenuDirect} />
        )}
      </AnimatePresence>

      {/* Pass-device overlay */}
      <AnimatePresence>
        {isPassScreen && (
          <PassDeviceScreen
            toPlayer={game._nextPhaseAfterPass === PHASE.P2_TURN ? p2Label : p1Label}
            onReveal={handleReveal}
          />
        )}
      </AnimatePresence>

      <ScreenShake shake={screenShake}>
      {/* Menu backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between px-3 pt-3 pb-1.5">
        {/* Hamburger menu */}
        <div className="relative z-50">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all">
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 22 } }}
                exit={{ opacity: 0, scale: 0.9, y: -8, transition: { duration: 0.15 } }}
                className="absolute top-full mt-2 right-0 flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
                style={{ background: "#0f1f12", minWidth: 160, zIndex: 9999 }}>
                <button onClick={() => { setMenuOpen(false); goMenu(); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all text-right w-full">
                  <ChevronLeft size={15} className="text-white/40" />
                  חזרה לתפריט
                </button>
                <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                <button onClick={() => { setMenuOpen(false); setConfirmRestart(true); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all text-right w-full">
                  <RefreshCw size={15} className="text-white/40" />
                  משחק חדש
                </button>
                <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                <button onClick={() => { setMenuOpen(false); setShowInfo(true); }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all text-right w-full">
                  <Info size={15} className="text-white/40" />
                  חוקי המשחק
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Title — absolutely centered regardless of side elements */}
        <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none">
          <h1 className="text-lg sm:text-xl font-bold tracking-widest" style={{ color: "#d4af37", textShadow: "0 0 20px rgba(212,175,55,0.45)" }}>בסרה</h1>
          {isMP && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400/80 border border-blue-500/20">2P</span>}
        </div>
        <div className="relative z-10 w-16 sm:w-20 flex justify-end">
          <StreakMeter streak={game.playerStreak} small />
        </div>
      </div>

      {/* ── Scores ── */}
      {(() => {
        // Live score = basra points already scored + bonus cards already captured
        const livePScore = game.playerScore
          + (game.playerCaptured.some(is2Spades) ? 2 : 0)
          + (game.playerCaptured.some(is10Diamonds) ? 3 : 0)
          + game.playerCaptured.filter(isAce).length
          + game.playerCaptured.filter(isJack).length;
        const liveCScore = game.cpuScore
          + (game.cpuCaptured.some(is2Spades) ? 2 : 0)
          + (game.cpuCaptured.some(is10Diamonds) ? 3 : 0)
          + game.cpuCaptured.filter(isAce).length
          + game.cpuCaptured.filter(isJack).length;
        return (
          <div className="flex gap-2 px-3 pb-2">
            <ScoreBadge label={p1Label} score={livePScore} cards={game.playerCaptured.length}
              isActive={isP1Turn} basras={game.playerBasras}
              captured={game.playerCaptured} opponentCards={game.cpuCaptured.length} />
            <ScoreBadge label={p2Label} score={liveCScore} cards={game.cpuCaptured.length}
              isActive={isP2Turn || isCpuTurn} basras={game.cpuBasras}
              captured={game.cpuCaptured} opponentCards={game.playerCaptured.length} />
          </div>
        );
      })()}

      {/* CPU / P2 streak */}
      <AnimatePresence>
        {game.cpuStreak >= 2 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex justify-center mb-1">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/30 border border-red-500/20">
              <span className="text-xs text-red-400">{p2Label} ברצף</span>
              <StreakMeter streak={game.cpuStreak} small />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Hand (CPU / inactive player) ── */}
      <div className="px-3 mb-1.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-xs text-white/40">{topLabel}</div>
          {isCpuTurn && (
            <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9 }}
              className="text-xs text-blue-400">חושב...</motion.span>
          )}
          {isMP && !isPassScreen && (
            <div className="flex items-center gap-1 text-xs text-white/30">
              <EyeOff size={10} /><span>מוסתר</span>
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <AnimatePresence>
            {topHand.map((c, i) => (
              <motion.div key={`${c.id}-${dealKey}`}
                initial={{ opacity: 0, x: 60, y: -50, scale: 0.5, rotate: -12 + i * 4 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0,
                  transition: { delay: i * 0.09, type: "spring", stiffness: 300, damping: 22 } }}
                exit={{ opacity: 0, x: 50, scale: 0.4, transition: { duration: 0.28 } }}>
                <CardBack small />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-1 min-h-0">
        <motion.div
          className="w-full rounded-2xl border relative flex items-center justify-center"
          style={{ minHeight: "clamp(80px, 20vw, 120px)", padding: "clamp(8px, 2vw, 16px)",
            background: "radial-gradient(ellipse at center,rgba(255,255,255,0.035) 0%,transparent 70%)" }}
          animate={goldFlash ? { borderColor: ["rgba(255,210,0,0.9)", "rgba(255,255,255,0.08)"] } : { borderColor: "rgba(255,255,255,0.08)" }}
          transition={{ duration: 1.0 }}>

          {game.tableCards.length === 0 && <div className="text-white/15 text-sm italic">שולחן ריק</div>}

          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center items-center" style={{ paddingLeft: "clamp(44px, 12vw, 56px)" }}>
            <AnimatePresence>
              {game.tableCards.map((card, i) => (
                <motion.div key={card.id}
                  initial={{ opacity: 0, scale: 0.45, y: 28 }}
                  animate={{ opacity: 1, scale: 1, y: 0, rotate: (i % 2 === 0 ? -2.5 : 2.5), transition: { delay: i * 0.06, type: "spring", stiffness: 210 } }}
                  exit={{ opacity: 0, scale: 0.25, y: -38, transition: { duration: 0.32 } }}>
                  <CardFace card={card} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {game.deck.length > 0 && (
            <div className="absolute left-1 bottom-1 text-white/20 text-xs flex flex-col items-center gap-0.5 pointer-events-none"
              style={{ zIndex: 0 }}>
              <CardBack small /><span style={{ fontSize: "10px" }}>×{game.deck.length}</span>
            </div>
          )}
        </motion.div>

        {/* Turn pill + countdown */}
        <div className="mt-2 flex items-center gap-2">
          <motion.div key={`${game.phase}-pill`} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-300"
            style={{
              background: (isP1Turn || isP2Turn) ? "rgba(212,175,55,0.15)" : "rgba(59,130,246,0.15)",
              borderColor: (isP1Turn || isP2Turn)
                ? (timeCritical && showCountdown ? "rgba(239,68,68,0.7)" : timeUrgent && showCountdown ? "rgba(249,115,22,0.6)" : "rgba(212,175,55,0.45)")
                : "rgba(59,130,246,0.45)",
              color: (isP1Turn || isP2Turn)
                ? (timeCritical && showCountdown ? "#ef4444" : timeUrgent && showCountdown ? "#f97316" : "#d4af37")
                : "#93c5fd",
            }}>
            {isP1Turn
              ? (timeCritical && showCountdown ? "⚠️ שחק עכשיו!" : timeUrgent && showCountdown ? "מהר!" : `תור ${p1Label}`)
              : isP2Turn
              ? (timeCritical && showCountdown ? "⚠️ שחק עכשיו!" : timeUrgent && showCountdown ? "מהר!" : `תור ${p2Label}`)
              : `${p2Label} חושב...`}
          </motion.div>
          {showCountdown && <CountdownRing timeLeft={timeLeft} total={30} />}
        </div>
      </div>

      {/* ── Bottom Hand (active player) ── */}
      <div className="px-3 pt-1 pb-3">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="text-xs text-white/40">הקלפים שלך</div>
          {isMP && cardsRevealed && (
            <div className="flex items-center gap-1 text-xs text-green-400/60">
              <Eye size={10} /><span>גלוי</span>
            </div>
          )}
        </div>

        {/* Hidden state for Local MP when cards not revealed */}
        <AnimatePresence mode="wait">
          {isMP && !cardsRevealed ? (
            <motion.div key="hidden"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-1.5 justify-center">
              {bottomHand.map((c, i) => (
                <motion.div key={c.id} initial={{ rotateY: 180 }} animate={{ rotateY: 0 }}
                  transition={{ delay: i * 0.05, type: "spring" }}>
                  <CardBack />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="revealed"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
              <AnimatePresence>
                {bottomHand.map((card, i) => {
                  const cap = canCapture(card, game.tableCards);
                  const isMyTurn = bottomIsP1 ? isP1Turn : isP2Turn;
                  return (
                    <motion.div key={`${card.id}-${dealKey}`}
                      initial={{ opacity: 0, x: -80, y: 60, scale: 0.5, rotate: 10 - i * 4 }}
                      animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0,
                        transition: { delay: i * 0.10, type: "spring", stiffness: 280, damping: 20 } }}
                      exit={{ opacity: 0, x: -55, scale: 0.45, transition: { duration: 0.28 } }}
                      whileHover={isMyTurn ? {
                        y: -20, scale: 1.10,
                        rotate: (i - bottomHand.length / 2) * 1.5,
                        transition: { duration: 0.15, type: "spring", stiffness: 400, damping: 18 }
                      } : {}}
                      whileTap={isMyTurn ? { scale: 0.95, y: -10 } : {}}>
                      <CardFace
                        card={card}
                        onClick={isMyTurn ? () => {
                          if (bottomIsP1 && isP1Turn) {
                            setGame(g => g ? { ...g, selectedCard: card } : g);
                            setTimeout(() => playCardMove(card, true), 110);
                          } else if (!bottomIsP1 && isP2Turn) {
                            setGame(g => g ? { ...g, selectedCard: card } : g);
                            setTimeout(() => playCardMove(card, false), 110);
                          }
                        } : undefined}
                        selected={game.selectedCard?.id === card.id}
                        highlight={cap && isMyTurn}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
      </ScreenShake>
      </div>
    </div>
  );
}
