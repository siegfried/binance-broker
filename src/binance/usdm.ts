import { db } from "@/db";
import { Account, orderAttemptsTable, Signal } from "@/db/schema";
import { FuturesExchangeInfo, USDMClient } from "binance";
import { formatStep } from "./formatStep";

export function createClientByAccount(account: Account) {
  const api_key = account.apiKey;
  const api_secret = account.secret;
  if (shouldUseTestnet()) {
    return new USDMClient({ api_key, api_secret, useTestnet: true, baseUrl: "https://testnet.binancefuture.com" });
  } else {
    return new USDMClient({ api_key, api_secret });
  }
}

export function createClient() {
  if (shouldUseTestnet()) {
    return new USDMClient({ useTestnet: true, baseUrl: "https://testnet.binancefuture.com" });
  } else {
    return new USDMClient();
  }
}

export type CachedExchangeInfo =
  | null
  | {
    info: FuturesExchangeInfo,
    priceFilterStepMap: Map<string, string>,
    quantityFilterStepMap: Map<string, string>,
    updatedAt: Date,
  }

let exchangeInfo: CachedExchangeInfo = null;

export async function getExchangeInfo(refresh: boolean) {
  const client = createClient();
  if (refresh || exchangeInfo === null) {
    const info = await client.getExchangeInfo();
    const priceFilterStepMap = new Map();
    const quantityFilterStepMap = new Map();
    info.symbols.forEach(({ symbol, status, filters }) => {
      if (status !== "TRADING") return;
      const tickSize = filters.find((filter) => filter.filterType === "PRICE_FILTER")?.tickSize;
      if (tickSize) priceFilterStepMap.set(symbol, tickSize);
      const stepSize = filters.find((filter) => filter.filterType === "LOT_SIZE")?.stepSize;
      if (stepSize) quantityFilterStepMap.set(symbol, stepSize);
    });
    exchangeInfo = { info, priceFilterStepMap, quantityFilterStepMap, updatedAt: new Date() };
  }
  return exchangeInfo;
}

export function shouldUseTestnet(): boolean {
  return process.env.BINANCE_TESTNET === "YES";
}

export async function closePositionBySignal(client: USDMClient, signal: Signal, quantity: number) {
  let result;
  let success;
  try {
    result = await client.submitNewOrder({
      newClientOrderId: signal.clientOrderId,
      symbol: signal.symbol,
      type: "MARKET",
      side: signal.side === "LONG" ? "SELL" : "BUY",
      positionSide: signal.side,
      quantity,
    });
    success = true;
  } catch (error) {
    result = error;
    success = false;
  }
  await db.insert(orderAttemptsTable).values({
    signalId: signal.id,
    clientOrderId: signal.clientOrderId,
    success,
    result,
  });
};

export async function closePositionsBySignals(client: USDMClient, signals: Signal[]) {
  const positions = await client.getPositionsV3();

  const tasks = signals.reduce<Promise<void>[]>((tasks, signal) => {
    let quantity = positions
      .find((position) => position.symbol === signal.symbol && position.positionSide === signal.side)?.positionAmt;
    if (!quantity) return tasks;
    if (typeof quantity === "string") {
      quantity = parseFloat(quantity);
    }
    quantity = Math.abs(quantity); // Short positions returns negative number.

    tasks.push(closePositionBySignal(client, signal, quantity));

    return tasks;
  }, []);

  return Promise.allSettled(tasks);
};

export async function openPositionBySignal(client: USDMClient, signal: Signal, price: number, quantity: number, interval: Interval) {
  let result;
  let success;
  try {
    result = await client.submitNewOrder({
      newClientOrderId: signal.clientOrderId,
      symbol: signal.symbol,
      type: "LIMIT",
      side: signal.side === "LONG" ? "BUY" : "SELL",
      positionSide: signal.side,
      price,
      quantity,
      timeInForce: "GTD",
      goodTillDate: goodTillDate(signal.timestamp, ms(interval)),
    });
    success = true;
  } catch (error) {
    result = error;
    success = false;
  }
  await db.insert(orderAttemptsTable).values({
    signalId: signal.id,
    clientOrderId: signal.clientOrderId,
    success,
    result,
  });
};

function goodTillDate(timestamp: Date, durationInMs: number): number {
  return timestamp.getTime() + durationInMs;
}

export type Interval = "15m" | "1h" | "1d";

export async function openPositionsBySignals(client: USDMClient, signals: Signal[], budget: number, interval: Interval) {
  const { priceFilterStepMap, quantityFilterStepMap } = await getExchangeInfo(false);

  const tasks = signals.reduce<Promise<void>[]>((tasks, signal) => {
    if (isExpired(signal.timestamp, ms(interval))) return tasks;
    const priceStep = priceFilterStepMap.get(signal.symbol);
    if (!priceStep) return tasks;
    const quantityStep = quantityFilterStepMap.get(signal.symbol);
    if (!quantityStep) return tasks;
    const price = parseFloat(formatStep(signal.price, priceStep));
    const quantity = parseFloat(formatStep(budget / signal.price, quantityStep));

    tasks.push(openPositionBySignal(client, signal, price, quantity, interval));

    return tasks;
  }, []);

  return Promise.allSettled(tasks);
};

export function ms(durationStr: Interval) {
  switch (durationStr) {
    case "15m": return 1000 * 60 * 15;
    case "1h": return 1000 * 60 * 60;
    case "1d": return 1000 * 60 * 60 * 24;
  }
}

export function isExpired(timestamp: Date, durationInMs: number): boolean {
  const now = new Date();
  return now.getTime() - timestamp.getTime() > durationInMs
}

export async function processSignals(client: USDMClient, signals: Signal[], budget: number, interval: Interval) {
  const openSignals = signals.filter((signal) => signal.status === "OPEN");
  const closeSignals = signals.filter((signal) => signal.status === "CLOSE");

  await Promise.allSettled([
    closePositionsBySignals(client, closeSignals),
    openPositionsBySignals(client, openSignals, budget, interval),
  ]);
}
