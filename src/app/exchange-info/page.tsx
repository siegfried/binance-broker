import { getExchangeInfo } from "@/binance/usdm"
import { refreshExchangeInfo } from "./actions";

export default async function Page() {
  const { info, updatedAt } = await getExchangeInfo(false);
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Exchange Info</h1>
      <div className="flex flex-row justify-between">
        <div>Updated at: {updatedAt.toLocaleString()}</div>
        <form action={refreshExchangeInfo}>
          <button className="p-2 bg-slate-100 rounded-sm">Refresh</button>
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
