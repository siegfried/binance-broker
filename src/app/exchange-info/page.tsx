import { getExchangeInfo } from "@/binance/usdm"
import { refreshExchangeInfo } from "./actions";

export default async function Page() {
  const { info, updatedAt } = await getExchangeInfo(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2">
        <h1 className="text-xl font-bold">Exchange Info</h1>
        <form className="flex flex-row border divide-x rounded-sm text-sm overflow-hidden" action={refreshExchangeInfo}>
          <div className="p-2">Updated At</div>
          <div className="p-2 grow">{updatedAt.toLocaleString()}</div>
          <button className="p-2 bg-slate-100">Refresh</button>
        </form>
      </div>
      <div className="p-4 border rounded-sm">
        <code className="text-xs font-mono">
          <pre>
            {JSON.stringify(info, null, 2)}
          </pre>
        </code>
      </div>
    </div>
  )
}
