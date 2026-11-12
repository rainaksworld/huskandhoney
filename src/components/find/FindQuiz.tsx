"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  COFFEE_PRICE,
  GRIND_LABEL,
  ROAST_LABEL,
  coffeeSku,
  formatINR,
  getCoffee,
  type Grind,
  type Roast,
} from "@/lib/catalogue";
import { QUIZ_CUP_ART, QUIZ_METHOD_ICON } from "@/lib/quiz-art";
import { useCart } from "@/components/cart/CartProvider";

type MethodAnswer = "pour" | "french" | "aero" | "moka" | "espresso" | "none";
type TasteAnswer = Roast;
type MilkAnswer = "black" | "milk";

const METHOD_OPTIONS: { v: MethodAnswer; label: string }[] = [
  { v: "pour", label: "Pour over or V60" },
  { v: "french", label: "French press" },
  { v: "aero", label: "AeroPress" },
  { v: "moka", label: "Moka pot" },
  { v: "espresso", label: "Espresso machine" },
  { v: "none", label: "Not yet, I am starting out" },
];
const TASTE_OPTIONS: { v: TasteAnswer; label: string; dot: string }[] = [
  { v: "light", label: "Bright and fruity", dot: "#F1E4D3" },
  { v: "medium", label: "Balanced and smooth", dot: "#678BC7" },
  { v: "dark", label: "Bold and chocolatey", dot: "#4B682F" },
];
const MILK_OPTIONS: { v: MilkAnswer; label: string }[] = [
  { v: "black", label: "Black" },
  { v: "milk", label: "With milk" },
];
const METHOD_LABEL: Record<MethodAnswer, string> = {
  pour: "Pour over",
  french: "French press",
  aero: "AeroPress",
  moka: "Moka pot",
  espresso: "Espresso",
  none: "Not yet, I am starting out",
};
const METHOD_GRIND: Record<MethodAnswer, Grind> = {
  pour: "pour",
  french: "whole",
  aero: "aero",
  moka: "moka",
  espresso: "espresso",
  none: "whole",
};
const METHOD_LINE: Record<MethodAnswer, string> = {
  pour: "Pour over, clean and clear.",
  french: "French press, full and rounded.",
  aero: "AeroPress, quick and smooth.",
  moka: "Moka pot, strong and syrupy.",
  espresso: "Espresso, short and intense.",
  none: "Starting fresh. We will keep it simple.",
};
const TASTE_LINE: Record<TasteAnswer, string> = {
  light: "bright and fruity",
  medium: "balanced and smooth",
  dark: "bold and chocolatey",
};

const KALEBUNG = getCoffee("arabica-02")!;

export function FindQuiz() {
  const { add, shop, remaining } = useCart();
  const [method, setMethod] = useState<MethodAnswer | null>(null);
  const [taste, setTaste] = useState<TasteAnswer | null>(null);
  const [milk, setMilk] = useState<MilkAnswer | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const answeredOnce = useRef(false);

  const answered = [method, taste, milk].filter(Boolean).length;

  const onAnswer = () => {
    if (answeredOnce.current) {
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({
          block: "nearest",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        }),
      );
    }
    answeredOnce.current = true;
  };

  if (!method || !taste || !milk) {
    const parts: string[] = [];
    if (method) parts.push(METHOD_LINE[method]);
    if (taste) parts.push(`You like it ${TASTE_LINE[taste]}.`);
    if (milk) parts.push(milk === "milk" ? "With a splash of milk." : "Taken black.");
    return (
      <FindLayout
        method={method}
        taste={taste}
        milk={milk}
        answered={answered}
        line={parts.length ? parts.join(" ") : "Pick how you brew and we will start building your cup."}
        onMethod={(v) => {
          setMethod(v);
          onAnswer();
        }}
        onTaste={(v) => {
          setTaste(v);
          onAnswer();
        }}
        onMilk={(v) => {
          setMilk(v);
          onAnswer();
        }}
      />
    );
  }

  let roast: Roast = taste;
  let why = "";
  if (milk === "milk" && roast === "light") {
    roast = "medium";
    why = "You take it with milk, so we nudged you from bright to a balanced medium roast.";
  }
  const grind = METHOD_GRIND[method];
  const note = KALEBUNG.notes![roast];
  const sku = coffeeSku(KALEBUNG.slug, roast, grind, "250");
  const left = remaining(sku);
  const out = left !== null && left <= 0;
  const price = COFFEE_PRICE["250"];
  const brewMismatch = !note.brewAs.some((b) => b.toLowerCase().includes(METHOD_LABEL[method].toLowerCase()));

  return (
    <FindLayout
      method={method}
      taste={taste}
      milk={milk}
      answered={3}
      line=""
      onMethod={(v) => {
        setMethod(v);
        onAnswer();
      }}
      onTaste={(v) => {
        setTaste(v);
        onAnswer();
      }}
      onMilk={(v) => {
        setMilk(v);
        onAnswer();
      }}
      result={
        <div className="result" ref={resultRef}>
          <div>
            <p className="lab dim">Your match</p>
            <h2 className="disp h2">{ROAST_LABEL[roast].toLowerCase()}.</h2>
            <p className="lead">
              {KALEBUNG.name} ({KALEBUNG.estate}), {ROAST_LABEL[roast].toLowerCase()},{" "}
              {grind === "whole" ? "whole bean" : `ground for ${GRIND_LABEL[grind].toLowerCase()}`}.
            </p>
            {why && <p>{why}</p>}
          </div>
          <div>
            <dl>
              <dt>Flavour</dt>
              <dd>{note.flavour.join(" • ")}</dd>
              <dt>Brew as</dt>
              <dd>{note.brewAs.join(" • ")}</dd>
              <dt>Best for</dt>
              <dd>{note.bestFor}</dd>
            </dl>
            {brewMismatch && (
              <p className="nudge">
                This roast is usually brewed as {note.brewAs.join("/")}. {METHOD_LABEL[method]} will still work, but a{" "}
                {roast === "light" ? "medium or dark" : "light or medium"} roast is a more common match.
              </p>
            )}
            {method === "none" && (
              <p className="nudge">No gear yet? A starter kit gives you a brewer, a mug and coffee in one box.</p>
            )}
            <p className="price">
              {formatINR(price)} · 250 g
            </p>
            <div className="acts">
              <button className="btn btn-fill" type="button" disabled={out} onClick={() => add(sku)}>
                {out ? "Sold out" : "Add to bag"}
              </button>
              <Link className="btn btn-ghost" href={`/coffee/${KALEBUNG.slug}?roast=${roast}&grind=${grind}`}>
                See the coffee
              </Link>
              {method === "none" && (
                <Link className="btn btn-ghost" href="/shop?c=kits">
                  See starter kits
                </Link>
              )}
            </div>
            <p className="legal">
              Tasting notes are available for Arabica 02 (Kalebung) today. Arabica 01 (Darjeeling) notes are coming soon.
            </p>
            {!out && shop && left !== null && left <= shop.lowStockAt && (
              <p className="stock" role="status">
                Only {left} left in this roast and size
              </p>
            )}
          </div>
        </div>
      }
    />
  );
}

