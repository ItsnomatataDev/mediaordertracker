import assert from "node:assert/strict";
import test from "node:test";
import { checkPhone, phoneFromFormData, splitPhone } from "./phone";
import { contactEmailSchema, emailSuggestion } from "./contact-email";
import { createJobSchema, guestDetailsSchema } from "./validation";

test("normalizes local and international numbers without losing significant zeros", () => {
  for (const number of ["078 120 2592", "781202592", "+263 78 120 2592", "00263781202592", "263781202592"]) {
    assert.deepEqual(checkPhone("263", number), { value: "+263781202592", error: "" });
  }
  assert.equal(checkPhone("27", "0821234567").value, "+27821234567");
  assert.equal(checkPhone("39", "02 36618 300").value, "+390236618300");
  assert.deepEqual(splitPhone("+390236618300"), { country: "39", national: "0236618300" });
});

test("rejects invalid numbers and country mismatches", () => {
  for (const number of ["123", "000000000", "abc", "0781202592 ext 5", "+27821234567"]) {
    assert.ok(checkPhone("263", number).error);
  }
  assert.ok(checkPhone("999", "781202592").error);
  assert.equal(checkPhone("263", "").error, "");
});

test("both server schemas reject invalid phone input even with a valid email", () => {
  const details = { guestName: "Test Guest", guestEmail: "guest@example.com", guestPhone: "", location: "ZHC", invoiceNumber: "" };
  for (const schema of [guestDetailsSchema, createJobSchema]) {
    assert.ok(schema.safeParse(details).success);
    for (const input of ["abc", "123", "+27821234567"]) {
      const form = new FormData();
      form.set("phoneCountry", "263");
      form.set("phoneNational", input);
      assert.equal(schema.safeParse({ ...details, guestPhone: phoneFromFormData(form) }).success, false);
    }
    assert.equal(schema.safeParse({ ...details, guestEmail: "" }).success, false);
    assert.ok(schema.safeParse({ ...details, guestEmail: "", guestPhone: "+263781202592" }).success);
  }
});

test("email validation trims spaces and suggestions do not silently rewrite addresses", () => {
  assert.equal(contactEmailSchema.parse(" guest@example.com "), "guest@example.com");
  assert.equal(contactEmailSchema.safeParse("guest@").success, false);
  assert.equal(contactEmailSchema.safeParse("guest name@gmail.com").success, false);
  assert.equal(emailSuggestion("Guest@GMAIL.CON"), "Guest@gmail.com");
  assert.equal(contactEmailSchema.parse("guest@gmail.con"), "guest@gmail.con");
  assert.equal(emailSuggestion("guest@company.co.zw"), null);
  assert.equal(emailSuggestion(""), null);
});
