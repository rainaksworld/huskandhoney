"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatINR } from "@/lib/catalogue";
import { beginCheckout, confirmPayment, sandboxPay } from "@/app/actions";
import type { CheckoutInput } from "@/server/orders";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const FIELDS: {
  name: keyof Omit<CheckoutInput, "items" | "note">;
  label: string;
  type?: string;
  full?: boolean;
  autoComplete?: string;
}[] = [
  { name: "name", label: "Full name", full: true, autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "address", label: "Street address", full: true, autoComplete: "street-address" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
  { name: "pincode", label: "Pincode", autoComplete: "postal-code" },
];

let razorpayScript: Promise<void> | null = null;
function loadRazorpay() {
  if (razorpayScript) return razorpayScript;
  razorpayScript = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
  return razorpayScript;
}

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, shop, clear } = useCart();
  const [values, setValues] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    note: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const freeOver = shop?.freeShippingOver ?? null;
  const fee = shop?.shippingFee ?? 0;
  const shipping = freeOver !== null && subtotal >= freeOver ? 0 : fee;
  const total = subtotal + shipping;

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setFieldErrors({});

    const started = await beginCheckout({
      ...values,
      items: lines.map((l) => ({ sku: l.sku, qty: l.qty })),
    });

    if (!started.ok) {
      setError(started.error);
      setFieldErrors(started.fieldErrors ?? {});
      setBusy(false);
      return;
    }

    const finish = async (paymentId: string, signature: string) => {
      const result = await confirmPayment({
        providerOrderId: started.providerOrderId,
        paymentId,
        signature,
      });
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      clear();
      router.push(`/order/${result.orderId}?t=${result.token}`);
    };

    if (started.provider === "sandbox") {
      // Dev/test only: stands in for the Razorpay checkout window.
      const { paymentId, signature } = await sandboxPay(started.providerOrderId);
      await finish(paymentId, signature);
      return;
    }

    try {
      await loadRazorpay();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the payment window.");
      setBusy(false);
      return;
    }
    if (!window.Razorpay) {
      setError("Couldn't load the payment window. Check your connection and try again.");
      setBusy(false);
      return;
    }
    const rz = new window.Razorpay({
      key: started.keyId,
      order_id: started.providerOrderId,
      amount: started.amountPaise,
      currency: "INR",
      name: "Husk & Honey",
      description: `Order ${started.orderNumber}`,
      prefill: started.prefill,
      theme: { color: "#678BC7" },
      handler: (resp: { razorpay_payment_id: string; razorpay_signature: string }) => {
        void finish(resp.razorpay_payment_id, resp.razorpay_signature);
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setError("Payment was cancelled. You can try again when ready.");
        },
      },
    });
    rz.open();
  }

  if (lines.length === 0) {
    return (
      <section className="sec page" aria-labelledby="co-h">
        <div className="col rv">
          <p className="lab dim">Checkout</p>
          <h1 className="disp h2" id="co-h">
            your bag is empty.
          </h1>
          <p className="lead">
            Add something from the <Link href="/shop">shop</Link> before checking out.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="sec page" aria-labelledby="co-h">
      <div className="col rv">
        <p className="lab dim">Checkout</p>
        <h1 className="disp h2" id="co-h">
          delivery details.
        </h1>
      </div>
      <div className="checkout-grid">
        <form className="order-form" onSubmit={onSubmit} noValidate>
          {FIELDS.map((f) => (
            <label key={f.name} className={f.full ? "full" : undefined}>
              {f.label}
              <input
                name={f.name}
                type={f.type ?? "text"}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                required
                autoComplete={f.autoComplete}
                aria-invalid={Boolean(fieldErrors[f.name])}
              />
              {fieldErrors[f.name] && <span className="field-err">{fieldErrors[f.name]}</span>}
            </label>
          ))}
          <label className="full">
            Note for delivery (optional)
            <textarea
              name="note"
              rows={2}
              value={values.note}
              onChange={(e) => set("note", e.target.value)}
              maxLength={300}
            />
          </label>
          {error && (
            <p className="stock" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-fill" type="submit" disabled={busy}>
            {busy ? "Starting payment…" : `Pay ${formatINR(total)}`}
          </button>
          <p className="legal">You&apos;ll pay securely through Razorpay. We never see your card details.</p>
        </form>

        <div className="cart-sum" aria-label="Order summary">
          <p className="lab">Order summary</p>
          <ul className="c-list">
            {lines.map((l) => (
              <li key={l.sku} className="row">
                <span>
                  {l.info.title} × {l.qty}
                  <br />
                  <span className="lab dim">{l.info.meta}</span>
                </span>
                <span>{formatINR((l.info.unitPrice ?? 0) * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="row">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="row">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
          </div>
          <div className="row tot">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
