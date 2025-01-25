import { eq } from "drizzle-orm/sql";
import { db } from "@/db";
import { accountsTable, signalsTable } from "@/db/schema";
import Link from "next/link";
import { z } from "zod";
import { desc } from "drizzle-orm/expressions";

type SignalViewProps = {
  rows: {
    signal: typeof signalsTable.$inferSelect,
    account: typeof accountsTable.$inferSelect,
  }[]
};

function SignalView(props: SignalViewProps) {
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
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(({ signal, account }) => (<tr key={signal.id} className="divide-x">
            <td className="p-2">{signal.symbol}</td>
            <td className="p-2">{signal.timestamp.toISOString()}</td>
            <td className="p-2">{signal.price}</td>
            <td className="p-2">{signal.status}</td>
            <td className="p-2">{signal.side}</td>
            <td className="p-2">{account.name}</td>
          </tr>))}
        </tbody>
      </table>
    </div>
  )
}

function AccountFilterList(props: { accounts: typeof accountsTable.$inferSelect[], accountId?: number }) {
  const { accounts, accountId } = props;
  if (accounts.length <= 0) return;
  return (
    <div className="flex flex-rows space-x-2">
      <Link className={`p-2 rounded-sm ${accountId && "bg-slate-100"}`} href={"/"}>All</Link>
      {accounts.map((account) => (
        <Link className={`p-2 rounded-sm ${accountId !== account.id && "bg-slate-100"}`}
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
    .select()
    .from(accountsTable)
    .innerJoin(signalsTable, eq(signalsTable.accountId, accountsTable.id))
    .orderBy(desc(signalsTable.timestamp))
    .$dynamic();
  if (account_id) {
    rowsQuery = rowsQuery.where(eq(accountsTable.id, parseInt(account_id)))
  }
  const rows = await rowsQuery;
  const accounts = rows.reduce((acc, row) => {
    const { account } = row;
    acc.set(account.id, account);
    return acc;
  }, new Map<number, typeof accountsTable.$inferSelect>()).values();
  return (
    <div className="space-y-4">
      <AccountFilterList accounts={Array.from(accounts)} accountId={accountIdParsed.data} />
      <SignalView rows={rows} />
    </div>
  );
}
