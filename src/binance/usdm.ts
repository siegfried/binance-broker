import { db } from "@/db";
import { Account, accountsTable, orderAttemptsTable, Signal, signalsTable } from "@/db/schema";
import { FuturesExchangeInfo, NewOrderResult, USDMClient } from "binance";
import { formatStep } from "./formatStep";
import { eq, inArray } from "drizzle-orm";
import { tryAndLogError, tryExec } from "@/error";
import { globalSettings } from "@/settings";

export function createClientByAccount(account: Account) {
  const api_key = account.apiKey;
  const api_secret = account.secret;
  const { recvWindow } = globalSettings;
  if (shouldUseTestnet()) {
    return new USDMClient({ api_key, api_secret, recvWindow, useTestnet: true, baseUrl: "https://testnet.binancefuture.com" });
  } else {
    return new USDMClient({ api_key, api_secret, recvWindow });
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
  return process.env.BINANCE_TESTNET! === "YES";
}

async function closePositionBySignal(client: USDMClient, signal: Signal, quantity: number) {
  if (signal.type !== "CLOSE") return;
  await handleOrder(signal, client.submitNewOrder({
    newClientOrderId: signal.clientOrderId,
    symbol: signal.symbol,
    type: "MARKET",
    side: signal.side === "LONG" ? "SELL" : "BUY",
    positionSide: signal.side,
    quantity,
  }));
};

async function closePositionsBySignals(client: USDMClient, signals: Signal[]) {
  const [success, positions] = await tryAndLogError(client.getPositionsV3());

  const tasks = success ? signals.reduce<Promise<void>[]>((tasks, signal) => {
    let quantity = positions
      .find((position) => position.symbol === signal.symbol && position.positionSide === signal.side)?.positionAmt;
    if (!quantity) return tasks;
    if (typeof quantity === "string") {
      quantity = parseFloat(quantity);
    }
    quantity = Math.abs(quantity); // Short positions return negative number.

    tasks.push(closePositionBySignal(client, signal, quantity));

    return tasks;
  }, []) : [];

  return Promise.allSettled(tasks);
};

async function openPositionBySignal(client: USDMClient, signal: Signal, price: number, quantity: number, interval: Interval) {
  if (signal.type !== "OPEN") return;
  await handleOrder(signal, client.submitNewOrder({
    newClientOrderId: signal.clientOrderId,
    symbol: signal.symbol,
    type: "LIMIT",
    side: signal.side === "LONG" ? "BUY" : "SELL",
    positionSide: signal.side,
    price,
    quantity,
    timeInForce: "GTD",
    goodTillDate: goodTillDate(signal.timestamp, ms(interval)),
  }));
};

function goodTillDate(timestamp: Date, durationInMs: number): number {
  return timestamp.getTime() + durationInMs;
}

export type Interval = "15m" | "1h" | "1d";

async function openPositionsBySignals(client: USDMClient, signals: Signal[], budget: number, interval: Interval) {
  const [success, result] = await tryAndLogError(getExchangeInfo(false));

  const tasks = success ? signals.reduce<Promise<void>[]>((tasks, signal) => {
    const { priceFilterStepMap, quantityFilterStepMap } = result;
    if (isExpired(signal.timestamp, new Date(), ms(interval))) return tasks;
    const priceStep = priceFilterStepMap.get(signal.symbol);
    if (!priceStep) return tasks;
    const quantityStep = quantityFilterStepMap.get(signal.symbol);
    if (!quantityStep) return tasks;
    const price = parseFloat(formatStep(signal.price, priceStep));
    const quantity = parseFloat(formatStep(budget / signal.price, quantityStep));

    tasks.push(openPositionBySignal(client, signal, price, quantity, interval));

    return tasks;
  }, []) : [];

  return Promise.allSettled(tasks);
};

async function takeProfitBySignal(client: USDMClient, signal: Signal, price: number, interval: Interval) {
  if (signal.type !== "TP") return;
  await handleOrder(signal, client.submitNewOrder({
    newClientOrderId: signal.clientOrderId,
    symbol: signal.symbol,
    type: "TAKE_PROFIT_MARKET",
    stopPrice: price,
    closePosition: "true",
    side: signal.side === "LONG" ? "SELL" : "BUY",
    positionSide: signal.side,
    timeInForce: "GTD",
    goodTillDate: goodTillDate(signal.timestamp, ms(interval)),
  }));
}

async function takeProfitBySignals(client: USDMClient, signals: Signal[], interval: Interval) {
  const [success, result] = await tryAndLogError(getExchangeInfo(false));

  const tasks = success ? signals.reduce<Promise<void>[]>((tasks, signal) => {
    const { priceFilterStepMap } = result;
    if (isExpired(signal.timestamp, new Date(), ms(interval))) return tasks;
    const priceStep = priceFilterStepMap.get(signal.symbol);
    if (!priceStep) return tasks;
    const price = parseFloat(formatStep(signal.price, priceStep));

    tasks.push(takeProfitBySignal(client, signal, price, interval));

    return tasks;
  }, []) : [];

  return Promise.allSettled(tasks);
}

export function ms(durationStr: Interval) {
  switch (durationStr) {
    case "15m": return 1000 * 60 * 15;
    case "1h": return 1000 * 60 * 60;
    case "1d": return 1000 * 60 * 60 * 24;
  }
}

export function isExpired(timestamp: Date, now: Date, durationInMs: number): boolean {
  return now.getTime() - timestamp.getTime() > durationInMs
}

type CategorizedSignals = {
  openSignals: Signal[],
  closeSignals: Signal[],
  takeProfitSignals: Signal[],
}
function categorizeSignals(signals: Signal[]) {
  return signals.reduce<CategorizedSignals>((result, signal) => {
    if (signal.type === "OPEN") result.openSignals.push(signal);
    if (signal.type === "CLOSE") result.closeSignals.push(signal);
    if (signal.type === "TP") result.takeProfitSignals.push(signal);
    return result;
  }, { openSignals: [], closeSignals: [], takeProfitSignals: [] })
}

export async function processSignals(client: USDMClient, signals: Signal[], budget: number, interval: Interval) {
  const { closeSignals, openSignals, takeProfitSignals } = categorizeSignals(signals);

  await Promise.allSettled([
    closePositionsBySignals(client, closeSignals),
    openPositionsBySignals(client, openSignals, budget, interval),
    takeProfitBySignals(client, takeProfitSignals, interval),
  ]);
}

export async function processSignalsByIds(ids: number[]) {
  const rows = await db
    .select()
    .from(signalsTable)
    .innerJoin(accountsTable, eq(signalsTable.accountId, accountsTable.id))
    .where(inArray(signalsTable.id, ids));

  const aggRows = rows.reduce<Record<number, { account: Account, signals: Signal[] }>>((acc, { account, signal }) => {
    acc[account.id] ??= { account, signals: [] };
    acc[account.id].signals.push(signal);
    return acc;
  }, {});

  const tasks = Object.values(aggRows).map(async ({ account, signals }) => {
    const client = createClientByAccount(account);
    await processSignals(client, signals, account.budget, account.interval);
  });

  await Promise.allSettled(tasks);
}

async function handleOrder(signal: Signal, order: Promise<NewOrderResult>) {
  const [success, result] = await tryExec(order);
  await db.insert(orderAttemptsTable).values({
    signalId: signal.id,
    clientOrderId: signal.clientOrderId,
    status: success ? "SUCCESS" : "FAILED",
    result,
  });
}
