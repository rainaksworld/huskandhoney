"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SEEN_KEY = "hh_admin_last_order_seen";
const POLL_MS = 20_000;

type LatestOrder = { id: string | null; number?: string };

/**
 * Chimes - on loop, until stopped - when a new order comes in while an
 * admin has the dashboard open. Polls a small admin-only API route rather
 * than needing a websocket/push setup.
 *
 * The first check after a fresh page load just records what's already
 * there without chiming, so re-opening the dashboard doesn't alarm about
 * every order placed since the last visit - only ones that arrive while
 * it's open.
 */
export function NewOrderChime() {
  const [ringing, setRinging] = useState(false);
  const [order, setOrder] = useState<LatestOrder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeenRef = useRef<string | null>(null);
  const baselineDone = useRef(false);

  const checkLatest = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/latest-order", { cache: "no-store" });
      if (!res.ok) return;
      const data: LatestOrder = await res.json();
      if (!data.id) return;

      if (!baselineDone.current) {
        // First check this load: just record it, don't chime retroactively.
        baselineDone.current = true;
        lastSeenRef.current = data.id;
        try {
          sessionStorage.setItem(SEEN_KEY, data.id);
        } catch {}
        return;
      }

      if (data.id !== lastSeenRef.current) {
        setOrder(data);
        setRinging(true);
      }
    } catch {
      // Offline or a blip - try again on the next poll.
    }
  }, []);

  useEffect(() => {
    try {
      lastSeenRef.current = sessionStorage.getItem(SEEN_KEY);
      if (lastSeenRef.current) baselineDone.current = true;
    } catch {}
    // Initial check (then polled on an interval below); any resulting
    // setState happens after the fetch resolves, not synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkLatest();
    const id = setInterval(checkLatest, POLL_MS);
    return () => clearInterval(id);
  }, [checkLatest]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (ringing) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Autoplay can be blocked until the admin interacts with the page
        // once; the banner and Stop button still show either way.
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [ringing]);

  const stop = useCallback(() => {
    setRinging(false);
    if (order?.id) {
      lastSeenRef.current = order.id;
      try {
        sessionStorage.setItem(SEEN_KEY, order.id);
      } catch {}
    }
  }, [order]);

  return (
    <>
      <audio ref={audioRef} src="/sounds/new-order-chime.mp3" loop preload="auto" />
      {ringing && (
        <div className="order-chime-banner" role="alert">
          <span>New order{order?.number ? ` - ${order.number}` : ""} just came in.</span>
          <button type="button" className="btn" onClick={stop}>
            Stop
          </button>
        </div>
      )}
    </>
  );
}
