'use client'

import type { Account, OrderAttempt, Signal } from "@/db/schema";
import { ReactNode, useEffect, useState } from "react";
import { handleSignals } from "./accounts/actions";
import { isExpired, ms } from "@/binance/usdm";
import { createPortal } from "react-dom";

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

export function Modal(props: { children: ReactNode }) {
  const { children } = props;
  return (
    <Portal>
      <div className="absolute inset-0 bg-black/50">
        <div className="max-w-3xl mx-auto mt-20 rounded-sm bg-white overflow-hidden">{children}</div>
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
      {orderAttempts.map(({ id, success, result, createdAt }, index) =>
        <div key={id} onClick={() => setOpenIndex(index)} className="border rounded-sm divide-y overflow-hidden">
          <div className="p-2 flex flex-row justify-between">
            {success && <div className="font-bold text-green-500">SUCCEED</div>}
            {!success && <div className="font-bold text-red-500">FAILED</div>}
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

export function OrderAttemptView(props: { className?: string, account: Account, signal: Signal, orderAttempts: OrderAttempt[] }) {
  const { className, account, signal, orderAttempts } = props;
  const [show, setShow] = useState(false);
  const anySuccess = !!orderAttempts.find(({ success }) => success);
  return (
    <>
      <button className={className} onClick={() => setShow(true)}>
        <span className={anySuccess ? "text-green-500" : "text-red-500"}>
          {orderAttempts.length}
        </span>
      </button>
      {show && <Modal>
        <div className="p-4 space-y-2">
          <OrderAttemptList orderAttempts={orderAttempts} />
          <div className="flex flex-row justify-end space-x-2">
            <form action={handleSignals}>
              <input name="id" type="hidden" value={signal.id} />
              <button
                className="p-2 bg-slate-100 rounded-sm disabled:text-gray-500"
                disabled={isExpired(signal.timestamp, ms(account.interval))}>
                Retry
              </button>
            </form>
            <button className="p-2 bg-slate-100 rounded-sm" onClick={() => setShow(false)}>Cancel</button>
          </div>
        </div>
      </Modal>}
    </>
  )
}
