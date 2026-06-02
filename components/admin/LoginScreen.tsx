"use client";

import { useActionState } from "react";
import { Logo } from "@/components/Logo";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

export function LoginScreen() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAdmin,
    {}
  );

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <form
          action={formAction}
          className="rounded-3xl border border-black/5 bg-white p-8 shadow-xl shadow-black/[0.03]"
        >
          <h1 className="text-xl font-bold text-ink">Panel del coordinador</h1>
          <p className="mt-1 text-sm text-ink/55">
            Ingresa la contraseña para administrar el contenido.
          </p>

          <label
            htmlFor="password"
            className="mt-6 mb-2 block text-sm font-medium text-ink/70"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            required
            className="h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-base text-ink shadow-sm outline-none transition focus:border-bni focus:ring-2 focus:ring-bni/20"
          />

          {state.error && (
            <p className="mt-2 text-sm text-bni">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 h-12 w-full rounded-xl bg-bni text-base font-semibold text-white shadow-sm transition hover:bg-bni-dark disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
