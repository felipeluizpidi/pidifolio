"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm({ disabledReason }: { disabledReason: string | null }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-10 w-full max-w-sm space-y-4">
      <label className="block">
        <span className="t-meta-sm mb-1.5 block text-ash">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          disabled={!!disabledReason}
          className="h-12 w-full border border-ivory/25 bg-transparent px-3 text-[15px] focus:border-orange focus:outline-none disabled:opacity-40"
        />
      </label>
      {(state?.error || disabledReason) && (
        <p role="alert" className="border border-red/60 bg-red/10 px-3 py-2 text-[13px] text-[#ff8a7a]">
          {state?.error ?? `Admin disabled: ${disabledReason} See README → “Admin setup”.`}
        </p>
      )}
      <button type="submit" disabled={pending || !!disabledReason} className="t-meta h-12 w-full bg-red text-ivory transition-colors hover:bg-orange disabled:opacity-40">
        {pending ? "Checking…" : "Enter the edit suite →"}
      </button>
    </form>
  );
}
