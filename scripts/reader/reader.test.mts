import test from "node:test";
import assert from "node:assert/strict";
import {
  pdfPage,
  pageFromHash,
  safePdfLink,
  renderDensity,
} from "../../src/lib/reader/pdf.ts";
test("pagine da input o destinazione restano nei confini del documento", () => {
  for (const [input, expected] of [
    [0, 1],
    [-8, 1],
    [4.9, 4],
    [999, 60],
    [NaN, 1],
    [Infinity, 1],
    ["5", 5],
  ] as const)
    assert.equal(pdfPage(input, 60), expected);
  assert.equal(pdfPage(9, 0), 1);
});
test("link a una pagina, hash vuoti o alterati hanno un esito deterministico", () => {
  assert.equal(pageFromHash("#page=37", 60), 37);
  assert.equal(pageFromHash("", 60), 1);
  assert.equal(pageFromHash("#page=bad", 60), 1);
  assert.equal(pageFromHash("#page=999", 60), 60);
});
test("i link del PDF non possono eseguire schemi attivi o aprire file locali", () => {
  for (const link of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "//example.com",
    null,
  ])
    assert.equal(safePdfLink(link), null);
  assert.equal(
    safePdfLink("https://example.org/a#b"),
    "https://example.org/a#b",
  );
  assert.equal(
    safePdfLink("mailto:info@example.org"),
    "mailto:info@example.org",
  );
});
test("densità retina e zoom mantengono il limite dei pixel della pagina", () => {
  assert.equal(renderDensity(500, 800, 3), 2);
  assert.ok(3000 * 4000 * renderDensity(3000, 4000, 2) ** 2 <= 6_000_001);
  assert.ok(Number.isFinite(renderDensity(0, 0, 0)));
});
