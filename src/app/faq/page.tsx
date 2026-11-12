import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Husk & Honey coffee, delivery and orders.",
};

export default function FaqPage() {
  return (
    <>
<section className="sec page" aria-labelledby="q-h">
  <div className="doc rv">
    <p className="lab dim">Help</p>
    <h1 className="disp h2" id="q-h">questions.</h1>
    <p className="lead">Quick answers. Can't find yours? <Link href="/contact">Ask us</Link>.</p>
    <div className="faq"><details className="faq-i"><summary>Which grinds do you offer?</summary><p>Whole bean, espresso, moka pot, pour over and AeroPress.</p></details><details className="faq-i"><summary>What sizes does the coffee come in?</summary><p>250 g and 500 g bags.</p></details><details className="faq-i"><summary>Which roasts are available?</summary><p>Light, medium and dark, for both Arabica 01 (Darjeeling estate) and Arabica 02 (Kalebung estate).</p></details><details className="faq-i"><summary>How long does delivery take?</summary><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p></details><details className="faq-i"><summary>How should I store my coffee?</summary><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim.</p></details><details className="faq-i"><summary>Can I return opened coffee?</summary><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p></details><details className="faq-i"><summary>How do I place an order?</summary><p>Add items to your bag and check out. You pay online through Razorpay, and we email you a confirmation with your order number.</p></details><details className="faq-i"><summary>When does the café open?</summary><p>We are still building it in Pradhan Nagar, Siliguri. Leave your email in the footer and we will let you know.</p></details></div>
    <p className="legal">Some answers are placeholder text until launch.</p>
  </div>
</section>
    </>
  );
}
