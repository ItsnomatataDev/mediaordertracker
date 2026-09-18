"use client";

import { useId, useState } from "react";

type SecretMode = "pin" | "totp" | "secret";

export function SecretField({
  name,
  label,
  autoComplete,
  required = true,
  hint,
  mode = "pin",
  defaultValue,
}: {
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  mode?: SecretMode;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const isPin = mode === "pin";
  const isTotp = mode === "totp";

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          inputMode={isTotp ? "numeric" : undefined}
          autoComplete={autoComplete}
          required={required}
          defaultValue={defaultValue}
          minLength={isPin ? 4 : isTotp ? 6 : 1}
          maxLength={isPin ? 128 : isTotp ? 6 : 128}
          pattern={isTotp ? "\\d{6}" : undefined}
          className={`field pr-20 ${isTotp ? "tracking-[0.35em]" : ""}`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-muted"
          onClick={() => setVisible((value) => !value)}
          aria-pressed={visible}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
