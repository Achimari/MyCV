import { test } from "node:test";
import assert from "node:assert/strict";
import { buildForm, FORM_BARS, seeded } from "./music.ts";

test("один и тот же seed даёт одну и ту же форму", () => {
  assert.deepEqual(buildForm(42), buildForm(42));
  assert.notDeepEqual(buildForm(42), buildForm(43));
});

test("генератор в диапазоне [0, 1)", () => {
  const rnd = seeded(7);
  for (let i = 0; i < 1000; i++) {
    const v = rnd();
    assert.ok(v >= 0 && v < 1);
  }
});

test("32 такта, брейк в конце каждой половины, в брейке нет барабанов", () => {
  const form = buildForm(1);
  assert.equal(form.length, FORM_BARS);
  const breaks = form.flatMap((bar, i) => (bar.breakdown ? [i] : []));
  assert.deepEqual(breaks, [15, 31]);
  breaks.forEach((i) => assert.equal(form[i].drums, 0));
});

test("все удары внутри такта из восьми восьмых", () => {
  for (const bar of buildForm(99)) {
    for (const hit of [...bar.bass, ...bar.comp, ...bar.melody]) {
      assert.ok(hit.at >= 0 && hit.at < 8);
    }
  }
});
