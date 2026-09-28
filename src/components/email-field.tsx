"use client";

import { useId, useRef, useState } from "react";
import { contactEmailSchema, emailSuggestion } from "@/lib/contact-email";

export function EmailField({ defaultValue = "" }: { defaultValue?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [touched, setTouched] = useState(false);
  const error = !contactEmailSchema.safeParse(value).success;
  const suggestion = touched ? emailSuggestion(value) : null;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">Email</label>
      <input
        ref={input}
        id={id}
        name="guestEmail"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          event.target.setCustomValidity(contactEmailSchema.safeParse(event.target.value).success ? "" : "Enter a valid email, for example name@gmail.com");
        }}
        onBlur={() => {
          setTouched(true);
          setValue(value.trim());
        }}
        onInvalid={() => setTouched(true)}
        aria-invalid={touched && error}
        aria-describedby={`${id}-help`}
        className="field"
      />
      <div id={`${id}-help`} aria-live="polite" className="mt-1 text-sm">
        {touched && error ? <p className="text-orange">Enter a valid email, for example name@gmail.com.</p> : null}
        {suggestion ? (
          <p>Did you mean <button type="button" className="font-medium text-orange underline" onClick={() => {
            if (input.current) {
              input.current.value = suggestion;
              input.current.setCustomValidity("");
              input.current.focus();
            }
            setValue(suggestion);
          }}>{suggestion}</button>? Select it to correct the address.</p>
        ) : null}
      </div>
    </div>
  );
}
