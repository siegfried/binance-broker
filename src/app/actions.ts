'use server'

import { isExpired, ms, processSignalsByIds } from "@/binance/usdm";
import { db } from "@/db";
import { accountsTable, signalsTable } from "@/db/schema";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";

export async function handleSignals(formData: FormData) {
  const idsParsed = z.array(z.coerce.number()).safeParse(formData.getAll("id"));
  if (!idsParsed.success) redirect("/");
  processSignalsByIds(idsParsed.data);
  redirect("/");
}

export async function deleteOutdatedSignals() {
  const rows = await db
    .select({ account: accountsTable, signal: signalsTable })
    .from(signalsTable)
    .innerJoin(accountsTable, eq(signalsTable.accountId, accountsTable.id));
  const now = new Date();
  const ids = rows.reduce<number[]>((ids, { signal, account }) => {
    if (isExpired(signal.timestamp, now, ms(account.interval))) {
      ids.push(signal.id)
    }
    return ids;
  }, []);
  await db.delete(signalsTable).where(inArray(signalsTable.id, ids));
  redirect("/");
}
