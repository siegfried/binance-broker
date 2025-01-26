import { FuturesExchangeInfo, USDMClient } from "binance";

type CachedExchangeInfo = { info: FuturesExchangeInfo, updatedAt: Date } | null

let exchangeInfo: CachedExchangeInfo = null;

export async function getExchangeInfo(refresh: boolean) {
  const client = new USDMClient();
  if (refresh || exchangeInfo === null) {
    const info = await client.getExchangeInfo();
    exchangeInfo = { info, updatedAt: new Date() };
  }
  return exchangeInfo;
}
