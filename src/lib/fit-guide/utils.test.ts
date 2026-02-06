import test from "node:test";
import assert from "node:assert/strict";
import {
  areSameSizeSet,
  canonicalizeSizeLabel,
  metricToInText,
  normalizeMetric,
  normalizeRows,
  normalizeSizeList,
} from "./utils";

test("normalizeMetric rounds single numeric values with Math.round", () => {
  const down = normalizeMetric("52.3");
  const up = normalizeMetric("52.6");

  assert.equal(down?.min_cm, 52);
  assert.equal(down?.max_cm, 52);
  assert.equal(up?.min_cm, 53);
  assert.equal(up?.max_cm, 53);
});

test("normalizeMetric parses ranges and separators", () => {
  const dash = normalizeMetric("58-62");
  const textA = normalizeMetric("58 a 62");
  const enDash = normalizeMetric("58-62".replace("-", "–"));
  const single = normalizeMetric("58");

  assert.deepEqual(
    [dash?.min_cm, dash?.max_cm, textA?.min_cm, textA?.max_cm],
    [58, 62, 58, 62]
  );
  assert.deepEqual([enDash?.min_cm, enDash?.max_cm], [58, 62]);
  assert.deepEqual([single?.min_cm, single?.max_cm], [58, 58]);
});

test("normalizeMetric converts inches to cm with integer rounding", () => {
  const metric = normalizeMetric("20-22", "in");
  assert.deepEqual([metric?.min_cm, metric?.max_cm], [51, 56]);
});

test("metricToInText outputs integer inches without decimals", () => {
  const inches = metricToInText({
    min_cm: 52,
    max_cm: 53,
    raw: "52-53",
    confidence: 1,
  });

  assert.equal(inches, "20-21");
});

test("canonicalize and normalize sizes with aliases", () => {
  assert.equal(canonicalizeSizeLabel("xxl"), "2XL");
  assert.equal(canonicalizeSizeLabel("xxxl"), "3XL");
  assert.equal(canonicalizeSizeLabel("XS / S"), "XS/S");
  assert.equal(canonicalizeSizeLabel("2XL (40)"), "2XL");
  assert.equal(canonicalizeSizeLabel("S (30)"), "S");

  const normalized = normalizeSizeList(["xxl", "M", "S", "3X", "XS / S", "M"]);
  assert.deepEqual(normalized, ["XS/S", "S", "M", "2XL", "3XL"]);
});

test("areSameSizeSet compares canonicalized sets", () => {
  assert.equal(
    areSameSizeSet(["xxl", "s", "m"], ["2XL", "M", "S"]),
    true
  );
  assert.equal(areSameSizeSet(["S", "M"], ["S", "L"]), false);
});

test("normalizeRows warns on non-monotonic metrics", () => {
  const normalized = normalizeRows(
    [
      { size: "S", waist: "60-62" },
      { size: "M", waist: "58-60" },
      { size: "L", waist: "64-66" },
    ],
    { assumedUnit: "cm" }
  );

  assert.equal(normalized.status, "draft");
  assert.ok(
    normalized.warnings.some((warning) =>
      warning.includes("Possible non-monotonic values detected")
    )
  );
});

test("normalizeRows warns on suspicious non-body scales", () => {
  const normalized = normalizeRows(
    [
      { size: "S", pant: "8" },
      { size: "M", pant: "10" },
      { size: "L", pant: "12" },
    ],
    { assumedUnit: "cm" }
  );

  assert.ok(
    normalized.warnings.some((warning) =>
      warning.includes("looks like non-body sizing")
    )
  );
});

test("normalizeRows fails when no valid rows are extracted", () => {
  const normalized = normalizeRows([], { assumedUnit: "cm" });
  assert.equal(normalized.status, "failed");
  assert.ok(
    normalized.warnings.some((warning) =>
      warning.includes("No valid rows were extracted")
    )
  );
});
