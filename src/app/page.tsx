'use server'

import { SignalsView } from "./client";

export default async function Home() {
  return (
    <div className="space-y-4 text-sm">
      <SignalsView />
    </div>
  );
}
