import { getExchangeInfo } from "@/binance/usdm"
import { refreshExchangeInfo } from "./actions";
import { ExchangeInfoView } from "./client";

export default async function Page() {
  const info = await getExchangeInfo(false);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2">
        <h1 className="text-xl font-bold">Exchange Info</h1>
        <form className="flex flex-row border divide-x rounded-sm text-sm overflow-hidden" action={refreshExchangeInfo}>
          <div className="p-2">Updated At</div>
          <div className="p-2 grow">{info.updatedAt.toLocaleString()}</div>
          <button className="p-2 bg-slate-100">Refresh</button>
        </form>
      </div>
      <ExchangeInfoView info={info?.info} />
    </div>
  )
}
