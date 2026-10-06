"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  splitPhone,
  checkPhone,
  findPhoneCountry,
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
  const countryInput = useRef<HTMLInputElement>(null);
  const [countryQuery, setCountryQuery] = useState<string | null>(null);
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

  const countryError = country ? "" : "Choose a country suggestion or enter a valid country code.";
  const result = checkPhone(country, national);
  useEffect(() => {
    input.current?.setCustomValidity(result.error);
    countryInput.current?.setCustomValidity(countryError);
  }, [result.error, countryError]);

  return (
    <div className="w-full min-w-0">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>

      <div className="phone-field-row">
        <input type="hidden" name="phoneCountry" value={country} />
        <input
          ref={countryInput}
          type="text"
          list={`${inputId}-countries`}
          value={countryQuery ?? `+${country}`}
          onChange={(event) => {
            const query = event.target.value;
            const match = findPhoneCountry(query);
            setCountryQuery(query);
            setCountry(match?.code ?? "");
            if (rememberCountry && match) {
              try {
                window.localStorage.setItem(LAST_COUNTRY_KEY, match.code);
              } catch {
                // The field still works when storage is unavailable.
              }
            }
          }}
          onBlur={() => setTouched(true)}
          onInvalid={() => setTouched(true)}
          className="field phone-field-country"
          aria-label="Country or dialing code"
          aria-describedby={`${inputId}-hint ${inputId}-error`}
          aria-invalid={touched && Boolean(countryError)}
          autoComplete="off"
          placeholder="Country / +code"
        />
        <datalist id={`${inputId}-countries`}>
          {PHONE_COUNTRIES.map((item) => (
            <option key={item.iso} value={`${item.label} (+${item.code})`}>
              {item.iso}
            </option>
          ))}
        </datalist>

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
        Not sure of the code? Type a country name or dialing code (e.g. +263) and choose a suggestion, then enter the phone number.
      </p>
      <p id={`${inputId}-error`} aria-live="polite" className="mt-1 text-xs text-orange">
        {touched ? countryError || result.error : ""}
      </p>
    </div>
  );
}
