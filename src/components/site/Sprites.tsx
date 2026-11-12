/** Shared SVG symbols (the H&H mug used inside kit illustrations). */
export function Sprites() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <symbol id="mug" viewBox="0 0 60 56">
        <rect x="4" y="8" width="40" height="44" rx="9" fill="#678BC7" />
        <path d="M44 18c14 0 14 24 0 24" fill="none" stroke="#F1E4D3" strokeWidth="3" strokeLinecap="round" />
        <path d="M13 20h22" stroke="#F1E4D3" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      </symbol>
    </svg>
  );
}
