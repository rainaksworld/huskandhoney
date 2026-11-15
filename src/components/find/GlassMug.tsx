import { LOGO_PATH } from "@/lib/logo-path";

type Method = "pour" | "french" | "aero" | "moka" | "espresso" | "none";
type Taste = "light" | "medium" | "dark";
type Milk = "black" | "milk";

const METHOD: Record<Method, { name: string; grind: string; r: number }> = {
  pour: { name: "Pour over", grind: "medium-fine grind", r: 2.6 },
  french: { name: "French press", grind: "coarse grind", r: 4 },
  aero: { name: "AeroPress", grind: "fine-medium grind", r: 2.4 },
  moka: { name: "Moka pot", grind: "fine grind", r: 1.8 },
  espresso: { name: "Espresso", grind: "very fine grind", r: 1.5 },
  none: { name: "Starting out", grind: "whole bean", r: 6 },
};
const TASTE: Record<Taste, { name: string; note: string }> = {
  light: { name: "Light", note: "floral, citrus, berry" },
  medium: { name: "Medium", note: "caramel, milk chocolate" },
  dark: { name: "Dark", note: "dark chocolate, cocoa" },
};

// Where the grounds settle on the inside of the glass base.
const GRINDS: [number, number, number][] = [
  [206, 324, 0], [226, 327, 0.05], [246, 323, 0.1], [266, 327, 0.15], [286, 323, 0.2], [306, 327, 0.25],
  [326, 323, 0.3], [346, 326, 0.35], [216, 315, 0.12], [256, 314, 0.2], [296, 315, 0.28], [336, 314, 0.34],
];

const OUTER = "M168 112L182 334C183 348 192 354 208 355H348C364 354 373 348 374 334L388 112";
const INNER = "M176 116L189 318C190 326 196 330 206 330H350C360 330 366 326 367 318L380 116";

/**
 * "Your cup so far" on the find-your-coffee page: a glass mug that fills as
 * the three questions are answered. Grounds drop in (sized for the brewer),
 * coffee rises in the roast colour, and milk settles into a foamy top.
 * All motion is CSS transitions on classes (see .mug-* in brand.css).
 */
