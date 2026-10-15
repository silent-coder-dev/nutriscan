'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type TargetAndTransition,
} from 'framer-motion';

export type BotMood = 'idle' | 'scanning' | 'great' | 'okay' | 'yikes' | 'confused';
type Gesture = 'wave' | 'wink' | 'spin' | 'sneeze' | 'dance' | 'giggle' | 'jump';
type Pose = BotMood | Gesture | 'drag' | 'sleep';

interface NutriBotProps {
  mood?: BotMood;
  // Nutri-Score letter shown on the belly after a scan
  grade?: string | null;
  size?: number;
  showSpeech?: boolean;
}

// Palette (kept local so the mascot looks the same on every surface)
const INK = '#1f2d24';
const BODY = '#fff8e7';
const LEAF = '#2e6b46';
const SPROUT = '#8fbf4a';
const BLUSH = '#e0866a';
const BELLY = '#e3ead8';
const GRADE_COLORS: Record<string, string> = { A: '#1e9e45', B: '#85bb2f', C: '#e6b400', D: '#ee8100', E: '#e63e11' };

const IDLE_LINES = [
  'Feed me a barcode!',
  'I only eat barcodes. Crunchy.',
  'Poke me. I dare you.',
  'Psst… always check the sugar.',
  'You can drag me around, too.',
];
const SCAN_LINES = [
  'Reading the small print…',
  'Sniffing out palm oil…',
  'Counting sugar cubes…',
  'Checking for allergens…',
  'Doing the Nutri-Score maths…',
];
const MOOD_LINES: Record<'great' | 'okay' | 'yikes' | 'confused', string> = {
  great: 'Ooh, a good one! Happy dance!',
  okay: 'Not bad. Fine in moderation.',
  yikes: "Yikes… that's a treat, not a meal.",
  confused: "Hmm, I couldn't find that one.",
};
const GESTURES: Record<Gesture, { line: string; ms: number }> = {
  wave: { line: 'Hello, hello!', ms: 1700 },
  wink: { line: '*blep*', ms: 1500 },
  spin: { line: 'Wheee!', ms: 1100 },
  sneeze: { line: 'Ah… ah… ACHOO! Pollen.', ms: 1700 },
  dance: { line: 'Veggie dance!', ms: 2100 },
  giggle: { line: 'Hehe, that tickles!', ms: 1500 },
  jump: { line: 'Boing!', ms: 1000 },
};
const POKE_ORDER: Gesture[] = ['wave', 'giggle', 'spin', 'wink', 'sneeze', 'dance', 'jump'];
const SLEEP_AFTER_MS = 30_000;

const loop = (duration: number, extra: Record<string, unknown> = {}) => ({
  duration,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  ...extra,
});

// Whole-body motion per pose (origin: feet)
function bodyMotion(pose: Pose): TargetAndTransition {
  switch (pose) {
    case 'scanning':
      return { y: [0, -4, 0], rotate: [-2, 2, -2], scaleX: 1, scaleY: 1, transition: loop(0.8) };
    case 'great':
      return { y: [0, -24, 0, -12, 0], rotate: [0, -6, 6, -3, 0], scaleX: 1, scaleY: 1, transition: loop(1.2, { repeatDelay: 2.2 }) };
    case 'okay':
      return { y: [0, -3, 0], rotate: [0, 4, -2, 0], scaleX: 1, scaleY: 1, transition: loop(1.4, { repeatDelay: 3 }) };
    case 'yikes':
      return { x: [0, -3, 3, -3, 3, 0], y: [0, 2, 0], rotate: -4, scaleX: 1, scaleY: 1, transition: loop(0.6, { repeatDelay: 2.4 }) };
    case 'confused':
      return { y: [0, -3, 0], rotate: -9, scaleX: 1, scaleY: 1, transition: loop(2.2) };
    case 'sleep':
      return { y: [0, 2, 0], rotate: -4, scaleX: [1, 1.02, 1], scaleY: [1, 0.98, 1], transition: loop(3.6) };
    case 'drag':
      return { rotate: [-7, 7, -7], scaleX: 1.04, scaleY: 1.04, transition: loop(0.35) };
    case 'wave':
      return { rotate: [0, -4, 0, -4, 0], y: 0, transition: { duration: 1.6 } };
    case 'wink':
      return { rotate: [0, -7, -7, 0], y: [0, -4, -4, 0], transition: { duration: 1.4 } };
    case 'spin':
      return { y: [0, -18, 0], scaleY: [1, 1.05, 1], transition: { duration: 1 } };
    case 'sneeze':
      return {
        scaleY: [1, 1.08, 1.1, 0.84, 1.03, 1],
        scaleX: [1, 0.96, 0.95, 1.14, 0.99, 1],
        y: [0, -3, -5, 5, 0, 0],
        transition: { duration: 1.5, times: [0, 0.3, 0.55, 0.65, 0.85, 1] },
      };
    case 'dance':
      return { x: [0, -10, 10, -10, 10, 0], rotate: [0, -9, 9, -9, 9, 0], y: [0, -6, 0, -6, 0, 0], transition: { duration: 2 } };
    case 'giggle':
      return { x: [0, -2, 2, -2, 2, -2, 2, 0], rotate: [0, -2, 2, -2, 2, -2, 2, 0], transition: { duration: 1.3 } };
    case 'jump':
      return { y: [0, 4, -36, 0, 0], scaleY: [1, 0.86, 1.1, 0.92, 1], scaleX: [1, 1.1, 0.94, 1.06, 1], transition: { duration: 0.95 } };
    default:
      return { x: 0, y: [0, -5, 0], rotate: 0, scaleX: [1, 1, 1], scaleY: [1, 1.015, 1], transition: loop(3) };
  }
}

