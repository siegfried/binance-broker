import { serializeError } from "serialize-error";

export type ErrorLog = {
  createdAt: Date,
  error: unknown,
}

export let errorLogs: ErrorLog[] = [];

export async function tryExec<T>(promise: Promise<T>) {
  try {
    return [true, await promise] as const;
  } catch (error) {
    return [false, serializeError(error)] as const;
  }
}

export async function tryAndLogError<T>(promise: Promise<T>) {
  const returned = await tryExec(promise);
  const [success, result] = returned;
  if (!success) {
    errorLogs.unshift({ createdAt: new Date(), error: result });
  }
  return returned;
}

export function resetErrorLogs() {
  errorLogs = [];
}

export function logError(error: unknown) {
  const serialized = serializeError(error);
  errorLogs.unshift({ createdAt: new Date(), error: serialized });
  return serialized;
}
