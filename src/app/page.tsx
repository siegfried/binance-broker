import { eq } from "drizzle-orm/sql";
import { db } from "@/db";
import { accountsTable, signalsTable } from "@/db/schema";

export default async function Home() {
  const rows = await db.select().from(signalsTable).innerJoin(accountsTable, eq(signalsTable.accountId, accountsTable.id));
  return (
    <div className="border rounded-sm overflow-hidden">
      <table className="table-auto w-full">
        <thead className="bg-slate-100">
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
  );
}
