import React from 'react';
import './CivicWorkflowIllustration.css';

/**
 * CivicWorkflowIllustration
 * ─────────────────────────
 * Polished SVG illustration for the CivicConnect hero section.
 * Shows: neighborhood map → citizen pin → civic hub → department cards → resolution.
 *
 * All content is illustrative — not live data.
 * Uses CSS keyframes for subtle animation; respects prefers-reduced-motion.
 *
 * Layout (viewBox 0 0 640 480):
 *   • Left panel  (x 20–240):  Neighbourhood map card
 *   • Centre      (x ~280):    Civic-hub circle
 *   • Right panel (x 400–570): Three department cards
 *   • Flow label  (y 28):      "REPORT → ROUTE → RESOLVE"
 */
export default function CivicWorkflowIllustration() {
  const C = {
    cream:      '#FAF4E8',
    creamDark:  '#F3E8D0',
    darkBrown:  '#482B1D',
    charcoal:   '#29221F',
    coral:      '#F2673A',
    coralDark:  '#D9532A',
    coralFaint: 'rgba(242,103,58,0.14)',
    muted:      '#6E655F',
    mutedLight: '#9D9488',
    line:       '#DDD7CC',
    card:       '#FFFDF9',
    green:      '#2E7D32',
    greenBg:    '#E6F2E4',
    greenFaint: 'rgba(46,125,50,0.13)',
    blue:       '#1976D2',
    blueFaint:  'rgba(25,118,210,0.12)',
    white:      '#FFFFFF',
  };

  // ── Connection paths (all shifted down 10 px vs. original to add top breathing room) ──
  const pathPinToHub    = 'M 135 210 C 175 210, 200 252, 244 258';
  const pathHubToRoads  = 'M 326 236 C 358 220, 380 162, 412 148';
  const pathHubToWater  = 'M 326 258 C 360 258, 382 263, 412 268';
  const pathHubToSanit  = 'M 326 278 C 358 300, 382 358, 412 373';

  return (
    <svg
      className="civic-illustration"
      viewBox="0 0 640 490"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of CivicConnect workflow: a citizen reports an issue on a neighbourhood map, which is routed through a central civic hub to city departments for resolution."
    >
      <title>Civic Workflow Illustration</title>

      {/* ─── DEFS ─── */}
      <defs>
        <filter id="cw-shadow" x="-12%" y="-12%" width="130%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor={C.charcoal} floodOpacity="0.10" />
        </filter>
        <filter id="cw-shadow-lg" x="-15%" y="-15%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={C.charcoal} floodOpacity="0.13" />
        </filter>
        <clipPath id="map-clip">
          <rect x="20" y="68" width="220" height="280" rx="18" />
        </clipPath>
        <path id="p-pin-hub"   d={pathPinToHub} />
        <path id="p-hub-roads" d={pathHubToRoads} />
        <path id="p-hub-water" d={pathHubToWater} />
        <path id="p-hub-sanit" d={pathHubToSanit} />
      </defs>

      {/* ═══════════════════════════════════════════════════
          FLOW LABEL — top strip (well clear of map card)
          ═══════════════════════════════════════════════════ */}
      <g opacity="0.60">
        {/* Pill background */}
        <rect x="170" y="14" width="300" height="22" rx="11" fill={C.creamDark} />
        <text
          x="320" y="29"
          textAnchor="middle"
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight="700" fontSize="11"
          fill={C.darkBrown} letterSpacing="1.1"
        >
          REPORT  →  ROUTE  →  RESOLVE
        </text>
      </g>

      {/* ═══════════════════════════════════════════════════
          1. NEIGHBOURHOOD MAP CARD  (y shifted +8 px)
          ═══════════════════════════════════════════════════ */}
      <g filter="url(#cw-shadow-lg)">
        {/* Card background */}
        <rect x="20" y="68" width="220" height="280" rx="18"
              fill={C.card} stroke={C.line} strokeWidth="1.5" />

        {/* Map fill (clipped) */}
        <g clipPath="url(#map-clip)">
          <rect x="20" y="68" width="220" height="280" fill={C.creamDark} />

          {/* Street grid */}
          <g stroke={C.white} strokeWidth="8" opacity="0.7">
            <line x1="20" y1="138" x2="240" y2="138" />
            <line x1="20" y1="208" x2="240" y2="208" />
            <line x1="20" y1="278" x2="240" y2="278" />
            <line x1="90"  y1="68" x2="90"  y2="348" />
            <line x1="170" y1="68" x2="170" y2="348" />
          </g>

          {/* City blocks */}
          <g opacity="0.25">
            <rect x="25"  y="73"  width="60" height="60" rx="4" fill={C.green} />
            <rect x="95"  y="73"  width="70" height="60" rx="4" fill={C.coral} />
            <rect x="175" y="73"  width="60" height="60" rx="4" fill={C.blue}  />
            <rect x="25"  y="143" width="60" height="60" rx="4" fill={C.blue}  />
            <rect x="95"  y="143" width="70" height="60" rx="4" fill={C.green} />
            <rect x="175" y="143" width="60" height="60" rx="4" fill={C.coral} />
            <rect x="25"  y="213" width="60" height="60" rx="4" fill={C.coral} />
            <rect x="95"  y="213" width="70" height="60" rx="4" fill={C.blue}  />
            <rect x="175" y="213" width="60" height="60" rx="4" fill={C.green} />
            <rect x="25"  y="283" width="60" height="60" rx="4" fill={C.green} />
            <rect x="95"  y="283" width="70" height="60" rx="4" fill={C.coral} />
            <rect x="175" y="283" width="60" height="60" rx="4" fill={C.blue}  />
          </g>

          {/* Building-dot texture */}
          <g fill={C.muted} opacity="0.2">
            <rect x="40"  y="88"  width="12" height="16" rx="2" />
            <rect x="55"  y="93"  width="8"  height="11" rx="2" />
            <rect x="110" y="86"  width="14" height="18" rx="2" />
            <rect x="130" y="90"  width="10" height="14" rx="2" />
            <rect x="190" y="88"  width="12" height="16" rx="2" />
            <rect x="210" y="93"  width="8"  height="11" rx="2" />
            <rect x="40"  y="158" width="10" height="14" rx="2" />
            <rect x="55"  y="156" width="14" height="18" rx="2" />
            <rect x="110" y="160" width="10" height="12" rx="2" />
            <rect x="135" y="156" width="12" height="16" rx="2" />
            <rect x="190" y="158" width="14" height="18" rx="2" />
            <rect x="40"  y="230" width="12" height="14" rx="2" />
            <rect x="110" y="226" width="14" height="18" rx="2" />
            <rect x="190" y="228" width="10" height="14" rx="2" />
          </g>
        </g>

        {/* Title bar */}
        <rect x="20" y="68" width="220" height="32" rx="18" fill={C.charcoal} />
        <rect x="20" y="86" width="220" height="14"       fill={C.charcoal} />
        <circle cx="38" cy="86" r="4" fill="#E05544" opacity="0.9" />
        <circle cx="52" cy="86" r="4" fill="#E8A735" opacity="0.9" />
        <circle cx="66" cy="86" r="4" fill="#4CAF50" opacity="0.9" />
        <text x="130" y="90"
          textAnchor="middle"
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight="700" fontSize="11" fill={C.white} letterSpacing="0.3">
          Neighborhood Map
        </text>
      </g>

      {/* ═══════════════════════════════════════════════════
          2. CITIZEN LOCATION PIN
          ═══════════════════════════════════════════════════ */}
      <g>
        {/* Pulse rings */}
        <circle cx="130" cy="195" r="12" fill="none"
                stroke={C.coral} strokeWidth="1.5" className="civic-pulse-ring" />
        <circle cx="130" cy="195" r="12" fill="none"
                stroke={C.coral} strokeWidth="1"   className="civic-pulse-ring--delayed" />

        {/* Pin body */}
        <g transform="translate(130,182)">
          <path d="M0-16 C8.8-16 16-8.8 16 0 C16 8.8 0 24 0 24 C0 24-16 8.8-16 0 C-16-8.8-8.8-16 0-16Z"
                fill={C.coral} />
          <circle cx="0" cy="-1" r="5.5" fill={C.white} />
        </g>

        {/* Pin label — shifted down to clear the pin tip */}
        <rect x="88" y="216" width="84" height="22" rx="7" fill={C.charcoal} />
        <text x="130" y="231"
          textAnchor="middle"
          fontFamily="'Source Sans 3', sans-serif"
          fontWeight="600" fontSize="10.5" fill={C.white}>
          📍 Citizen Report
        </text>
      </g>

      {/* ═══════════════════════════════════════════════════
          3. CONNECTION LINES (dashed curves)
          ═══════════════════════════════════════════════════ */}
      <g opacity="0.45">
        <use href="#p-pin-hub"   fill="none" stroke={C.coral} strokeWidth="2" strokeDasharray="7 5" />
        <use href="#p-hub-roads" fill="none" stroke={C.coral} strokeWidth="2" strokeDasharray="7 5" />
        <use href="#p-hub-water" fill="none" stroke={C.blue}  strokeWidth="2" strokeDasharray="7 5" />
        <use href="#p-hub-sanit" fill="none" stroke={C.green} strokeWidth="2" strokeDasharray="7 5" />
      </g>

      {/* Travelling dots */}
      <circle r="4"   fill={C.coral} className="civic-travel-dot civic-travel-dot--d1"
              style={{ offsetPath: `path('${pathPinToHub}')` }} />
      <circle r="3.5" fill={C.coral} className="civic-travel-dot civic-travel-dot--d2"
              style={{ offsetPath: `path('${pathHubToRoads}')` }} />
      <circle r="3.5" fill={C.blue}  className="civic-travel-dot civic-travel-dot--d3"
              style={{ offsetPath: `path('${pathHubToWater}')` }} />
      <circle r="3.5" fill={C.green} className="civic-travel-dot civic-travel-dot--d1"
              style={{ offsetPath: `path('${pathHubToSanit}')` }} />

      {/* ═══════════════════════════════════════════════════
          4. CENTRAL CIVIC HUB
          ═══════════════════════════════════════════════════ */}
      <g filter="url(#cw-shadow-lg)">
        {/* Outer glow ring */}
        <circle cx="285" cy="258" r="58" fill="none"
                stroke={C.coral} strokeWidth="2" opacity="0.12"
                className="civic-hub-glow" />

        {/* Hub disc */}
        <circle cx="285" cy="258" r="48" fill={C.charcoal} />
        <circle cx="285" cy="258" r="43" fill="none"
                stroke={C.coral} strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Hub routing-arrows icon */}
        <g transform="translate(285,248)"
           stroke={C.coral} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <line x1="-14" y1="-7" x2="14" y2="-7" />
          <polyline points="8,-13 14,-7 8,-1" />
          <line x1="14" y1="7" x2="-14" y2="7" />
          <polyline points="-8,1 -14,7 -8,13" />
        </g>

        {/* Hub text */}
        <text x="285" y="278"
          textAnchor="middle"
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight="700" fontSize="9.5" fill={C.white} letterSpacing="0.6">
          CIVIC HUB
        </text>
        <text x="285" y="291"
          textAnchor="middle"
          fontFamily="'Source Sans 3', sans-serif"
          fontSize="8" fill={C.mutedLight}>
          Route &amp; Verify
        </text>
      </g>

      {/* ═══════════════════════════════════════════════════
          5. DEPARTMENT CARDS  (right column, 110 px apart)
          ═══════════════════════════════════════════════════ */}

      {/* ── Roads ── */}
      <g filter="url(#cw-shadow)">
        <rect x="412" y="108" width="192" height="76" rx="12"
              fill={C.card} stroke={C.line} strokeWidth="1" />
        {/* Coloured top accent strip */}
        <rect x="412" y="108" width="192" height="5"  rx="12" fill={C.coral} />
        <rect x="412" y="113" width="192" height="5"  fill={C.coral} />

        <text x="430" y="135"
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight="700" fontSize="13.5" fill={C.charcoal}>
          🛣️ Roads Dept
        </text>
        <text x="430" y="153"
          fontFamily="'Source Sans 3', sans-serif"
          fontSize="11" fill={C.muted}>
          Pothole Reported
        </text>

        {/* Status badge */}
        <rect x="430" y="160" width="60" height="16" rx="8" fill={C.coralFaint} />
        <text x="460" y="172"
          textAnchor="middle"
          fontFamily="'Source Sans 3', sans-serif"
          fontWeight="700" fontSize="10" fill={C.coralDark}>
          Assigned
        </text>
      </g>

      {/* ── Water ── */}
      <g filter="url(#cw-shadow)">
        <rect x="412" y="226" width="192" height="76" rx="12"
              fill={C.card} stroke={C.line} strokeWidth="1" />
        <rect x="412" y="226" width="192" height="5"  rx="12" fill={C.blue} />
        <rect x="412" y="231" width="192" height="5"  fill={C.blue} />

        <text x="430" y="253"
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight="700" fontSize="13.5" fill={C.charcoal}>
          💧 Water Dept
        </text>
        <text x="430" y="271"
          fontFamily="'Source Sans 3', sans-serif"
          fontSize="11" fill={C.muted}>
          Leak on Elm Street
        </text>

        <rect x="430" y="278" width="70" height="16" rx="8" fill={C.blueFaint} />
        <text x="465" y="290"
          textAnchor="middle"
          fontFamily="'Source Sans 3', sans-serif"
          fontWeight="700" fontSize="10" fill={C.blue}>
          In Progress
        </text>
      </g>

      {/* ── Sanitation ── */}
      <g filter="url(#cw-shadow)">
        <rect x="412" y="344" width="192" height="76" rx="12"
              fill={C.card} stroke={C.line} strokeWidth="1" />
        <rect x="412" y="344" width="192" height="5"  rx="12" fill={C.green} />
        <rect x="412" y="349" width="192" height="5"  fill={C.green} />

        <text x="430" y="371"
          fontFamily="'Bricolage Grotesque', sans-serif"
          fontWeight="700" fontSize="13.5" fill={C.charcoal}>
          🗑️ Sanitation
        </text>
        <text x="430" y="389"
          fontFamily="'Source Sans 3', sans-serif"
          fontSize="11" fill={C.muted}>
          Bin Overflow
        </text>

        {/* Status badge + checkmark — constrained inside card (412–604, 344–420) */}
        <rect x="430" y="396" width="60" height="16" rx="8" fill={C.greenFaint} />
        <text x="460" y="408"
          textAnchor="middle"
          fontFamily="'Source Sans 3', sans-serif"
          fontWeight="700" fontSize="10" fill={C.green}>
          Resolved
        </text>

        {/* Checkmark circle — sits inside card right edge */}
        <g transform="translate(578, 400)">
          <circle cx="0" cy="0" r="11" fill={C.green} />
          <polyline points="-4.5,0 -1.5,4 5.5,-5"
                    fill="none" stroke={C.white}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* ═══════════════════════════════════════════════════
          DISCLAIMER
          ═══════════════════════════════════════════════════ */}
      <text x="630" y="484"
        textAnchor="end"
        fontFamily="'Source Sans 3', sans-serif"
        fontSize="8" fill={C.muted} opacity="0.45">
        Illustrative example
      </text>
    </svg>
  );
}
