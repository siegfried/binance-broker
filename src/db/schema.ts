import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accountsTable = sqliteTable("account", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique(),
  apiKey: text("api_key").notNull().unique(),
  secret: text().notNull(),
  budget: real().notNull(),
  interval: text({ enum: ["1d", "1h", "15m"] }).notNull(),
});

export const accountsInsertSchema = createInsertSchema(accountsTable, {
  budget: z.coerce.number().positive(),
});

export const accountsUpdateSchema = z.object({
  budget: z.coerce.number().positive(),
});

export type Account = typeof accountsTable.$inferSelect;

export const signalsTable = sqliteTable("signal", {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  clientOrderId: text("client_order_id").notNull(),

  timestamp: integer({ mode: "timestamp" }).notNull(),
  symbol: text().notNull(),
  price: real().notNull(),
  type: text({ enum: ["OPEN", "CLOSE", "TP"] }).notNull(),
  side: text({ enum: ["LONG", "SHORT"] }).notNull(),
}, (table) => ({
  clientOrderIdIndex: index("signal_client_order_id_index").on(table.clientOrderId),
  timestampIndex: index("signal_timestamp_index").on(table.timestamp)
}));

export const signalsInsertSchema = createInsertSchema(signalsTable, {
  timestamp: z.coerce.date(),
  price: z.coerce.number().positive(),
})

export type Signal = typeof signalsTable.$inferSelect;

export const orderAttemptsTable = sqliteTable("order_attempt", {
  id: integer().primaryKey({ autoIncrement: true }),
  signalId: integer("signal_id").notNull().references(() => signalsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: integer({ mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  clientOrderId: text("client_order_id"),

  success: integer({ mode: "boolean" }).notNull(),
  result: text({ mode: "json" }),
}, (table) => ({
  clientOrderIdIndex: index("order_client_order_id_index").on(table.clientOrderId),
}));

export type OrderAttempt = typeof orderAttemptsTable.$inferSelect;
