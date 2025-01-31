'use client'

import { useEffect, useState } from "react";
import { getExchangeInfo } from "./actions";
import { CachedExchangeInfo } from "@/binance/usdm";

export function ExchangeInfoView() {
  const [type, setType] = useState<"source" | "filter">("source");
  const [cachedInfo, setCachedInfo] = useState<CachedExchangeInfo | undefined>();
  useEffect(() => {
    getExchangeInfo(false).then(setCachedInfo)
  }, []);

  if (!cachedInfo) return;
  const { info, updatedAt } = cachedInfo;

  return (
    <div className="space-y-2">
      <div className="flex flex-row justify-between text-sm">
        <div className="flex flex-row space-x-2">
          <button
            className={`p-2 border rounded-sm ${type !== "source" && "bg-slate-100"}`}
            onClick={() => setType("source")}>
            Source
          </button>
          <button
            className={`p-2 border rounded-sm ${type !== "filter" && "bg-slate-100"}`}
            onClick={() => setType("filter")}>
            Filter
          </button>
        </div>
        <div className="flex flex-row border divide-x rounded-sm overflow-hidden">
          <div className="p-2">Updated At</div>
          <div className="p-2 grow">{updatedAt.toLocaleString()}</div>
          <button
            className="p-2 bg-slate-100"
            onClick={() => getExchangeInfo(true).then(setCachedInfo)}>
            Refresh
          </button>
        </div>
      </div>
      <div className="border rounded-sm">
        {type === "source" && <div className="p-4 text-xs font-mono">
          <code>
            <pre>
              {JSON.stringify(info, null, 2)}
            </pre>
          </code>
        </div>}
        {type === "filter" && <table className="table-auto w-full">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="p-2">Symbol</th>
              <th className="p-2">Type</th>
              <th className="p-2">Status</th>
              <th className="p-2">Price Step</th>
              <th className="p-2">Quantity Step</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {info.symbols.map((symbol) => (
              <tr className="divide-x" key={symbol.symbol}>
                <td className="p-2">{symbol.symbol}</td>
                <td className="p-2">{symbol.contractType}</td>
                <td className="p-2">{symbol.status}</td>
                <td className="p-2 text-right">{symbol.filters.find((f) => f.filterType === "PRICE_FILTER")?.tickSize}</td>
                <td className="p-2 text-right">{symbol.filters.find((f) => f.filterType === "LOT_SIZE")?.stepSize}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  )
}
