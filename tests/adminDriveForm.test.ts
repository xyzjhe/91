import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const drivesPageSource = readFileSync(
  new URL("../src/admin/DrivesPage.tsx", import.meta.url),
  "utf8"
);

test("spider91 drive form does not expose advanced crawler credentials", () => {
  assert.doesNotMatch(drivesPageSource, /target_new/);
  assert.doesNotMatch(drivesPageSource, /crawl_hour/);
  assert.doesNotMatch(drivesPageSource, /python_path/);
  assert.doesNotMatch(drivesPageSource, /script_path/);
});

test("spider91 upload target uses explicit local-save option instead of auto target", () => {
  assert.match(drivesPageSource, /本地保存，不上传/);
  assert.doesNotMatch(drivesPageSource, /自动：唯一/);
  assert.doesNotMatch(drivesPageSource, /自动模式/);
});
