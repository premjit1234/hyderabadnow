// One-off helper for granting the "admin" role — safe to run against a live
// database (unlike seed.ts, which wipes and reseeds everything). Upserts by
// email: creates a new admin account, or promotes/repassword's an existing one.
//
//   npm run db:create-admin -- <email> <name> <password>
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users } from "./schema";
import { hashPassword } from "../lib/auth";

async function main() {
  const [email, name, password] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error('Usage: npm run db:create-admin -- "email@example.com" "Full Name" "password"');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    await db
      .update(users)
      .set({ role: "admin", name, passwordHash, authProvider: "password" })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing account ${email} -> role "admin", password reset.`);
  } else {
    await db.insert(users).values({ name, email, passwordHash, role: "admin", authProvider: "password" });
    console.log(`Created new admin account: ${email}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
