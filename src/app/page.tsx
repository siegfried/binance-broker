import { eq } from "drizzle-orm/sql";
import { db } from "@/db";
import { accountsTable, orderAttemptsTable, signalsTable } from "@/db/schema";
import { desc } from "drizzle-orm/expressions";
import { SignalsView } from "./client";

export default async function Home() {
  const rows = await db
    .select({ account: accountsTable, signal: signalsTable, orderAttempt: orderAttemptsTable })
    .from(signalsTable)
    .innerJoin(accountsTable, eq(signalsTable.accountId, accountsTable.id))
    .leftJoin(orderAttemptsTable, eq(signalsTable.clientOrderId, orderAttemptsTable.clientOrderId))
    .orderBy(desc(signalsTable.timestamp), desc(orderAttemptsTable.id));

  return (
    <div className="space-y-4 text-sm">
      <SignalsView rows={rows} />
    </div>
  );
}
