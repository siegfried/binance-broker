import { db } from "@/db";
import { accountsTable, signalsInsertSchema, signalsTable } from "@/db/schema";
import csv from "@fast-csv/parse";
import { eq } from "drizzle-orm/sql";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const csvContentType = z.enum(["application/csv", "text/csv"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const account = (await db.selectDistinct().from(accountsTable).where(eq(accountsTable.name, name))).at(0);
  if (!account) return NextResponse.json({ error: "Cannot find the account" }, { status: 404 })

  if (!csvContentType.safeParse(request.headers.get("Content-Type")).success)
    return NextResponse.json({ error: "Invalid Content" }, { status: 400 })
  if (!request.body) return NextResponse.json({ error: "Empty Request" }, { status: 400 });

  csv
    .parseString(await request.text(), { headers: true })
    .on("data", (signal) => saveSignal(account.id, signal));

  return NextResponse.json({ message: "OK" });
}

async function saveSignal(accountId: number, signal: Record<string, string>) {
  const signalParsed = signalsInsertSchema.safeParse({ accountId, ...signal });
  if (!signalParsed.success) return;
  try {
    await db.insert(signalsTable).values(signalParsed.data);
  } catch (error) {
    console.error(error);
  }
}
