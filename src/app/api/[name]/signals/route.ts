import { createClientByAccount, processSignals, shouldUseTestnet } from "@/binance/usdm";
import { db } from "@/db";
import { accountsTable, signalsInsertSchema, signalsTable } from "@/db/schema";
import { logError } from "@/error";
import csv from "@fast-csv/parse";
import { generateNewOrderId } from "binance";
import { eq } from "drizzle-orm/sql";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type InsertSchema = z.infer<typeof signalsInsertSchema>;
const contentType = z.enum(["application/csv", "text/csv"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const account = (await db.selectDistinct().from(accountsTable).where(eq(accountsTable.name, name))).at(0);
  if (!account) return NextResponse.json({ error: "Cannot find the account" }, { status: 404 })

  if (!contentType.safeParse(request.headers.get("Content-Type")).success)
    return NextResponse.json({ error: "Invalid Content" }, { status: 400 })
  if (!request.body) return NextResponse.json({ error: "Empty Request" }, { status: 400 });

  try {
    const newSignals = await parseCSV(account.id, await request.text());
    if (newSignals.length <= 0) return NextResponse.json({ error: "No valid signals" }, { status: 400 });
    const signals = await db.insert(signalsTable).values(newSignals).returning();
    const client = createClientByAccount(account);
    await processSignals(client, signals, account.budget, account.interval);
  } catch (error) {
    return NextResponse.json(logError(error), { status: 400 });
  }
  return NextResponse.json({ message: "OK" });
}

async function parseCSV(accountId: number, text: string): Promise<InsertSchema[]> {
  return new Promise((resolve, reject) => {
    const signals: InsertSchema[] = [];
    csv
      .parseString(text, { headers: true })
      .on("data", (row) => {
        const clientOrderId = generateNewOrderId(shouldUseTestnet() ? "usdmtest" : "usdm");
        const signal = signalsInsertSchema.parse({
          accountId: accountId,
          clientOrderId,
          ...row
        });
        signals.push(signal);
      }).on("end", () => {
        resolve(signals);
      }).on("error", (error) => {
        reject(error)
      });
  });
}
