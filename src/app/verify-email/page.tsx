import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { eq, sql } from "drizzle-orm";
import { consumeAuthToken } from "@/server/accounts";
import { getDb, schema } from "@/server/db";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

export const instant = false;

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  await connection();
  const userId = await consumeAuthToken((await searchParams).t ?? "", "verify");
  if (userId) {
    const db = await getDb();
    await db
      .update(schema.users)
      .set({ emailVerifiedAt: sql`coalesce(${schema.users.emailVerifiedAt}, now())`, updatedAt: sql`now()` })
      .where(eq(schema.users.id, userId));
  }
  return (
    <section className="sec page" aria-labelledby="ve-h">
      <div className="col rv">
        <p className="lab dim">Your account</p>
        <h1 className="disp h2" id="ve-h">
          {userId ? "email confirmed." : "this link didn't work."}
        </h1>
        <p className="lead">
          {userId ? (
            <>
              Thanks. Any earlier orders you placed with this email now show in <Link href="/account">your account</Link>.
            </>
          ) : (
            <>
              It may have expired or already been used. <Link href="/account">Go to your account</Link> to get a new
              one, or to check whether your email is already confirmed.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
