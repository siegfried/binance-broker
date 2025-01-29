import { eq } from "drizzle-orm/sql";
import { db } from "@/db";
import { Account, accountsTable, OrderAttempt, orderAttemptsTable, Signal, signalsTable } from "@/db/schema";
import Link from "next/link";
import { z } from "zod";
import { desc } from "drizzle-orm/expressions";
import { OrderAttemptView } from "./client";

function SignalView(props: { rows: { signal: Signal, account: Account, orderAttempts: OrderAttempt[] }[] }) {
  const rows = props.rows;
  return (
    <div className="border rounded-sm overflow-hidden">
      <table className="table-auto w-full">
        <thead className="bg-slate-100 border-b">
          <tr>
            <th className="p-2">Symbol</th>
            <th className="p-2">Timestamp</th>
            <th className="p-2">Price</th>
            <th className="p-2">Status</th>
            <th className="p-2">Side</th>
            <th className="p-2">Account</th>
            <th className="p-2">Order</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(({ signal, account, orderAttempts }) => (<tr key={signal.id} className="divide-x">
            <td className="p-2">{signal.symbol}</td>
            <td className="p-2">{signal.timestamp.toISOString()}</td>
            <td className="p-2 text-right">{signal.price}</td>
            <td className="p-2">{signal.status}</td>
            <td className="p-2">{signal.side}</td>
            <td className="p-2">{account.name}</td>
            <td>
              <OrderAttemptView
                className="w-full p-2 text-right"
                account={account}
                signal={signal}
                orderAttempts={orderAttempts} />
            </td>
          </tr>))}
        </tbody>
      </table>
    </div>
  )
}

function AccountFilterList(props: { accounts: Account[], accountId?: number }) {
  const { accounts, accountId } = props;
  if (accounts.length <= 0) return;
  return (
    <div className="flex flex-rows space-x-2 text-sm">
      <Link className={`p-2 rounded-sm border ${accountId && "bg-slate-100"}`} href={"/"}>All</Link>
      {accounts.map((account) => (
        <Link className={`p-2 rounded-sm border ${accountId !== account.id && "bg-slate-100"}`}
          href={`/?account_id=${account.id}`} key={account.id}>
          {account.name}
        </Link>
      ))}
    </div>
  )
}

export default async function Home({ searchParams }: { searchParams: Promise<{ account_id?: string }> }) {
  const { account_id } = await searchParams;
  const accountIdParsed = z.coerce.number().safeParse(account_id);
  let rowsQuery = db
    .select({ account: accountsTable, signal: signalsTable, orderAttempt: orderAttemptsTable })
    .from(signalsTable)
    .innerJoin(accountsTable, eq(signalsTable.accountId, accountsTable.id))
    .leftJoin(orderAttemptsTable, eq(signalsTable.clientOrderId, orderAttemptsTable.clientOrderId))
    .orderBy(desc(signalsTable.timestamp), desc(orderAttemptsTable.id))
    .$dynamic();
  if (account_id) {
    rowsQuery = rowsQuery.where(eq(accountsTable.id, parseInt(account_id)))
  }
  const rows = await rowsQuery;
  const aggRows = Object.values(
    rows.reduce<Record<number, { signal: Signal, account: Account, orderAttempts: OrderAttempt[] }>>((acc, row) => {
      const { account, signal, orderAttempt } = row;
      acc[signal.id] ??= { account, signal, orderAttempts: [] };
      if (orderAttempt)
        acc[signal.id].orderAttempts.push(orderAttempt);
      return acc;
    }, {}));
  const accounts = Object.values(aggRows.reduce<Record<number, Account>>((acc, { account }) => {
    acc[account.id] = account;
    return acc;
  }, {}))

  return (
    <div className="space-y-4 text-sm">
      <AccountFilterList accounts={accounts} accountId={accountIdParsed.data} />
      <SignalView rows={aggRows} />
    </div>
  );
}
