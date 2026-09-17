"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initial: LoginState = {};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Work email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="field"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          className="field"
        />
      </label>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-black w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
