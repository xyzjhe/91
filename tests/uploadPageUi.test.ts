import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const uploadPageSource = readFileSync(
  new URL("../src/pages/UploadPage.tsx", import.meta.url),
  "utf8"
);
const layoutCss = readFileSync(
  new URL("../src/styles/layout.css", import.meta.url),
  "utf8"
);

function ruleBody(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `Expected CSS rule for ${selector}`);
  return match[1];
}

test("upload page uses a compact text-only submit button", () => {
  assert.match(uploadPageSource, /<SectionHeader title="上传视频" \/>/);
  assert.doesNotMatch(uploadPageSource, /本地视频会加入站内列表/);
  assert.match(uploadPageSource, /import \{ Check, UploadCloud \} from "lucide-react"/);
  assert.doesNotMatch(uploadPageSource, /\bFilm\b/);
  assert.match(
    uploadPageSource,
    /<button className="upload-submit" type="submit" disabled=\{!file \|\| saving\}>\s*\{saving \? "上传中" : "上传"\}\s*<\/button>/
  );

  const uploadActions = ruleBody(layoutCss, ".upload-actions");
  const uploadSubmit = ruleBody(layoutCss, ".upload-submit");
  assert.match(uploadActions, /justify-content\s*:\s*flex-end/);
  assert.match(uploadSubmit, /height\s*:\s*36px/);
  assert.match(uploadSubmit, /padding\s*:\s*0 var\(--space-4\)/);
  assert.doesNotMatch(uploadSubmit, /min-width/);
  assert.doesNotMatch(uploadSubmit, /gap\s*:/);
  assert.doesNotMatch(
    layoutCss,
    /\.upload-submit\s*\{[^}]*width\s*:\s*100%/s
  );
});