// Arm rotation in degrees around the shoulder; positive swings the left arm up and out
function armMotion(pose: Pose, side: 'left' | 'right'): TargetAndTransition {
  const s = side === 'left' ? 1 : -1;
  const deg = (values: number[]) => values.map((v) => v * s);
  switch (pose) {
    case 'scanning':
      return side === 'right' ? { rotate: [-118, -108, -118], transition: loop(0.8) } : { rotate: 10, transition: { duration: 0.4 } };
    case 'great':
      return { rotate: deg([0, 145, 30, 120, 0]), transition: loop(1.2, { repeatDelay: 2.2 }) };
    case 'yikes':
      return { rotate: deg([38, 44, 38]), transition: loop(0.3) };
    case 'confused':
      return side === 'right' ? { rotate: [-150, -140, -150], transition: loop(0.7) } : { rotate: 6, transition: { duration: 0.4 } };
    case 'drag':
      return { rotate: deg([150, 135, 150]), transition: loop(0.35) };
    case 'wave':
      return side === 'right'
        ? { rotate: [0, -150, -115, -150, -115, -150, 0], transition: { duration: 1.6 } }
        : { rotate: 10, transition: { duration: 0.3 } };
    case 'dance':
      return { rotate: deg([0, 140, 100, 140, 100, 0]), transition: { duration: 2 } };
    case 'giggle':
      return { rotate: deg([0, 120, 120, 0]), transition: { duration: 1.3 } };
    case 'sneeze':
      return { rotate: deg([0, 20, 40, 70, 10, 0]), transition: { duration: 1.5 } };
    case 'jump':
      return { rotate: deg([0, 10, 150, 20, 0]), transition: { duration: 0.95 } };
    case 'sleep':
      return { rotate: deg([3, 5, 3]), transition: loop(3.6) };
    default:
      return { rotate: deg([7, 3, 7]), transition: loop(3) };
  }
}

function sproutMotion(pose: Pose): TargetAndTransition {
  switch (pose) {
    case 'great':
    case 'dance':
      return { rotate: [-18, 18, -18], transition: loop(0.4) };
    case 'scanning':
      return { rotate: [-10, 10, -10], transition: loop(0.5) };
    case 'yikes':
      return { rotate: [26, 30, 26], transition: loop(0.3) };
    case 'sleep':
      return { rotate: 16, transition: { duration: 1 } };
    case 'sneeze':
      return { rotate: [0, -10, -14, 28, -8, 0], transition: { duration: 1.5 } };
    case 'spin':
    case 'jump':
      return { rotate: [0, 20, -20, 0], transition: { duration: 0.9 } };
    default:
      return { rotate: [-6, 6, -6], transition: loop(2.6) };
  }
}

type Eyes = 'open' | 'happy' | 'closed' | 'wide' | 'squint' | 'wink' | 'focus';
type Mouth = 'smile' | 'grin' | 'o' | 'wavy' | 'flat' | 'blep' | 'tiny' | 'tilt';

