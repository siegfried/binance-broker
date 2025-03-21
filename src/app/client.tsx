'use client'

import type { Account, OrderAttempt, Signal } from "@/db/schema";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clearErrorLogs, deleteOutdatedSignals, fetchSignals, processSignalsByIds, changeGlobalSettings, getGlobalSettings } from "./actions";
import { isExpired, ms } from "@/binance/usdm";
import { createPortal } from "react-dom";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { ErrorLog } from "@/error";
import { GlobalSettings } from "@/settings";

function Portal(props: { children: ReactNode }) {
  const { children } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, [])
  if (!mounted) return;
  const root = document.querySelector("#portal-root");
  if (!root) {
    console.error("No #portal-root found");
    return;
  };
  return createPortal(children, root);
}

export function Modal(props: { children: ReactNode, onCancel?: () => void }) {
  const { children, onCancel } = props;
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="md:w-3xl w-screen rounded-sm bg-white overflow-hidden">
          {onCancel && <div className="divide-y">
            <div className="flex flex-row justify-end bg-slate-100">
              <button
                onClick={onCancel}
                className="p-2 cursor-pointer">
                <XMarkIcon className="size-4" />
              </button>
            </div>
            {children}
          </div>}
          {!onCancel && children}
        </div>
      </div >
    </Portal>
  )
}

function OrderAttemptList(props: { orderAttempts: OrderAttempt[] }) {
  const [openIndex, setOpenIndex] = useState(0);
  const { orderAttempts } = props;
  if (orderAttempts.length <= 0) return (
    <div className="border rounded-sm p-4 text-lg text-center">No Order was made.</div>
  );
  return (
    <div className="space-y-2">
      {orderAttempts.map(({ id, status, result, createdAt }, index) =>
        <div key={id} onClick={() => setOpenIndex(index)} className="border rounded-sm divide-y overflow-hidden">
          <div className="p-2 flex flex-row justify-between">
            <div className={`font-bold text-${status === "SUCCESS" ? "green" : "red"}-500`}>{status}</div>
            <div>{createdAt.toLocaleString()}</div>
          </div>
          {openIndex === index && <div className="p-2">
            <code className="font-mono text-xs">
              <pre className="h-96 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </code>
          </div>}
        </div>)}
    </div>
  )
}

type DBRow = { signal: Signal, account: Account, orderAttempt: OrderAttempt | null };
const RowsContext = createContext<((rows: DBRow[]) => void)>(() => { });
type AggRow = { signal: Signal, account: Account, orderAttempts: OrderAttempt[] };
export function OrderAttemptView(props: AggRow & { className?: string, outdated: boolean }) {
  const { className, signal, orderAttempts, outdated } = props;
  const [modal, setModal] = useState(false);
  const setRows = useContext(RowsContext);
  const anySuccess = !!orderAttempts.find(({ status }) => status === "SUCCESS");
  const onRetry = useCallback(async () => {
    await processSignalsByIds([signal.id])
    const rows = await fetchSignals();
    setRows(rows);
  }, [setRows, signal.id])

  return (
    <>
      <button className={className} onClick={() => setModal(true)}>
        <span className={anySuccess ? "text-green-500" : "text-red-500"}>
          {orderAttempts.length}
        </span>
      </button>
      {modal && <Modal onCancel={() => setModal(false)}>
        <div className="p-4 space-y-2 text-sm">
          <OrderAttemptList orderAttempts={orderAttempts} />
          <div className="flex flex-row justify-end space-x-2">
            {!outdated && <button
              onClick={onRetry}
              className="p-2 bg-slate-100 rounded-sm disabled:text-gray-500">
              Retry
            </button>}
          </div>
        </div>
      </Modal>}
    </>
  )
}

