import { ExchangeInfoView } from "./client";

export default async function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Exchange Info</h1>
      <ExchangeInfoView />
    </div>
  )
}