function faceFor(pose: Pose, hovered: boolean): { eyes: Eyes; mouth: Mouth; blush: number } {
  switch (pose) {
    case 'scanning': return { eyes: 'focus', mouth: 'tiny', blush: 0.25 };
    case 'great': return { eyes: 'happy', mouth: 'grin', blush: 0.7 };
    case 'okay': return { eyes: 'open', mouth: 'flat', blush: 0.3 };
    case 'yikes': return { eyes: 'wide', mouth: 'wavy', blush: 0.15 };
    case 'confused': return { eyes: 'open', mouth: 'tilt', blush: 0.25 };
    case 'sleep': return { eyes: 'closed', mouth: 'o', blush: 0.35 };
    case 'drag': return { eyes: 'squint', mouth: 'o', blush: 0.6 };
    case 'wink': return { eyes: 'wink', mouth: 'blep', blush: 0.6 };
    case 'spin': return { eyes: 'squint', mouth: 'grin', blush: 0.5 };
    case 'sneeze': return { eyes: 'squint', mouth: 'o', blush: 0.6 };
    case 'dance': return { eyes: 'happy', mouth: 'grin', blush: 0.6 };
    case 'giggle': return { eyes: 'happy', mouth: 'grin', blush: 0.8 };
    case 'jump': return { eyes: 'happy', mouth: 'o', blush: 0.5 };
    case 'wave': return { eyes: 'open', mouth: 'grin', blush: 0.55 };
    default: return { eyes: 'open', mouth: hovered ? 'grin' : 'smile', blush: hovered ? 0.6 : 0.35 };
  }
}

function Eye({ cx, kind, blink, side }: { cx: number; kind: Eyes; blink: boolean; side: 'left' | 'right' }) {
  const cy = 122;
  const stroke = { stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round' as const, fill: 'none' };

  if (kind === 'happy' || (kind === 'wink' && side === 'right')) {
    return <path d={`M${cx - 9} ${cy + 3} Q${cx} ${cy - 9} ${cx + 9} ${cy + 3}`} {...stroke} />;
  }
  if (kind === 'closed') {
    return <path d={`M${cx - 9} ${cy} Q${cx} ${cy + 6} ${cx + 9} ${cy}`} {...stroke} />;
  }
  if (kind === 'squint') {
    const dir = side === 'left' ? 1 : -1;
    return <path d={`M${cx - 7 * dir} ${cy - 7} L${cx + 6 * dir} ${cy} L${cx - 7 * dir} ${cy + 7}`} {...stroke} strokeLinejoin="round" />;
  }
  if (kind === 'wide') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={12.5} fill="#fff" stroke={INK} strokeWidth={3.5} />
        <circle cx={cx} cy={cy + 1} r={5} fill={INK} />
      </g>
    );
  }

  const squash = kind === 'focus' ? 0.72 : 1;
  return (
    <motion.g
      animate={{ scaleY: blink ? 0.1 : squash }}
      transition={{ duration: 0.08 }}
      style={{ originX: 0.5, originY: 0.5 }}
    >
      <ellipse cx={cx} cy={cy} rx={9.5} ry={11.5} fill={INK} />
      <circle cx={cx + 3.2} cy={cy - 4.2} r={3.4} fill="#fff" />
      <circle cx={cx - 2.6} cy={cy + 4} r={1.6} fill="#fff" opacity={0.85} />
    </motion.g>
  );
}

