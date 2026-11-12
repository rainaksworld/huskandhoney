import Link from "next/link";
import { equipmentSku, formatINR, type Equipment } from "@/lib/catalogue";
import { ART } from "@/lib/art";
import { SubscribeForm } from "@/components/site/SubscribeForm";
import { AddEquipmentButton } from "@/components/product/AddEquipmentButton";

export function EquipmentBuy({ item, related }: { item: Equipment; related: Equipment[] }) {
  const sku = equipmentSku(item.slug);
  return (
    <div className="reveal prod">
      <div className="col rv">
        <Link className="crumb" href="/shop?c=equipment">
          ← Equipment
        </Link>
        <p className="lab dim">{item.category}</p>
        <h1 className="disp h2">{item.name.toLowerCase()}.</h1>
        <p className="lead">
          Part of a placeholder equipment range — final specs and prices are coming before launch.
        </p>
      </div>

      <div className="stage" aria-hidden="true">
        <div className="tile" style={{ width: "100%", maxWidth: 320 }}>
          <svg viewBox="0 0 240 190" dangerouslySetInnerHTML={{ __html: ART[item.slug] ?? "" }} />
        </div>
      </div>

      <div className="col rv">
        <p className="price">
          <span>{item.price === null ? "Price at launch" : formatINR(item.price)}</span>
        </p>
        <div>
          {item.price === null ? (
            <SubscribeForm list={`product:${item.slug}`} label="Get notified when it's available" />
          ) : (
            <AddEquipmentButton sku={sku} />
          )}
        </div>
        <p className="legal">Equipment shown is a placeholder range while we finalise suppliers and pricing.</p>
        {related.length > 0 && (
          <div className="rv">
            <p className="lab dim">Also in {item.category.toLowerCase()}</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/equipment/${r.slug}`}>{r.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
