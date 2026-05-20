import React, { useCallback, useEffect, useRef, useState } from "react";
import { MagnetizationView } from "./MagnetizationView";

const T1_SECONDS = 2.5;     // longitudinal recovery time constant
const PULSE_SECONDS = 0.35; // how fast the RF pulse tips the vector

type Phase = "idle" | "pulse" | "relax";

export const App: React.FC = () => {
  const [amplitude, setAmplitude] = useState(70); // 0..100
  const [duration, setDuration] = useState(70);   // 0..100
  const [angle, setAngle] = useState(0);           // live angle from +Z, degrees
  const [pulsing, setPulsing] = useState(false);

  // Flip angle the next pulse will add: theta = (A * D) * 90, capped at 90.
  const flipAngle = Math.min(90, (amplitude / 100) * (duration / 100) * 90);

  // Animation state held in refs so the rAF loop always sees fresh values.
  const phase = useRef<Phase>("idle");
  const angleRef = useRef(0);
  const targetRef = useRef(0);
  const pulseStart = useRef(0);
  const pulseFrom = useRef(0);
  const raf = useRef<number>();
  const last = useRef<number>();

  useEffect(() => {
    const tick = (t: number) => {
      const dt = last.current === undefined ? 0 : (t - last.current) / 1000;
      last.current = t;

      if (phase.current === "pulse") {
        const elapsed = (t - pulseStart.current) / 1000;
        const k = Math.min(1, elapsed / PULSE_SECONDS);
        angleRef.current = pulseFrom.current + (targetRef.current - pulseFrom.current) * k;
        if (k >= 1) {
          angleRef.current = targetRef.current;
          phase.current = "relax";
          setPulsing(false);
        }
        setAngle(angleRef.current);
      } else if (phase.current === "relax") {
        // Exponential decay toward upright (T1 recovery).
        angleRef.current *= Math.exp(-dt / T1_SECONDS);
        if (angleRef.current < 0.15) {
          angleRef.current = 0;
          phase.current = "idle";
        }
        setAngle(angleRef.current);
      }

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = undefined;
    };
  }, []);

  const givePulse = useCallback(() => {
    // Tip from wherever the vector currently is; cap at 90 deg.
    pulseFrom.current = angleRef.current;
    targetRef.current = Math.min(90, angleRef.current + flipAngle);
    pulseStart.current = performance.now();
    phase.current = "pulse";
    setPulsing(true);
  }, [flipAngle]);

  const longitudinal = Math.cos((angle * Math.PI) / 180); // Mz fraction (live)
  const transverse = Math.sin((angle * Math.PI) / 180);   // Mxy fraction (live)

  return (
    <div className="app">
      <header className="header">
        <div className="title-block">
          <h1>RF Pulse, Flip Angle &amp; T1 Recovery</h1>
          <p className="subtitle">
            The net magnetization (M) rests along +Mz. An RF pulse tips it toward the
            transverse plane by the flip angle θ = Amplitude × Duration. After the pulse,
            it slowly recovers back to +Mz — a bigger flip takes longer to stand back up.
          </p>
        </div>
        <div className="stats">
          <Stat label="Flip Angle" value={Math.round(flipAngle)} unit="°" />
          <Stat label="Current θ" value={Math.round(angle)} unit="°" highlight />
          <Stat label="Longitudinal Mz" value={`${Math.round(longitudinal * 100)}`} unit="%" />
          <Stat label="Transverse Mxy" value={`${Math.round(transverse * 100)}`} unit="%" />
        </div>
      </header>

      <main className="main">
        <div className="voxel-wrap mag-wrap">
          <MagnetizationView angleDeg={angle} pulsing={pulsing} />
        </div>
        <aside className="sidebar">
          <Bar label="Mz" fraction={longitudinal} caption="reserve" />
          <Bar label="Mxy" fraction={transverse} caption="signal" />
        </aside>
      </main>

      <footer className="controls controls-stacked">
        <div className="slider-row">
          <label htmlFor="amp">Pulse Amplitude (B₁ strength)</label>
          <input id="amp" type="range" min={0} max={100} step={1}
                 value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} />
          <span className="slider-val">{amplitude}%</span>
        </div>
        <div className="slider-row">
          <label htmlFor="dur">Pulse Duration</label>
          <input id="dur" type="range" min={0} max={100} step={1}
                 value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          <span className="slider-val">{duration}%</span>
        </div>
        <button className="pulse-btn" onClick={givePulse} disabled={pulsing}>
          {pulsing ? "Pulsing…" : "Give RF Pulse"}
        </button>
      </footer>
    </div>
  );
};

const Stat: React.FC<{
  label: string;
  value: React.ReactNode;
  unit?: string;
  highlight?: boolean;
}> = ({ label, value, unit, highlight }) => (
  <div className="stat">
    <div className="stat-label">{label}</div>
    <div className={`stat-value${highlight ? " stat-highlight" : ""}`}>
      {value}
      {unit && <span className="stat-unit">{unit}</span>}
    </div>
  </div>
);

const Bar: React.FC<{ label: string; fraction: number; caption: string }> = ({
  label,
  fraction,
  caption,
}) => {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="bar">
      <div className="bar-track">
        <div className="bar-fill" style={{ height: `${pct}%` }} />
      </div>
      <div className="bar-label">{label}</div>
      <div className="bar-caption">{caption}</div>
    </div>
  );
};
