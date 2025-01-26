import { db } from "@/db";
import { accountsTable, signalsInsertSchema, signalsTable } from "@/db/schema";
import csv from "@fast-csv/parse";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm/sql";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contentType = z.enum(["application/csv", "text/csv"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const account = (await db.selectDistinct().from(accountsTable).where(eq(accountsTable.name, name))).at(0);
  if (!account) return NextResponse.json({ error: "Cannot find the account" }, { status: 404 })

  if (!contentType.safeParse(request.headers.get("Content-Type")).success)
    return NextResponse.json({ error: "Invalid Content" }, { status: 400 })
  if (!request.body) return NextResponse.json({ error: "Empty Request" }, { status: 400 });

  const signals: Array<z.infer<typeof signalsInsertSchema>> = [];

  try {
    csv
      .parseString(await request.text(), { headers: true })
      .on("data", (row) => {
        const signal = signalsInsertSchema.parse({
          accountId: account.id,
          clientOrderId: createId(),
          ...row
        });
        signals.push(signal)
      });
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await db.insert(signalsTable).values(signals);

  return NextResponse.json({ message: "OK" });
}
