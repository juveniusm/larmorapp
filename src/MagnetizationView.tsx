import React from "react";

interface Props {
  // Current angle of the magnetization vector from +Z, in degrees (0 = upright).
  angleDeg: number;
  pulsing: boolean;
}

const W = 440;
const H = 360;
const OX = 200;          // origin x (patient torso)
const OY = 250;          // origin y
const L = 150;           // arrow length
const Z_TOP = 45;        // top of the +Mz axis (kept above the arrow tip)

export const MagnetizationView: React.FC<Props> = ({ angleDeg, pulsing }) => {
  const theta = (angleDeg * Math.PI) / 180;
  const tipX = OX + L * Math.sin(theta);
  const tipY = OY - L * Math.cos(theta);

  // Component projections
  const mzY = OY - L * Math.cos(theta); // longitudinal tip height
  const mxyX = OX + L * Math.sin(theta); // transverse tip offset

  // Flip-angle arc (from +Z toward the vector)
  const arcR = 46;
  const arcEndX = OX + arcR * Math.sin(theta);
  const arcEndY = OY - arcR * Math.cos(theta);
  const largeArc = angleDeg > 180 ? 1 : 0;

  return (
    <svg className="mag-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id="z-arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#5f7985" />
        </marker>
        <marker id="t-arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#9bb3ab" />
        </marker>
        <marker id="m-arrow" markerWidth="12" markerHeight="12" refX="7" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#2f7884" />
        </marker>
      </defs>

      {/* Transverse plane (X-Y) — horizontal axis */}
      <line x1={40} y1={OY} x2={W - 30} y2={OY} stroke="#9bb3ab" strokeWidth={1.5}
            strokeDasharray="5 5" markerEnd="url(#t-arrow)" />
      <text x={W - 34} y={OY - 10} className="axis-label-dim">+Mxy</text>
      <text x={48} y={OY - 10} className="axis-label-dim">transverse plane</text>

      {/* Longitudinal axis (Z) — vertical */}
      <line x1={OX} y1={OY} x2={OX} y2={Z_TOP} stroke="#5f7985" strokeWidth={1.5}
            markerEnd="url(#z-arrow)" />
      <text x={OX + 10} y={Z_TOP + 4} className="axis-label">+Mz</text>

      {/* Patient lying down on a table */}
      <g className="patient">
        <line x1={70} y1={OY + 64} x2={330} y2={OY + 64} stroke="#b8d0c4" strokeWidth={2} />
        {/* body */}
        <path
          d="M110,300 Q125,288 150,288 L255,288 Q272,288 278,300 L278,306 Q272,316 255,316 L150,316 Q125,316 110,306 Z"
          fill="#d9ece9" stroke="#b8d0c4" strokeWidth={1.5}
        />
        {/* head */}
        <circle cx={296} cy={302} r={13} fill="#d9ece9" stroke="#b8d0c4" strokeWidth={1.5} />
        <text x={170} y={336} className="patient-label">PATIENT</text>
      </g>

      {/* Flip-angle arc */}
      {angleDeg > 1 && (
        <path
          d={`M ${OX} ${OY - arcR} A ${arcR} ${arcR} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`}
          fill="none" stroke="#2f7884" strokeWidth={1.5} opacity={0.5}
        />
      )}

      {/* Component projections (dashed) */}
      {angleDeg > 1 && (
        <>
          <line x1={tipX} y1={tipY} x2={OX} y2={mzY} stroke="#2f7884" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.4} />
          <line x1={tipX} y1={tipY} x2={mxyX} y2={OY} stroke="#2f7884" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.4} />
        </>
      )}

      {/* Net magnetization vector M */}
      <line x1={OX} y1={OY} x2={tipX} y2={tipY}
            stroke="#2f7884" strokeWidth={4} markerEnd="url(#m-arrow)"
            className={pulsing ? "m-vector pulsing" : "m-vector"} />
      <circle cx={OX} cy={OY} r={4} fill="#1f4452" />
      <text x={tipX + 8} y={tipY + (angleDeg < 45 ? 4 : 14)} className="m-label">M</text>
    </svg>
  );
};
