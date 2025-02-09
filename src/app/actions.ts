'use server'

import { isExpired, ms, processSignalsByIds } from "@/binance/usdm";
import { db } from "@/db";
import { accountsTable, orderAttemptsTable, signalsTable } from "@/db/schema";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { resetErrorLogs } from "@/error";
import { globalSettings, globalSettingsSchema, updateGlobalSettings } from "@/settings";

export { processSignalsByIds };

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

export async function clearErrorLogs() {
  resetErrorLogs()
  redirect("/");
}

export async function fetchSignals() {
  return await db
    .select({ account: accountsTable, signal: signalsTable, orderAttempt: orderAttemptsTable })
    .from(signalsTable)
    .innerJoin(accountsTable, eq(signalsTable.accountId, accountsTable.id))
    .leftJoin(orderAttemptsTable, eq(signalsTable.clientOrderId, orderAttemptsTable.clientOrderId))
    .orderBy(desc(signalsTable.timestamp), desc(orderAttemptsTable.id));
}

export async function changeGlobalSettings(formData: FormData) {
  const settingsParsed = globalSettingsSchema.partial().safeParse({
    recvWindow: formData.get("recvWindow")
  })
  if (settingsParsed.success) {
    updateGlobalSettings({ ...globalSettings, ...settingsParsed.data })
  }
  redirect("/")
}