function FindLayout({
  method,
  taste,
  milk,
  answered,
  line,
  result,
  onMethod,
  onTaste,
  onMilk,
}: {
  method: MethodAnswer | null;
  taste: TasteAnswer | null;
  milk: MilkAnswer | null;
  answered: number;
  line: string;
  result?: React.ReactNode;
  onMethod: (v: MethodAnswer) => void;
  onTaste: (v: TasteAnswer) => void;
  onMilk: (v: MilkAnswer) => void;
}) {
  return (
    <section className="sec page find" aria-labelledby="f-h">
      <div className="find-grid">
        <div className="find-left">
          <div className="page-head rv">
            <p className="lab dim">Find your coffee</p>
            <h1 className="disp h2" id="f-h">
              three questions. one coffee.
            </h1>
            <p className="lead">Tell us how you brew and what you like. We will point you to a roast and a grind.</p>
          </div>
          <form className="quiz">
            <fieldset className="opts qstep rv" data-step="1">
              <legend>
                <span className="qnum">1</span>
                <span className="lab">How do you brew?</span>
              </legend>
              {METHOD_OPTIONS.map((o) => (
                <label className="chip q-chip" key={o.v}>
                  <input type="radio" name="method" checked={method === o.v} onChange={() => onMethod(o.v)} />
                  <span>
                    <svg
                      viewBox="0 0 32 32"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dangerouslySetInnerHTML={{ __html: QUIZ_METHOD_ICON[o.v] }}
                    />
                    {o.label}
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="opts qstep rv" data-step="2">
              <legend>
                <span className="qnum">2</span>
                <span className="lab">What do you like in a cup?</span>
              </legend>
              {TASTE_OPTIONS.map((o) => (
                <label className="chip q-chip" key={o.v}>
                  <input type="radio" name="taste" checked={taste === o.v} onChange={() => onTaste(o.v)} />
                  <span>
                    <i className="dot" style={{ background: o.dot }} />
                    {o.label}
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="opts qstep rv" data-step="3">
              <legend>
                <span className="qnum">3</span>
                <span className="lab">How do you drink it?</span>
              </legend>
              {MILK_OPTIONS.map((o) => (
                <label className="chip q-chip" key={o.v}>
                  <input type="radio" name="milk" checked={milk === o.v} onChange={() => onMilk(o.v)} />
                  <span>{o.label}</span>
                </label>
              ))}
            </fieldset>
          </form>
          <p className="legal">Changed your mind? Pick again at any time and the match updates.</p>
        </div>
        <div className="find-right rv">
          <div className="cupcard" data-method={method ?? ""} data-roast={taste ?? ""} data-milk={milk ?? ""}>
            <p className="lab cup-prog">{answered} of 3 answered</p>
            <svg
              className="cupart"
              viewBox="0 0 320 300"
              aria-hidden="true"
              focusable="false"
              dangerouslySetInnerHTML={{ __html: QUIZ_CUP_ART }}
            />
            <div className="cup-txt">
              <p className="lab dim">Your cup so far</p>
              <p className="cup-line">{line}</p>
            </div>
            {result}
          </div>
        </div>
      </div>
    </section>
  );
}
