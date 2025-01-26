import { sql } from "drizzle-orm";
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

export const signalsTable = sqliteTable("signal", {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: text().default(sql`(CURRENT_TIMESTAMP)`),
  clientOrderId: text("client_order_id"),

  timestamp: integer({ mode: "timestamp" }).notNull(),
  symbol: text().notNull(),
  price: real().notNull(),
  status: text({ enum: ["open", "close"] }),
  side: text({ enum: ["long", "short"] }),
}, (table) => ({
  clientOrderIdIndex: index("signal_client_order_id_index").on(table.clientOrderId),
  timestampIndex: index("signal_timestamp_index").on(table.timestamp)
}));

export const signalsInsertSchema = createInsertSchema(signalsTable, {
  timestamp: z.coerce.date(),
  price: z.coerce.number().positive(),
})

export const ordersTable = sqliteTable("order", {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
  clientOrderId: text("client_order_id"),
  response: text(),
}, (table) => ({
  clientOrderIdIndex: index("order_client_order_id_index").on(table.clientOrderId),
}));
