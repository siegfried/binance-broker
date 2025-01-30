import { db } from "@/db"
import { accountsTable } from "@/db/schema"
import { AccountView, NewAccountButton } from "./client";

export default async function Page() {
  const accounts = await db.select().from(accountsTable);

  return (
    <div className="space-y-4">
      <div className="flex flex-row-reverse">
        <NewAccountButton
          className="bg-slate-100 border rounded-sm p-2">
          New Account
        </NewAccountButton>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {accounts.map((account) => <AccountView key={account.id} account={account} />)}
      </div>
    </div>
  )
}
