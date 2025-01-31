import { AccountsList, NewAccountButton } from "./client";

export default async function Page() {
  return (
    <div className="space-y-4">
      <div className="flex flex-row-reverse">
        <NewAccountButton
          className="bg-slate-100 border rounded-sm p-2">
          New Account
        </NewAccountButton>
      </div>
      <AccountsList />
    </div>
  )
}
