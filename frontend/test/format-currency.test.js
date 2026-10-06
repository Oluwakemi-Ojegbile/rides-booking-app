import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency } from "../src/utils/formatCurrency.js";

test("formats NGN values without fractional digits", () => {
  assert.match(formatCurrency(1500), /1,500/);
  assert.match(formatCurrency(), /0/);
});
