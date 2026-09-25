
"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  splitPhone,
} from "@/lib/phone";

const LAST_COUNTRY_KEY = "matata.lastPhoneCountry";

export function PhoneField({
  label = "WhatsApp",
  defaultValue = "",
  rememberCountry = false,
}: {
  label?: string;
  defaultValue?: string;
  rememberCountry?: boolean;
}) {
  const parsed = splitPhone(defaultValue);

  const [country, setCountry] = useState(
    parsed.country || DEFAULT_PHONE_COUNTRY
  );

  useEffect(() => {
    if (!rememberCountry || defaultValue) return;

    const saved = window.localStorage.getItem(LAST_COUNTRY_KEY);

    if (
      saved &&
      PHONE_COUNTRIES.some((item) => item.code === saved)
    ) {
      setCountry(saved);
    }
  }, [defaultValue, rememberCountry]);

  return (
    <label className="block w-full">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
      </span>

      <div className="flex w-full min-w-0">
        {/* Country code */}
        <select
          name="phoneCountry"
          value={country}
          onChange={(event) => {
            const value = event.target.value;

            setCountry(value);

            if (rememberCountry) {
              window.localStorage.setItem(
                LAST_COUNTRY_KEY,
                value
              );
            }
          }}
          className="field w-[7.5rem] min-w-[7.5rem] shrink-0 rounded-r-none"
          aria-label="Country code"
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

        {/* Phone number */}
        <input
          name="phoneNational"
          defaultValue={parsed.national}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="77 123 4567"
          className="field w-full min-w-0 flex-1 rounded-l-none"
        />
      </div>
    </label>
  );
}

