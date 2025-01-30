'use server'

import { processSignalsByIds } from "@/binance/usdm";
import { db } from "@/db";
import { accountsInsertSchema, accountsTable, accountsUpdateSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

type CreateState =
  | null
  | {
    error?: string,
    errors?: {
      id?: string[],
      name?: string[],
      apiKey?: string[],
      secret?: string[],
      budget?: string[],
    }
  }

export async function createAccount(prevState: CreateState, formData: FormData) {
  const accountParsed = accountsInsertSchema.safeParse({
    name: formData.get("name"),
    interval: formData.get("interval"),
    apiKey: formData.get("api_key"),
    secret: formData.get("secret"),
    budget: formData.get("budget"),
  });
  if (!accountParsed.success) {
    return { errors: accountParsed.error.flatten().fieldErrors }
  }
  try {
    await db.insert(accountsTable).values(accountParsed.data);
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message
    return { error: message }
  }
  redirect("/accounts")
}

type UpdateState =
  | null
  | { error?: string, errors?: { budget?: string[] } }

export async function updateAccount(prevState: UpdateState, formData: FormData) {
  const accountParsed = accountsUpdateSchema.safeParse({
    budget: formData.get("budget"),
  });
  if (!accountParsed.success) {
    return { errors: accountParsed.error.flatten().fieldErrors }
  }
  const idParsed = z.coerce.number().safeParse(formData.get("id"));
  if (!idParsed.success) {
    redirect("/accounts");
  }
  try {
    await db.update(accountsTable).set(accountParsed.data).where(eq(accountsTable.id, idParsed.data));
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message
    return { error: message }
  }
  redirect("/accounts");
}

export async function deleteAccount(formData: FormData) {
  const nameParsed = z.string().safeParse(formData.get("name"));
  if (nameParsed.success) {
    await db.delete(accountsTable).where(eq(accountsTable.name, nameParsed.data));
  }
  redirect("/accounts");
}

export async function handleSignals(formData: FormData) {
  const idsParsed = z.array(z.coerce.number()).safeParse(formData.getAll("id"));
  if (!idsParsed.success) redirect("/");
  processSignalsByIds(idsParsed.data);
  redirect("/");
}
