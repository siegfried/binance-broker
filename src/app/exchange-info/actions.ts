'use server'

import { getExchangeInfo } from "@/binance/usdm";
import { redirect } from "next/navigation";

export async function refreshExchangeInfo() {
  await getExchangeInfo(true);
  redirect("/exchange-info");
}
