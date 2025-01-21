'use client'

import Form from 'next/form';
import { createAccount, deleteAccount, updateAccount } from './actions';
import { useActionState, useState } from 'react';
import Link from 'next/link';

function ErrorView(props: { errors?: string[] }) {
  if (!props.errors?.length) return;
  const errors = props.errors;
  return (
    <ul className='text-red text-sm space-y-1'>
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
        <input className='block w-full border rounded p-2' name='name' required />
        <ErrorView errors={state?.errors?.name} />
      </label>

      <label className='block space-y-1'>
        <div>API Key</div>
        <input className='block w-full border rounded p-2' name='api_key' required />
        <ErrorView errors={state?.errors?.apiKey} />
      </label>

      <label className='block space-y-1'>
        <div>Secret</div>
        <input className='block w-full border rounded p-2' name='secret' required />
        <ErrorView errors={state?.errors?.secret} />
      </label>

      <label className='block space-y-1'>
        <div>Budget</div>
        <input className='block w-full border rounded p-2' name='budget' type='number' required min={1} />
        <ErrorView errors={state?.errors?.budget} />
      </label>

      <div className="flex flex-row-reverse pt-4">
        <Link className='block bg-slate-100 rounded p-2 ml-4' href={"/accounts"}>Cancel</Link>
        <button className='block bg-slate-100 rounded p-2' type='submit'>Create</button>
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

export function EditAccountForm(props: EditAccountFormProps) {
  const [state, formAction] = useActionState(updateAccount, null);
  return (
    <Form className='space-y-2' action={formAction}>
      {state?.error && <div className='text-red-500 text-sm'>{state.error}</div>}
      <input type='hidden' name='id' value={props.account.id} />

      <label className='block space-y-1'>
        <div>Budget</div>
        <input className='block w-full border rounded p-2'
          name='budget'
          type='number'
          required
          min={1}
          defaultValue={props.account.budget} />
        <ErrorView errors={state?.errors?.budget} />
      </label>

      <div className="flex flex-row-reverse pt-4">
        <Link className='block bg-slate-100 rounded p-2 ml-4' href={"/accounts"}>Cancel</Link>
        <button className='block bg-slate-100 rounded p-2' type='submit'>Save</button>
      </div>
    </Form>
  )
}

type DelAccountFormProps = {
  account: {
    name: string,
  }
};

export function DelAccountForm(props: DelAccountFormProps) {
  const [name, setName] = useState("");

  return (
    <Form className='space-y-2' action={deleteAccount}>
      <label className='block space-y-1'>
        <div>Confirm Name</div>
        <input
          className='block w-full border rounded p-2'
          name='name'
          required
          onChange={(e) => setName(e.target.value)}
          value={name} />
      </label>

      <div className="flex flex-row-reverse space-x-2 space-x-reverse pt-4">
        <Link className='block bg-slate-100 rounded p-2' href={"/accounts"}>Cancel</Link>
        <button
          className='block bg-slate-100 rounded p-2 disabled:text-gray-500'
          type='submit'
          disabled={props.account.name !== name}>
          DELETE
        </button>
      </div>
    </Form>
  )
}
