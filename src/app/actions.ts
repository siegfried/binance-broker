import { processSignalsByIds } from "@/binance/usdm";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function handleSignals(formData: FormData) {
  const idsParsed = z.array(z.coerce.number()).safeParse(formData.getAll("id"));
  if (!idsParsed.success) redirect("/");
  processSignalsByIds(idsParsed.data);
  redirect("/");
}