function MouthShape({ kind }: { kind: Mouth }) {
  const line = { stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round' as const, fill: 'none' };
  switch (kind) {
    case 'grin':
      return (
        <g>
          <path d="M96 141 Q110 160 124 141 Z" fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <ellipse cx={110} cy={151} rx={6} ry={3.5} fill={BLUSH} />
        </g>
      );
    case 'o':
      return <ellipse cx={110} cy={148} rx={5.5} ry={6.5} fill={INK} />;
    case 'wavy':
      return <path d="M95 148 q4 -5 7.5 0 t7.5 0 t7.5 0 t7.5 0" {...line} strokeWidth={4} />;
    case 'flat':
      return <path d="M101 146 L119 146" {...line} />;
    case 'blep':
      return (
        <g>
          <path d="M99 142 Q110 151 121 142" {...line} />
          <path d="M106 147 Q106 157 111 157 Q116 157 116 147" fill={BLUSH} stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'tiny':
      return <path d="M104 147 Q110 144 116 147" {...line} strokeWidth={4} />;
    case 'tilt':
      return <path d="M100 149 Q110 142 120 146" {...line} />;
    default:
      return <path d="M99 142 Q110 152 121 142" {...line} />;
  }
}

export default function NutriBot({ mood = 'idle', grade = null, size = 240, showSpeech = true }: NutriBotProps) {
  const reduceMotion = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastInteraction = useRef(0);
  const pokeIndex = useRef(0);

  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const [sleepy, setSleepy] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);

  // Eyes (and a little lean) follow the pointer
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  const eyeX = useSpring(lookX, { stiffness: 160, damping: 18 });
  const eyeY = useSpring(lookY, { stiffness: 160, damping: 18 });

  const wake = () => {
    lastInteraction.current = Date.now();
    setSleepy(false);
  };

  useEffect(() => {
    lastInteraction.current = Date.now();
    const onMove = (event: PointerEvent) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      const dy = (event.clientY - (rect.top + rect.height * 0.45)) / (window.innerHeight / 2);
      lookX.set(Math.max(-1, Math.min(1, dx)) * 5);
      lookY.set(Math.max(-1, Math.min(1, dy)) * 4);
      lastInteraction.current = Date.now();
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [lookX, lookY]);

  // Natural blinking at random intervals
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          schedule();
        }, 130);
      }, 2200 + Math.random() * 3200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Rotate speech lines; nod off after a while with nothing happening
  useEffect(() => {
    const scanning = mood === 'scanning';
    const timer = setInterval(() => {
      setLineIndex((i) => i + 1);
      if (!scanning && mood === 'idle' && Date.now() - lastInteraction.current > SLEEP_AFTER_MS) {
        setSleepy(true);
      }
    }, scanning ? 1400 : 4200);
    return () => clearInterval(timer);
  }, [mood]);

  // A finished gesture returns to the current mood
  useEffect(() => {
    if (!gesture) return;
    const timer = setTimeout(() => setGesture(null), GESTURES[gesture].ms);
    return () => clearTimeout(timer);
  }, [gesture]);

  const poke = () => {
    wake();
    if (mood === 'scanning') return; // busy
    const next = POKE_ORDER[pokeIndex.current % POKE_ORDER.length];
    pokeIndex.current += 1;
    setGesture(next);
  };

  const pose: Pose = gesture ?? (dragging ? 'drag' : mood !== 'idle' ? mood : sleepy ? 'sleep' : 'idle');
  const face = faceFor(pose, hovered);
  const still = (target: TargetAndTransition): TargetAndTransition =>
    reduceMotion ? { ...target, transition: { duration: 0 } } : target;

  const speech = gesture
    ? GESTURES[gesture].line
    : dragging
    ? 'Wheee! Put me down gently!'
    : mood === 'scanning'
    ? SCAN_LINES[lineIndex % SCAN_LINES.length]
    : mood !== 'idle'
    ? MOOD_LINES[mood]
    : sleepy
    ? 'Zzz… (poke me to wake me up)'
    : IDLE_LINES[lineIndex % IDLE_LINES.length];

  const gradeLetter = grade && GRADE_COLORS[grade] ? grade : null;

  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      {showSpeech && (
        <div className="relative mb-2 min-h-[46px] flex items-end" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={speech}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="relative px-3.5 py-2 rounded-2xl bg-surface border-2 border-fg text-[13px] font-semibold text-fg text-center leading-snug max-w-[240px]"
            >
              {speech}
              <span className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3 h-3 bg-surface border-b-2 border-r-2 border-fg rotate-45" />
            </motion.p>
          </AnimatePresence>
        </div>
      )}

      <motion.div
        ref={wrapRef}
        role="button"
        tabIndex={0}
        aria-label="NutriBot, the NutriScan mascot. Press to make it do a trick."
        className="relative w-full cursor-grab active:cursor-grabbing touch-none outline-none focus-visible:ring-4 focus-visible:ring-leaf/30 rounded-[32px]"
        drag={!reduceMotion}
        dragSnapToOrigin
        dragElastic={0.5}
        dragTransition={{ bounceStiffness: 380, bounceDamping: 16 }}
        onDragStart={() => {
          wake();
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        onTap={poke}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            poke();
          }
        }}
        onHoverStart={() => {
          wake();
          setHovered(true);
        }}
        onHoverEnd={() => setHovered(false)}
      >
        <svg viewBox="0 0 220 240" className="w-full h-auto overflow-visible" aria-hidden="true">
          {/* Ground shadow */}
          <motion.ellipse
            cx={110}
            cy={228}
            rx={50}
            ry={7}
            fill={INK}
            opacity={0.12}
            animate={still(pose === 'jump' || pose === 'great' ? { scaleX: [1, 0.7, 1], transition: { duration: 1 } } : { scaleX: [1, 0.94, 1], transition: loop(3) })}
            style={{ originX: 0.5, originY: 0.5 }}
          />

          {/* Spin wrapper (origin: centre) */}
          <motion.g
            animate={still(pose === 'spin' ? { rotate: [0, 360], transition: { duration: 0.95, ease: 'easeInOut' } } : { rotate: 0, transition: { duration: 0 } })}
            style={{ originX: 0.5, originY: 0.55 }}
          >
            {/* Body motion (origin: feet) */}
            <motion.g animate={still(bodyMotion(pose))} style={{ originX: 0.5, originY: 1 }}>
              {/* Feet */}
              <ellipse cx={86} cy={214} rx={15} ry={9} fill={LEAF} stroke={INK} strokeWidth={4} />
              <ellipse cx={134} cy={214} rx={15} ry={9} fill={LEAF} stroke={INK} strokeWidth={4} />

              {/* Body */}
              <path
                d="M110 62 C158 62 178 92 178 140 C178 186 152 212 110 212 C68 212 42 186 42 140 C42 92 62 62 110 62 Z"
                fill={BODY}
                stroke={INK}
                strokeWidth={4.5}
              />
              {/* Soft shading on one side, like a pebble */}
              <path d="M150 78 C168 94 172 120 172 140 C172 170 158 192 136 202" stroke={INK} strokeOpacity={0.08} strokeWidth={10} fill="none" strokeLinecap="round" />

              {/* Left arm (origin: shoulder), drawn over the body edge so it reads as an arm */}
              <motion.g animate={still(armMotion(pose, 'left'))} style={{ originX: 0.5, originY: 0 }}>
                <rect x={32} y={128} width={20} height={40} rx={10} fill={BODY} stroke={INK} strokeWidth={4} />
              </motion.g>

              {/* Right arm, holds the magnifier while scanning */}
              <motion.g animate={still(armMotion(pose, 'right'))} style={{ originX: 0.5, originY: 0 }}>
                <rect x={168} y={128} width={20} height={40} rx={10} fill={BODY} stroke={INK} strokeWidth={4} />
                {pose === 'scanning' && (
                  <g>
                    <line x1={178} y1={166} x2={178} y2={178} stroke={INK} strokeWidth={6} strokeLinecap="round" />
                    <circle cx={178} cy={192} r={14} fill="#dff3ff" fillOpacity={0.75} stroke={INK} strokeWidth={4} />
                    <path d="M171 186 Q174 182 179 182" stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" />
                  </g>
                )}
              </motion.g>

              {/* Belly badge */}
              <rect x={86} y={166} width={48} height={32} rx={13} fill={BELLY} stroke={INK} strokeWidth={3.5} />
              {pose === 'scanning' ? (
                [0, 1, 2].map((i) => (
                  <motion.circle
                    key={i}
                    cx={100 + i * 10}
                    cy={182}
                    r={3.2}
                    fill={LEAF}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={loop(0.9, { delay: i * 0.15 })}
                  />
                ))
              ) : gradeLetter ? (
                <g>
                  <circle cx={110} cy={182} r={11} fill={GRADE_COLORS[gradeLetter]} stroke={INK} strokeWidth={2.5} />
                  <text x={110} y={186.5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fff" fontFamily="system-ui, sans-serif">
                    {gradeLetter}
                  </text>
                </g>
              ) : (
                <path d="M102 188 C102 176 112 172 120 174 C120 184 112 190 102 188 Z M102 188 L112 179" fill={SPROUT} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
              )}

              {/* Cheeks */}
              <motion.ellipse cx={74} cy={140} rx={10} ry={5.5} fill={BLUSH} animate={{ opacity: face.blush }} />
              <motion.ellipse cx={146} cy={140} rx={10} ry={5.5} fill={BLUSH} animate={{ opacity: face.blush }} />

              {/* Eyes follow the pointer */}
              <motion.g style={{ x: eyeX, y: eyeY }}>
                <Eye cx={88} kind={face.eyes} blink={blink} side="left" />
                <Eye cx={132} kind={face.eyes} blink={blink} side="right" />
              </motion.g>

              {/* Eyebrows for the thinking faces */}
              {(pose === 'confused' || pose === 'scanning') && (
                <path d="M124 102 L140 98" stroke={INK} strokeWidth={4} strokeLinecap="round" />
              )}
              {pose === 'yikes' && (
                <g stroke={INK} strokeWidth={4} strokeLinecap="round">
                  <path d="M78 105 L95 99" />
                  <path d="M142 105 L125 99" />
                </g>
              )}

              <MouthShape kind={face.mouth} />

              {/* Sprout (origin: stem base) */}
              <motion.g animate={still(sproutMotion(pose))} style={{ originX: 0.5, originY: 1 }}>
                <path d="M110 64 C110 52 108 44 112 34" stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none" />
                <path d="M112 36 C100 22 82 24 76 32 C86 44 104 44 112 36 Z" fill={SPROUT} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
                <path d="M112 36 C122 18 142 16 150 24 C142 40 124 44 112 36 Z" fill={SPROUT} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
                <path d="M114 35 C124 30 134 27 142 26" stroke={INK} strokeOpacity={0.35} strokeWidth={2} fill="none" strokeLinecap="round" />
              </motion.g>
            </motion.g>
          </motion.g>

          {/* Floating extras */}
          <AnimatePresence>
            {pose === 'great' &&
              [0, 1, 2].map((i) => (
                <motion.path
                  key={`heart-${i}`}
                  d="M0 3 C0 -2 6 -3 7 1 C8 -3 14 -2 14 3 C14 8 7 12 7 12 C7 12 0 8 0 3 Z"
                  fill={BLUSH}
                  stroke={INK}
                  strokeWidth={2}
                  // Beside the head, never across the face
                  initial={{ opacity: 0, x: [14, 188, 168][i], y: 100 }}
                  animate={{ opacity: [0, 1, 0], y: [100, 56, 24] }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={loop(1.8, { delay: i * 0.45, repeatDelay: 0.6 })}
                />
              ))}
            {/* Text is positioned by a wrapping <g>; motion x/y on SVG are transforms */}
            {pose === 'confused' && (
              <g key="question" transform="translate(162 58)">
                <motion.text
                  fontSize={30}
                  fontWeight={800}
                  fill={LEAF}
                  stroke={INK}
                  strokeWidth={1.5}
                  fontFamily="system-ui, sans-serif"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: [1, 1.15, 1], rotate: [0, 8, 0] }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={loop(1.4)}
                  style={{ originX: 0.5, originY: 0.5 }}
                >
                  ?
                </motion.text>
              </g>
            )}
            {pose === 'sleep' &&
              ['z', 'Z'].map((letter, i) => (
                <g key={`z-${i}`} transform={`translate(${150 + i * 14} 70)`}>
                  <motion.text
                    fontSize={14 + i * 6}
                    fontWeight={800}
                    fill={INK}
                    fillOpacity={0.55}
                    fontFamily="system-ui, sans-serif"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0], y: [0, -16, -28] }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={loop(2.4, { delay: i * 0.8 })}
                  >
                    {letter}
                  </motion.text>
                </g>
              ))}
            {pose === 'yikes' && (
              <motion.path
                key="sweat"
                d="M160 92 C160 92 152 102 152 107 C152 111 156 114 160 114 C164 114 168 111 168 107 C168 102 160 92 160 92 Z"
                fill="#bfe3f5"
                stroke={INK}
                strokeWidth={2.5}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [-6, 0, 10, 18] }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={loop(1.6, { repeatDelay: 0.8 })}
              />
            )}
            {pose === 'sneeze' && (
              <motion.g
                key="achoo"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0, 1, 0], scale: [0.5, 0.5, 1.2, 1.4] }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 1.5, times: [0, 0.55, 0.7, 1] }}
                style={{ originX: 0.5, originY: 0.5 }}
              >
                {[0, 1, 2].map((i) => (
                  <circle key={i} cx={132 + i * 9} cy={150 + (i % 2) * 6} r={3 + i} fill="#bfe3f5" stroke={INK} strokeWidth={1.5} />
                ))}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>
    </div>
  );
}
