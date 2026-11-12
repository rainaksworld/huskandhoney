import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Delivery details and secure payment through Razorpay.",
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
