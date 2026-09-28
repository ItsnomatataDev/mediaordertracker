"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  splitPhone,
  checkPhone,
} from "@/lib/phone";

const LAST_COUNTRY_KEY = "matata.lastPhoneCountry";

function subscribeToCountry(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSavedCountry() {
  try {
    const saved = window.localStorage.getItem(LAST_COUNTRY_KEY);
    return PHONE_COUNTRIES.some((item) => item.code === saved) ? saved : null;
  } catch {
    return null;
  }
}

function getServerCountry() {
  return null;
}

export function PhoneField({
  label = "WhatsApp",
  defaultValue = "",
  rememberCountry = false,
}: {
  label?: string;
  defaultValue?: string;
  rememberCountry?: boolean;
}) {
  const inputId = useId();
  const parsed = splitPhone(defaultValue);
  const input = useRef<HTMLInputElement>(null);
  const [national, setNational] = useState(parsed.national);
  const [touched, setTouched] = useState(false);

  const [selectedCountry, setCountry] = useState<string | null>(null);
  const savedCountry = useSyncExternalStore(
    subscribeToCountry,
    getSavedCountry,
    getServerCountry,
  );
  const country = selectedCountry
    ?? (rememberCountry && !defaultValue ? savedCountry : null)
    ?? parsed.country
    ?? DEFAULT_PHONE_COUNTRY;

  const result = checkPhone(country, national);
  useEffect(() => {
    input.current?.setCustomValidity(result.error);
  }, [result.error]);

  return (
    <div className="w-full min-w-0">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <div className="phone-field-row">
        <select
          name="phoneCountry"
          value={country}
          onChange={(event) => {
            const value = event.target.value;

            setCountry(value);

            if (rememberCountry) {
              try {
                window.localStorage.setItem(LAST_COUNTRY_KEY, value);
              } catch {
                
              }
            }
          }}
          className="field phone-field-country"
          aria-label="Country code"
          autoComplete="tel-country-code"
        >
          {PHONE_COUNTRIES.map((item) => (
            <option
              key={`${item.iso}-${item.code}`}
              value={item.code}
            >
              {item.iso} +{item.code}
            </option>
          ))}
        </select>

        <input
          ref={input}
          onChange={(event) => setNational(event.target.value)}
          onBlur={() => setTouched(true)}
          onInvalid={() => setTouched(true)}
          aria-invalid={touched && Boolean(result.error)}
          id={inputId}
          type="tel"
          name="phoneNational"
          value={national}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={country === "263" ? "78 120 2592" : "Phone number"}
          aria-describedby={`${inputId}-hint ${inputId}-error`}
          className="field phone-field-number"
        />
      </div>
      <p id={`${inputId}-hint`} className="mt-1 text-xs text-muted">
        Select the country code, then enter the phone number.
      </p>
      <p id={`${inputId}-error`} aria-live="polite" className="mt-1 text-xs text-orange">
        {touched ? result.error : ""}
      </p>
    </div>
  );
}
