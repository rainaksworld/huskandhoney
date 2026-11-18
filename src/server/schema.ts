import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/** Stock count per bucket (see `stockKey` in the catalogue). No row = not tracked. */
export const stock = pgTable("stock", {
  key: text("key").primaryKey(),
  qty: integer("qty").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Owner-editable settings (shipping rule, low-stock threshold). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Customer accounts. Checkout still works without one; an account adds
 * saved details, order history and preferences. Email is stored lowercased.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    city: text("city").notNull().default(""),
    state: text("state").notNull().default(""),
    pincode: text("pincode").notNull().default(""),
    /** scrypt$<salt>$<hash>, see src/server/accounts.ts. Empty for people who
     * only sign in with an emailed code, Google or Facebook. */
    passwordHash: text("password_hash").notNull(),
    /** Linked sign-in accounts (provider user ids). */
    googleId: text("google_id"),
    facebookId: text("facebook_id"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email").on(t.email),
    uniqueIndex("users_google_id").on(t.googleId),
    uniqueIndex("users_facebook_id").on(t.facebookId),
  ],
);

/** Six-digit sign-in codes sent by email. Only a keyed hash of the code is kept. */
export const loginCodes = pgTable("login_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Discount coupons. kind: "percent" (value = % off the coffee), "flat"
 * (value = rupees off) or "none" (no money off; use with freeShipping).
 */
export const coupons = pgTable(
  "coupons",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    kind: text("kind").$type<"percent" | "flat" | "none">().notNull(),
    value: integer("value").notNull().default(0),
    freeShipping: boolean("free_shipping").notNull().default(false),
    /** Rupees; 0 = no minimum. */
    minOrder: integer("min_order").notNull().default(0),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /** Total paid orders allowed; null = unlimited. */
    maxUses: integer("max_uses"),
    /** Paid orders allowed per customer email; null = unlimited. */
    perCustomer: integer("per_customer").default(1),
    firstOrderOnly: boolean("first_order_only").notNull().default(false),
    active: boolean("active").notNull().default(true),
    used: integer("used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupons_code").on(t.code)],
);

/** Logged-in sessions. Only a hash of the cookie token is stored. */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One-time links for verifying an email or resetting a password. Hash only. */
export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"verify" | "reset">().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "payment_failed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: serial("seq").notNull(),
    /** Unguessable token that lets the buyer view their order page. */
    accessToken: text("access_token").notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("pending_payment"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    note: text("note"),
    /** All money in paise. */
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    /** Coupon used, and how much it took off (paise). */
    couponCode: text("coupon_code"),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    currency: text("currency").notNull().default("INR"),
    provider: text("provider").notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    stockApplied: boolean("stock_applied").notNull().default(false),
    trackingNote: text("tracking_note"),
    /** Buyer opted in to WhatsApp order updates and offers at checkout. */
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(false),
    /** Set when the buyer was logged in at checkout. Guest orders stay null. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("orders_provider_order_id").on(t.providerOrderId)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  title: text("title").notNull(),
  meta: text("meta").notNull(),
  unitPrice: integer("unit_price").notNull(),
  qty: integer("qty").notNull(),
});

/** Processed payment-provider webhook event ids, for idempotency. */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Email sign-ups: café opening, product availability, newsletter. */
export const subscribers = pgTable(
  "subscribers",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    list: text("list").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscribers_email_list").on(t.email, t.list)],
);

/** Contact-form messages. */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
