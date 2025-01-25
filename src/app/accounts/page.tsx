import { db } from "@/db"
import { accountsTable } from "@/db/schema"
import Link from "next/link";
import { Modal } from "../client";
import { DelAccountForm, EditAccountForm, NewAccountForm } from "./client";
import { eq } from "drizzle-orm";
import { z } from "zod";

type ModalProps = { modal: "new" } | { modal: "edit" | "delete", id: string } | null | undefined;

async function AccountModal(props: { modalParams: ModalProps }) {
  const { modalParams } = props;

  if (!modalParams) return null;

  if (modalParams?.modal == "new") {
    return (<Modal>
      <h3 className="text-lg bg-slate-100 p-4 rounded-t">New Account</h3>
      <div className="p-4">
        <NewAccountForm />
      </div>
    </Modal>)
  }

  const idParsed = z.coerce.number().safeParse(modalParams?.id);
  if (!idParsed.success) return null;
  const account = (await db.select().from(accountsTable).where(eq(accountsTable.id, idParsed.data)))[0];
  if (!account) return null;

  if (modalParams.modal === "edit") {
    return (<Modal>
      <h3 className="text-lg bg-slate-100 p-4 rounded-t">Edit {account.name}</h3>
      <div className="p-4">
        <EditAccountForm account={account} />
      </div>
    </Modal>)
  } else {
    return (<Modal>
      <h3 className="text-lg bg-slate-100 p-4 rounded-t">Delete {account.name}</h3>
      <div className="p-4">
        <DelAccountForm account={account} />
      </div>
    </Modal>)
  }
}

function accountPath(modalParams: ModalProps): string {
  if (!modalParams) return "/accounts";
  if (modalParams.modal === "new") return "/accounts?modal=new";
  return `/accounts?modal=${modalParams.modal}&id=${modalParams.id}`;
}

type SearchParamProps = {
  searchParams: Promise<ModalProps>
};

export default async function Page({ searchParams }: SearchParamProps) {
  const modalParams = await searchParams;
  const accounts = await db.select().from(accountsTable);

  return (
    <div className="space-y-4">
      <div className="flex flex-row-reverse">
        <Link
          className="bg-slate-100 rounded-sm p-2"
          href={accountPath({ modal: "new" })}>
          New Account
        </Link>
        <AccountModal modalParams={modalParams} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div className="border rounded-sm p-4 space-y-2" key={account.id}>
            <h3 className="space-x-2">
              <span>{account.name}</span>
              <span className="p-1 border rounded-sm text-sm">{account.interval}</span>
            </h3>
            <div className="space-x-2 overflow-hidden text-sm text-ellipsis">
              <span>Budget:</span>
              <span className="font-semibold">{account.budget}</span> for each
            </div>
            <div className="space-x-2 overflow-hidden text-sm text-ellipsis">
              <span>ApiKey:</span>
              <span>{account.apiKey}</span>
            </div>
            <div className="flex flex-row-reverse space-x-2 space-x-reverse">
              <Link
                className="bg-slate-100 rounded-sm p-2 text-xs"
                href={accountPath({ modal: "delete", id: account.id.toString() })}>
                Delete
              </Link>
              <Link
                className="bg-slate-100 rounded-sm p-2 text-xs"
                href={accountPath({ modal: "edit", id: account.id.toString() })}>
                Edit Budget
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
