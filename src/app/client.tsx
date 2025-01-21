'use client'

import { ReactNode } from "react";

export function Modal(props: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 bg-gray-500/50">
      <div className="max-w-3xl mx-auto mt-40 rounded bg-white">{props.children}</div>
    </div >
  )
}
