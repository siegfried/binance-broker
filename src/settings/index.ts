import { z } from "zod";

export const globalSettingsSchema = z.object({
  recvWindow: z.coerce.number().positive()
});

export type GlobalSettings = z.infer<typeof globalSettingsSchema>;

export let globalSettings: GlobalSettings = {
  recvWindow: 10000
}

export function updateGlobalSettings(settings: GlobalSettings) {
  globalSettings = settings
}