function SignalsTable(props: { rows: AggRow[], outdated: boolean }) {
  const { rows, outdated } = props;
  if (rows.length <= 0) return;
  return (
    <div className="border rounded-sm overflow-hidden">
      <table className="table-auto w-full divide-y-1">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2">Symbol</th>
            <th className="p-2">Timestamp</th>
            <th className="p-2">Interval</th>
            <th className="p-2">Price</th>
            <th className="p-2">Type</th>
            <th className="p-2">Side</th>
            <th className="p-2">Account</th>
            <th className="p-2">Received At</th>
            <th className="p-2">Order</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(({ signal, account, orderAttempts }) => (<tr key={signal.id} className="divide-x">
            <td className="p-2">{signal.symbol}</td>
            <td className="p-2">{signal.timestamp.toISOString()}</td>
            <td className="p-2">{account.interval}</td>
            <td className="p-2 text-right">{signal.price}</td>
            <td className="p-2">{signal.type}</td>
            <td className="p-2">{signal.side}</td>
            <td className="p-2">{account.name}</td>
            <td className="p-2">{signal.createdAt.toLocaleString()}</td>
            <td>
              <OrderAttemptView
                className="w-full p-2 text-right"
                outdated={outdated}
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

export function SignalsView() {
  const [rows, setRows] = useState<DBRow[] | undefined>();
  const [time, setTime] = useState<Date | undefined>();
  const [tab, setTab] = useState<"current" | "outdated">("current");
  const groupedRows = useMemo(() => {
    if (!time) return;
    if (!rows) return;

    const aggRows =
      rows.reduce<Map<number, AggRow>>((acc, row) => {
        const { account, signal, orderAttempt } = row;
        const expired = isExpired(signal.timestamp, time, ms(account.interval));

        if (tab === "current" && expired) return acc;
        if (tab === "outdated" && !expired) return acc;

        if (!acc.has(signal.id)) {
          acc.set(signal.id, { signal, account, orderAttempts: [] });
        }
        if (orderAttempt) {
          acc.get(signal.id)!.orderAttempts.push(orderAttempt);
        }

        return acc;
      }, new Map())

    return Array.from(aggRows.values())
  }, [rows, tab, time]);

  useEffect(() => {
    fetchSignals().then(setRows);
  }, []);

  useEffect(() => {
    setTime(new Date());

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [])

  if (!time) return;
  if (!groupedRows) return;

  return (
    <div className="space-y-2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row space-x-2">
          <button
            onClick={() => setTab("current")}
            className={`p-2 border rounded-sm ${tab !== "current" && "bg-slate-100"}`}>
            Current
          </button>
          <button
            onClick={() => setTab("outdated")}
            className={`p-2 border rounded-sm ${tab !== "outdated" && "bg-slate-100"}`}>
            Outdated
          </button>
        </div>
        <div className="p-2 flex flex-row space-x-2 items-center">
          <ClockIcon className="size-4" />
          <span className="text-lg">{time?.toISOString()}</span>
        </div>
        <form action={deleteOutdatedSignals}>
          <button className="p-2 bg-slate-100 border rounded-sm">Clear Outdated</button>
        </form>
      </div>
      <RowsContext.Provider value={setRows}>
        <SignalsTable rows={groupedRows} outdated={tab === "outdated"} />
      </RowsContext.Provider>
    </div>
  )
}

export function ViewErrorsButton(props: { className?: string, children?: ReactNode, errorLogs: ErrorLog[] }) {
  const { className, children, errorLogs } = props;
  const [modal, setModal] = useState(false);
  const [openIndex, setOpenIndex] = useState(0);
  if (errorLogs.length <= 0) return;
  return (
    <>
      <button onClick={() => setModal(true)} className={className}>{children}</button>
      {modal && <Modal onCancel={() => setModal(false)}>
        <div className="p-4 text-xs space-y-4">
          <ul className="space-y-2">
            {errorLogs.map((errorLog, index) =>
              <li onClick={() => setOpenIndex(index)} className="border rounded-sm divide-y" key={index}>
                <div className="p-2 text-right">{errorLog.createdAt.toLocaleString()}</div>
                {openIndex === index && <div className="p-2">
                  <code className="font-mono">
                    <pre className="max-h-64 overflow-auto">{JSON.stringify(errorLog.error, null, 2)}</pre>
                  </code>
                </div>}
              </li>)}
          </ul>
          <form action={clearErrorLogs} className="flex flex-row justify-end">
            <button className="p-2 border rounded-sm bg-slate-100">Clear All</button>
          </form>
        </div>
      </Modal>}
    </>
  )
}

export function GlobalSettingsButton(props: { className?: string, children?: ReactNode }) {
  const { className, children } = props;
  const [modal, setModal] = useState(false);
  return (
    <>
      <button onClick={() => setModal(true)} className={className}>{children}</button>
      {modal && <Modal onCancel={() => setModal(false)}>
        <div className="p-4 space-y-4">
          <GlobalSettingsForm />
        </div>
      </Modal>}
    </>
  )
}

function GlobalSettingsForm() {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | undefined>();

  useEffect(() => {
    getGlobalSettings().then(setGlobalSettings)
  }, [])

  return (
    <form className="space-y-2" action={changeGlobalSettings}>
      <label className='block space-y-1'>
        <div>recvWindow</div>
        {globalSettings && <input
          className='block w-full border rounded-sm p-2'
          name='recvWindow'
          type='number'
          required
          min={1}
          defaultValue={globalSettings.recvWindow} />}
      </label>

      <div className="flex flex-row justify-end">
        <button className='block bg-slate-100 rounded-sm p-2' type='submit'>Update</button>
      </div>
    </form>
  )
}
