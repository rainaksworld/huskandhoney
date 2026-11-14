import "server-only";

/**
 * WhatsApp order messages - NOT CONNECTED TO A PROVIDER YET.
 *
 * Every place in the app that should send a WhatsApp message already calls
 * `sendWhatsApp` with a named event and the values that message needs. Until
 * WHATSAPP_API_URL and WHATSAPP_API_KEY are set, nothing is sent and each
 * attempt is just logged, so orders keep working normally.
 *
 * Connecting a provider (AiSensy, WATI, Interakt, or Meta's Cloud API) means
 * filling in `deliver()` below with that provider's request format. WhatsApp
 * only allows businesses to start a conversation with a pre-approved message
 * template, so each event name below maps to one template the owner creates
 * and gets approved in the provider's dashboard first.
 *
 * Events:
 *   order_confirmed  -> buyer, after payment   (values: name, order, total)
 *   order_packed     -> buyer                  (values: name, order)
 *   order_shipped    -> buyer                  (values: name, order, tracking)
 *   order_delivered  -> buyer                  (values: name, order)
 *   order_cancelled  -> buyer                  (values: name, order)
 *   owner_new_order  -> owner (OWNER_WHATSAPP) (values: order, name, total, phone)
 *
 * Buyer messages are only sent when the buyer ticked the WhatsApp box at
 * checkout (`whatsappOptIn`). Marketing messages (offers) must likewise only
 * go to opted-in buyers - see the customers page in /admin for that list.
 */
export type WaEvent =
  | "order_confirmed"
  | "order_packed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "owner_new_order";

type WaMessage = { to: string; event: WaEvent; values: Record<string, string> };

/* ------------------------------------------------------------------ */
/* Free route: click-to-chat                                            */
/* ------------------------------------------------------------------ */

type ChatOrder = {
  name: string;
  phone: string;
  seq: number;
  total: number;
  status: string;
  trackingNote: string | null;
};

/**
 * The message a customer should get for an order's current status, or null
 * when there's nothing to tell them. Used for the free "Send on WhatsApp"
 * button in /admin, which opens the owner's own WhatsApp (Business app or
 * web) with this text ready - the owner just presses send. No API, no cost.
 */
export function whatsappStatusText(o: ChatOrder, orderNo: string, totalText: string) {
  const hi = `Hi ${o.name.split(" ")[0]},`;
  const note = o.trackingNote ? `\n\n${o.trackingNote}` : "";
  const sign = "\n\n- Husk & Honey";
  switch (o.status) {
    case "paid":
      return `${hi} thank you for your order ${orderNo} (${totalText})! We've received your payment and will let you know as soon as it's packed.${sign}`;
    case "packed":
      return `${hi} your Husk & Honey order ${orderNo} is packed and will be on its way soon.${note}${sign}`;
    case "shipped":
      return `${hi} good news - your order ${orderNo} is on its way!${note}${sign}`;
    case "delivered":
      return `${hi} your order ${orderNo} has been delivered. Enjoy your coffee! If anything isn't right, just reply here.${sign}`;
    case "cancelled":
      return `${hi} your order ${orderNo} has been cancelled.${note}\n\nIf you have any questions, just reply here.${sign}`;
    default:
      return null;
  }
}

/** A wa.me link that opens WhatsApp to this number with the text filled in. */
export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Indian mobile numbers are stored as 10 digits or +91XXXXXXXXXX; providers want 91XXXXXXXXXX. */
export function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function sendWhatsApp(msg: WaMessage) {
  const url = process.env.WHATSAPP_API_URL;
  const key = process.env.WHATSAPP_API_KEY;
  if (!url || !key) {
    console.info(`[whatsapp:not-sent] to=${msg.to} event=${msg.event}`);
    return { sent: false as const };
  }
  try {
    const res = await deliver(url, key, msg);
    if (!res.ok) console.error("[whatsapp] failed", res.status, await res.text().catch(() => ""));
    return { sent: res.ok };
  } catch (err) {
    console.error("[whatsapp] error", err);
    return { sent: false as const };
  }
}

/**
 * Provider-specific request. This generic shape is a placeholder; replace it
 * with the chosen provider's format (template name, language, parameters)
 * when the account is set up.
 */
function deliver(url: string, key: string, msg: WaMessage) {
  return fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ to: msg.to, template: msg.event, values: msg.values }),
    cache: "no-store",
  });
}
