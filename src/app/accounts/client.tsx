'use client'

import Form from 'next/form';
import { createAccount, deleteAccount, fetchAccounts, updateAccount } from './actions';
import { ReactNode, useActionState, useEffect, useState } from 'react';
import type { Account } from '@/db/schema';
import { Modal } from '../client';

export function NewAccountButton(props: { className?: string, children: ReactNode }) {
  const { className, children } = props;
  const [modal, setModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setModal(true)}
        className={className}>
        {children}
      </button>
      {modal && <Modal onCancel={() => setModal(false)}>
        <div className="p-4 text-sm">
          <NewAccountForm />
        </div>
      </Modal>}
    </>
  )
}

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[] | undefined>();
  useEffect(() => {
    fetchAccounts().then(setAccounts);
  }, [])

  if (!accounts) return;
  return (
    <div className="grid grid-cols-3 gap-4">
      {accounts.map((account) => <AccountView key={account.id} account={account} />)}
    </div>
  )
}

export function AccountView(props: { account: Account }) {
  const { account } = props;
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);

  return (
    <div className="border rounded-sm p-4 space-y-2 text-sm" key={account.id}>
      <h3 className="space-x-2">
        <span>{account.name}</span>
        <span className="p-1 border rounded-sm">{account.interval}</span>
      </h3>
      <div className="space-x-2 overflow-hidden text-ellipsis">
        <span>Budget:</span>
        <span className="font-semibold">{account.budget}</span> for each
      </div>
      <div className="space-x-2 overflow-hidden text-ellipsis">
        <span>ApiKey:</span>
        <span>{account.apiKey}</span>
      </div>
      <div className="flex flex-row space-x-2 justify-end">
        <button
          onClick={() => setModal("edit")}
          className="bg-slate-100 border rounded-sm p-2">
          Edit
        </button>
        <button
          onClick={() => setModal("delete")}
          className="bg-slate-100 border rounded-sm p-2">
          Delete
        </button>
      </div>
      {modal === "edit" && <Modal onCancel={() => setModal(null)}>
        <div className="p-4 text-sm">
          <EditAccountForm account={account} />
        </div>
      </Modal>}
      {modal === "delete" && <Modal onCancel={() => setModal(null)}>
        <div className="p-4 text-sm">
          <DelAccountForm account={account} />
        </div>
      </Modal>}
    </div>
  )
}

function ErrorView(props: { errors?: string[] }) {
  if (!props.errors?.length) return;
  const errors = props.errors;
  return (
    <ul className='text-red-500 text-sm space-y-1'>
      {errors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  )
}

export function NewAccountForm() {
  const [state, formAction] = useActionState(createAccount, null)
  return (
    <Form className='space-y-2' action={formAction}>
      {state?.error && <div className='text-red-500 text-sm'>{state.error}</div>}
      <label className='block space-y-1'>
        <div>Name</div>
        <input className='block w-full border rounded-sm p-2' name='name' required />
        <ErrorView errors={state?.errors?.name} />
      </label>

      <label className='block space-y-1'>
        <div>Interval</div>
        <select className='block w-full border rounded-sm p-2' name='interval'>
          <option value="1d">1 Day</option>
          <option value="1h">1 Hour</option>
          <option value="15m">15 Minutes</option>
        </select>
        <ErrorView errors={state?.errors?.interval} />
      </label>

      <label className='block space-y-1'>
        <div>API Key</div>
        <input className='block w-full border rounded-sm p-2' name='api_key' required />
        <ErrorView errors={state?.errors?.apiKey} />
      </label>

      <label className='block space-y-1'>
        <div>Secret</div>
        <input className='block w-full border rounded-sm p-2' name='secret' required />
        <ErrorView errors={state?.errors?.secret} />
      </label>

      <label className='block space-y-1'>
        <div>Budget</div>
        <input className='block w-full border rounded-sm p-2' name='budget' type='number' required min={1} />
        <ErrorView errors={state?.errors?.budget} />
      </label>

      <div className="flex flex-row-reverse pt-4">
        <button className='block bg-slate-100 rounded-sm p-2' type='submit'>Create</button>
      </div>
    </Form>
  )
}

type EditAccountFormProps = {
  account: {
    id: number,
    budget: number,
  }
};

function EditAccountForm(props: EditAccountFormProps) {
  const [state, formAction] = useActionState(updateAccount, null);
  return (
    <Form className='space-y-2' action={formAction}>
      {state?.error && <div className='text-red-500 text-sm'>{state.error}</div>}
      <input type='hidden' name='id' value={props.account.id} />

      <label className='block space-y-1'>
        <div>Budget</div>
        <input className='block w-full border rounded-sm p-2'
          name='budget'
          type='number'
          required
          min={1}
          defaultValue={props.account.budget} />
        <ErrorView errors={state?.errors?.budget} />
      </label>

      <div className="flex flex-row-reverse pt-4">
        <button className='block bg-slate-100 rounded-sm p-2' type='submit'>Save</button>
      </div>
    </Form>
  )
}

type DelAccountFormProps = {
  account: {
    name: string,
  }
};

function DelAccountForm(props: DelAccountFormProps) {
  const [name, setName] = useState("");

  return (
    <Form className='space-y-2' action={deleteAccount}>
      <label className='block space-y-1'>
        <div>Confirm Name</div>
        <input
          className='block w-full border rounded-sm p-2'
          name='name'
          required
          onChange={(e) => setName(e.target.value)}
          value={name} />
      </label>

      <div className="flex flex-row-reverse space-x-2 space-x-reverse pt-4">
        <button
          className='block bg-slate-100 rounded-sm p-2 disabled:text-gray-500'
          type='submit'
          disabled={props.account.name !== name}>
          DELETE
        </button>
      </div>
    </Form>
  )
}
