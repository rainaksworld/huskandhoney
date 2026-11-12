"use client";

import { useEffect, useRef, useState } from "react";
import { METHODS, type MethodKey } from "@/lib/catalogue";
import { BREW_ART } from "@/lib/brew-art";

const METHOD_ORDER: MethodKey[] = ["pour", "french", "moka", "aero", "espresso"];
const PRESETS = [
  { w: 250, label: "1 cup · 250 ml" },
  { w: 500, label: "2 cups · 500 ml" },
  { w: 750, label: "3 cups · 750 ml" },
];

function fmtTime(s: number, dur: number) {
  const sec = Math.max(0, Math.ceil(s));
  if (dur < 60) return `${sec} sec`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r < 10 ? "0" : ""}${r} min`;
}

export function BrewGuide() {
  const [key, setKey] = useState<MethodKey>("pour");
  const [water, setWater] = useState(250);
  const [fading, setFading] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const m = METHODS[key];
  const coffee = m.ratio ? Math.round((water / m.ratio) * 10) / 10 : 0;

  useEffect(() => {
    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    };
  }, []);

  const selectMethod = (next: MethodKey) => {
    if (next === key) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setKey(next);
      return;
    }
    setFading(true);
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => {
      setKey(next);
      setFading(false);
    }, 260);
  };

  return (
    <section className="sec page" id="brew" aria-labelledby="brew-h">
      <div className="col rv">
        <p className="lab dim">Brew</p>
        <h1 className="disp h2" id="brew-h">
          brew it your way.
        </h1>
      </div>
      <div className="brew">
        <div className="col">
          <fieldset className="tabs" aria-label="Brew method">
            {METHOD_ORDER.map((k) => (
              <label className="tab" key={k}>
                <input type="radio" name="method" checked={key === k} onChange={() => selectMethod(k)} />
                <span>{METHODS[k].label}</span>
              </label>
            ))}
          </fieldset>
          <div className={`fx draw${fading ? " fading" : ""}`} aria-hidden="true">
            {METHOD_ORDER.map((k) => (
              <svg
                key={k}
                className={`d${k === key ? " on" : ""}`}
                data-m={k}
                viewBox="0 0 200 220"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: BREW_ART[k] }}
              />
            ))}
          </div>
        </div>

        <div className={`col fx${fading ? " fading" : ""}`} aria-live="polite">
          <p className="lab dim">Coffee to water, by weight</p>
          <p className="disp ratio">{key === "moka" ? "1 pot" : m.ratio ? `1:${m.ratio}` : "—"}</p>
          {m.fixed ? (
            <p className="lead">{m.fixed}</p>
          ) : (
            <div className="calc">
              <p className="lab">How much water?</p>
              <p className="hint">Drag the slider or tap a size. We will work out how much coffee to weigh.</p>
              <div className="presets" role="group" aria-label="Quick sizes">
                {PRESETS.map((p) => (
                  <button
                    key={p.w}
                    className="pbtn"
                    type="button"
                    aria-pressed={water === p.w}
                    onClick={() => setWater(p.w)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <label className="lab dim" htmlFor="water">
                Water: <span>{water}</span> ml
              </label>
              <input
                type="range"
                id="water"
                min={150}
                max={750}
                step={50}
                value={water}
                onChange={(e) => setWater(Number(e.target.value))}
              />
              <div className="scale lab dim" aria-hidden="true">
                <span>150 ml</span>
                <span>450 ml</span>
                <span>750 ml</span>
              </div>
              <div className="nums">
                <span>
                  <span className="lab dim">Coffee</span>
                  <b>{coffee.toFixed(1)} g</b>
                </span>
                <span>
                  <span className="lab dim">Water</span>
                  <b>{water} g</b>
                </span>
              </div>
              <p className="cline">
                Weigh {coffee.toFixed(1)} g of coffee, then pour in {water} g of water (about {water} ml).
              </p>
            </div>
          )}
        </div>

        <BrewTimer key={key} method={key} />
      </div>
    </section>
  );
}

/**
 * Keyed by method in the parent, so switching methods remounts this (fresh
 * state, old interval torn down by the unmount cleanup) instead of needing
 * to reset timer state from an effect.
 */
function BrewTimer({ method }: { method: MethodKey }) {
  const m = METHODS[method];
  const [left, setLeft] = useState(m.secs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  useEffect(() => stopTimer, []);

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      [0, 0.25, 0.5].forEach((d) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + d);
        osc.stop(ctx.currentTime + d + 0.15);
      });
    } catch {}
  }

  const tick = () => {
    const remaining = (endAt.current - Date.now()) / 1000;
    if (remaining <= 0) {
      stopTimer();
      setLeft(0);
      setDone(true);
      beep();
    } else {
      setLeft(remaining);
    }
  };

  const toggleTimer = () => {
    if (running) {
      stopTimer();
      return;
    }
    const startFrom = left <= 0 ? m.secs : left;
    setLeft(startFrom);
    setDone(false);
    endAt.current = Date.now() + startFrom * 1000;
    setRunning(true);
    timer.current = setInterval(tick, 200);
  };

  const resetTimer = () => {
    stopTimer();
    setLeft(m.secs);
    setDone(false);
  };

  return (
    <div className="col fx">
      <div className="facts">
        <div>
          <p className="lab dim">Grind</p>
          <p style={{ margin: "6px 0 0" }}>{m.grind}</p>
        </div>
        <div>
          <p className="lab dim">Brew time</p>
          <p style={{ margin: "6px 0 0" }}>{m.time}</p>
        </div>
      </div>
      <div className="timer">
        <div>
          <p className="lab dim">Timer</p>
          <p className={`tnum${done ? " done" : ""}`}>{done ? "Done" : fmtTime(left, m.secs)}</p>
        </div>
        <div className="tbtns">
          <button className="btn btn-ghost" type="button" onClick={toggleTimer}>
            {running ? "Pause" : done ? "Start again" : left < m.secs ? "Resume" : "Start"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={resetTimer}>
            Reset
          </button>
        </div>
      </div>
      <p className="sr" role="status">
        {done ? "Time is up." : ""}
      </p>
      <ol className="steps">
        {m.steps.map((s) => (
          <li key={s}>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="legal">Starting points. Adjust to taste.</p>
    </div>
  );
}