export function GlassMug({ method, taste, milk }: { method: Method | null; taste: Taste | null; milk: Milk | null }) {
  const withMilk = milk === "milk";
  const liquid = Boolean(taste || withMilk);
  // Same rule as the match: bright + milk is nudged to medium.
  const roast: Taste = taste === "light" && withMilk ? "medium" : (taste ?? "medium");
  const nudged = taste !== null && roast !== taste;
  const m = method ? METHOD[method] : null;
  const on = (b: unknown) => (b ? " on" : " off");
  const coffeeK = !taste ? "k0" : withMilk ? "k36" : "k80";

  return (
    <div className="mugwrap">
      <svg className="mugart" viewBox="0 0 520 400" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="hhm-in">
            <path d={INNER + "Z"} />
          </clipPath>
          <linearGradient id="hhm-vol" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity=".32" />
            <stop offset=".12" stopColor="#fff" stopOpacity=".14" />
            <stop offset=".3" stopColor="#000" stopOpacity="0" />
            <stop offset=".78" stopColor="#000" stopOpacity=".04" />
            <stop offset="1" stopColor="#000" stopOpacity=".34" />
          </linearGradient>
          <linearGradient id="hhm-milk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EBDDC4" />
            <stop offset=".55" stopColor="#D6B48A" />
            <stop offset="1" stopColor="#B98552" />
          </linearGradient>
          <linearGradient id="hhm-foam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFBF3" />
            <stop offset="1" stopColor="#EFE3CC" />
          </linearGradient>
          <linearGradient id="hhm-shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".85" />
            <stop offset=".7" stopColor="#fff" stopOpacity=".25" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="hhm-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id="hhm-blur" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* cork coaster and shadows */}
        <ellipse cx="284" cy="363" rx="134" ry="17" fill="#B88C55" />
        <ellipse cx="284" cy="358" rx="134" ry="16" fill="#D3AE78" />
        <g fill="#B88C55" opacity=".55">
          <circle cx="190" cy="356" r="1.4" /><circle cx="214" cy="364" r="1.1" /><circle cx="236" cy="351" r="1.2" />
          <circle cx="402" cy="355" r="1.3" /><circle cx="380" cy="365" r="1.1" /><circle cx="168" cy="361" r="1" />
          <circle cx="398" cy="347" r="1" /><circle cx="300" cy="369" r="1.2" />
        </g>
        <ellipse cx="292" cy="357" rx="104" ry="8" fill="rgba(30,42,21,.28)" filter="url(#hhm-blur)" />
        <ellipse className={`mug-caustic ${roast}${on(taste)}`} cx="304" cy="359" rx="56" ry="5" filter="url(#hhm-blur)" />

        {/* glass handle, fused at two points */}
        <path
          d="M384 148C432 146 462 166 462 214C462 262 434 286 380 288L379 270C420 268 442 250 442 216C442 182 424 166 383 166Z"
          fill="rgba(255,255,255,.38)"
          fillRule="evenodd"
          stroke="rgba(30,42,21,.8)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M400 156C440 164 454 194 452 224" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".75" />
        <path d="M446 238C442 258 428 272 404 278" fill="none" stroke="rgba(30,42,21,.25)" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="386" cy="157" rx="7" ry="12" fill="rgba(255,255,255,.35)" />
        <ellipse cx="383" cy="279" rx="7" ry="12" fill="rgba(255,255,255,.35)" />

        {/* back of the glass */}
        <path d={OUTER + "Z"} fill="rgba(255,255,255,.2)" />

        {/* what's inside */}
        <g clipPath="url(#hhm-in)">
          <rect className={`mug-lyr mug-foam ${withMilk ? "k80" : "k0"}`} x="168" y="116" width="220" height="214" fill="url(#hhm-foam)" />
          <rect className={`mug-lyr mug-milk ${withMilk ? "k66" : "k0"}`} x="168" y="116" width="220" height="214" fill="url(#hhm-milk)" />
          <g className={`mug-grinds${on(m)}`} fill="#2B1A0C">
            {GRINDS.map(([cx, cy, d]) => (
              <circle key={`${cx}-${cy}`} className="mug-gr" cx={cx} cy={cy} r={m ? m.r : 3} style={{ transitionDelay: `${d}s` }} />
            ))}
          </g>
          <rect className={`mug-lyr mug-coffee ${roast} ${coffeeK}`} x="168" y="116" width="220" height="214" />
          <g className={`mug-bub${on(withMilk)}`} fill="#fff">
            <circle cx="196" cy="174" r="3" /><circle cx="214" cy="180" r="2" /><circle cx="248" cy="183" r="1.6" />
            <circle cx="300" cy="182" r="2.2" /><circle cx="338" cy="178" r="1.8" /><circle cx="360" cy="173" r="2.6" />
            <circle cx="232" cy="176" r="1.2" /><circle cx="322" cy="185" r="1.2" />
          </g>
          <rect className={`mug-lyr ${liquid ? "k80" : "k0"}`} x="168" y="116" width="220" height="214" fill="url(#hhm-vol)" />
        </g>

        {/* liquid surface, seen from slightly above */}
        <ellipse className={`mug-surf ${!liquid ? "off" : withMilk ? "foam" : roast}`} cx="278" cy="159" rx="99" ry="11" />
        <ellipse
          className={`mug-crema${on(taste && !withMilk)}`}
          cx="278" cy="159" rx="95" ry="10"
          fill="rgba(196,140,86,.35)" stroke="#C08A55" strokeWidth="3"
        />
        <g className={`mug-art${on(withMilk)}`}>
          <ellipse cx="278" cy="159" rx="50" ry="6.5" fill="#B98552" opacity=".85" />
          <path d="M278 165C266 161.5 262 157.5 266 155C270 153 275 154.5 278 157C281 154.5 286 153 290 155C294 157.5 290 161.5 278 165Z" fill="#FBF5EA" />
          <path d="M278 164.5V168" stroke="#FBF5EA" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* the glass: thick walls and base */}
        <path d={OUTER + "Z" + INNER + "Z"} fill="rgba(255,255,255,.3)" fillRule="evenodd" />
        <ellipse className={`mug-tint ${roast}${on(taste)}`} cx="278" cy="342" rx="84" ry="7" />
        <ellipse cx="278" cy="344" rx="66" ry="4" fill="#fff" opacity=".55" filter="url(#hhm-soft)" />
        <path transform="translate(220 236) scale(.18)" d={LOGO_PATH} fill="#fff" fillRule="evenodd" opacity=".5" />
        <path d={OUTER} fill="none" stroke="rgba(30,42,21,.82)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d={INNER} fill="none" stroke="rgba(30,42,21,.3)" strokeWidth="1.2" />

        {/* rim */}
        <path
          d="M168 112A110 13 0 0 1 388 112A110 13 0 0 1 168 112ZM176 114A102 10 0 0 1 380 114A102 10 0 0 1 176 114Z"
          fill="rgba(255,255,255,.55)"
          fillRule="evenodd"
        />
        <ellipse cx="278" cy="112" rx="110" ry="13" fill="none" stroke="rgba(30,42,21,.82)" strokeWidth="2.5" />
        <ellipse cx="278" cy="114" rx="102" ry="10" fill="none" stroke="rgba(30,42,21,.35)" strokeWidth="1.2" />
        <path d="M206 124Q278 132 350 124" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".9" />

        {/* light catching the glass */}
        <path d="M184 132L196 318" stroke="url(#hhm-shine)" strokeWidth="9" strokeLinecap="round" />
        <rect x="198" y="134" width="5" height="30" rx="2.5" fill="#fff" opacity=".7" transform="rotate(-3.6 200 149)" />
        <rect x="201" y="170" width="4" height="12" rx="2" fill="#fff" opacity=".55" transform="rotate(-3.6 203 176)" />
        <path d="M371 136L362 318" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
        <path d="M214 352H340" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".6" />

        <g className={`mug-steam${on(liquid)}`} fill="none" stroke="#1E2A15" strokeWidth="2.6" strokeLinecap="round" filter="url(#hhm-soft)">
          <path className="mug-wisp" d="M252 92c-6-10 6-14 0-26" />
          <path className="mug-wisp w2" d="M278 88c-6-10 6-14 0-26" />
          <path className="mug-wisp w3" d="M304 92c-6-10 6-14 0-26" />
        </g>

        {/* labels (hidden on phones, where the text line below says the same) */}
        <g className={`mug-call${on(milk)}`}>
          <path d="M192 220H142" stroke="#1E2A15" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="192" cy="220" r="3.5" fill="#1E2A15" />
          <text x="16" y="172" className="mug-k">3 · DRINK</text>
          <text x="16" y="194" className="mug-v">{milk ? (withMilk ? "With milk" : "Black") : ""}</text>
          <text x="16" y="212" className="mug-n">{milk ? (withMilk ? "steamed, foamy top" : "just coffee") : ""}</text>
        </g>
        <g className={`mug-call${on(taste)}`}>
          <path d="M198 290H142" stroke="#1E2A15" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="198" cy="290" r="3.5" fill="#1E2A15" />
          <text x="16" y="252" className="mug-k">2 · ROAST</text>
          <text x="16" y="274" className="mug-v">{taste ? TASTE[roast].name : ""}</text>
          <text x="16" y="292" className="mug-n">{taste ? (nudged ? "balanced, for milk" : TASTE[roast].note) : ""}</text>
        </g>
        <g className={`mug-call${on(m)}`}>
          <path d="M206 322H142" stroke="#1E2A15" strokeWidth="1.5" strokeDasharray="3 4" />
          <circle cx="206" cy="322" r="3.5" fill="#1E2A15" />
          <text x="16" y="322" className="mug-k">1 · BREW</text>
          <text x="16" y="344" className="mug-v">{m ? m.name : ""}</text>
          <text x="16" y="362" className="mug-n">{m ? m.grind : ""}</text>
        </g>
      </svg>
    </div>
  );
}
