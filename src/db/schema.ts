import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accountsTable = sqliteTable("accounts", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  apiKey: text("api_key").notNull().unique(),
  secret: text().notNull(),
  budget: real().notNull(),
});

export const accountsInsertSchema = createInsertSchema(accountsTable, {
  budget: z.coerce.number().positive(),
});

export const accountsUpdateSchema = z.object({
  budget: z.coerce.number().positive(),
})
