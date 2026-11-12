import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping",
  description: "Shipping information for Husk & Honey. Placeholder text.",
};

export default function ShippingPage() {
  return (
    <>
<section className="sec page" aria-labelledby="d-h">
  <div className="doc rv">
    <p className="lab dim">Draft</p>
    <h1 className="disp h2" id="d-h">shipping.</h1>
    <p className="lead">Where we deliver, how long it takes and what it costs.</p>
    <h2 className="disp h3">Where we deliver</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p><h2 className="disp h3">Delivery times</h2><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.</p><h2 className="disp h3">Shipping charges</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p><h2 className="disp h3">Packing and tracking</h2><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.</p><h2 className="disp h3">Delayed or damaged orders</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
    <p className="legal">Placeholder text. Replace with final wording, checked by a legal adviser where needed, before the shop opens.</p>
  </div>
</section>
    </>
  );
}
