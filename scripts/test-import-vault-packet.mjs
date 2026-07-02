import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const tempDir = await mkdtemp(path.join(os.tmpdir(), "contentflow-vault-import-"));
const inputDir = path.join(tempDir, "contentflow-import");
const reviewDir = path.join(tempDir, "packet-reviews");
const inputPath = path.join(inputDir, "2026-07-01.json");
const reviewPath = path.join(reviewDir, "2026-07-01.json");
const scriptPath = path.resolve("scripts/import-vault-packet.mjs");

try {
  const firstImportText = await writeImport({
    topicTitle: "AI窗口别开太多",
    videoTitle: "AI窗口别开太多",
    videoDescription: "第一版简介",
    scriptMarkdown: "第一版口播稿",
    thumbnailNote: "第一版封面",
    notes: "第一版备注",
    shootingFormats: ["talking"],
  }, { crlf: true });
  await writeReview({
    status: "needs-manual-review",
    score: 0.42,
    minScore: 0.85,
    focusCluster: { label: "AI 多窗口认知负荷" },
    issues: [
      { severity: "error", message: "正文漂移，需要重写。" },
      { severity: "warning", message: "hook 兑现不够快。" },
    ],
  });

  const first = await runImport();
  assert.equal(first.imported, "created");
  assert.match(first.sourceHash, /^[a-f0-9]{64}$/u);
  assert.equal(first.sourceHash, sha256(normalizeHashInput(firstImportText)));

  const videos = await readJson("videos.json");
  videos[0].status = "filming";
  videos[0].statusHistory.push({ status: "filming", changedAt: "2026-07-01T09:00:00.000Z" });
  await writeDataJson("videos.json", videos);

  await writeImport({
    topicTitle: "AI窗口别开太多",
    videoTitle: "AI窗口别开太多",
    videoDescription: "修复后的简介",
    scriptMarkdown: "修复后的口播稿",
    thumbnailNote: "修复后的封面",
    notes: "修复后的备注",
    shootingFormats: ["talking"],
  });

  const second = await runImport();
  assert.equal(second.imported, "updated");
  assert.match(second.sourceHash, /^[a-f0-9]{64}$/u);
  assert.notEqual(second.sourceHash, first.sourceHash);

  const [updatedVideos, scripts] = await Promise.all([
    readJson("videos.json"),
    readJson("scripts.json"),
  ]);
  const scriptMarkdown = await readFile(path.join(tempDir, "scripts", `${scripts[0].id}.md`), "utf8");

  assert.equal(updatedVideos.length, 1);
  assert.equal(updatedVideos[0].status, "filming");
  assert.equal(updatedVideos[0].description, "修复后的简介");
  assert.equal(updatedVideos[0].statusHistory.filter((item) => item.status === "review").length, 1);
  assert.ok(updatedVideos[0].notes.includes(`Source: ${second.marker}`));
  assert.ok(updatedVideos[0].notes.includes(`Source-Hash: sha256:${second.sourceHash}`));
  assert.ok(updatedVideos[0].notes.includes("人工审稿参考:"));
  assert.ok(updatedVideos[0].notes.includes("[error] 正文漂移，需要重写。"));
  assert.equal(scriptMarkdown, "修复后的口播稿");

  await writeImport({
    lifecycle: { status: "discarded" },
    topicTitle: "废弃选题",
    videoTitle: "废弃选题",
    scriptMarkdown: "不应该导入",
    shootingFormats: ["talking"],
  });
  const discarded = await runImport();
  assert.equal(discarded.skipped, true);
  assert.equal(discarded.reason, "packet-discarded");

  console.log(JSON.stringify({
    ok: true,
    first,
    second,
    discarded,
    statusAfterReimport: updatedVideos[0].status,
  }, null, 2));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

async function runImport() {
  const { stdout } = await execFileAsync(process.execPath, [
    scriptPath,
    "--date",
    "2026-07-01",
    "--vault",
    tempDir,
    "--data-dir",
    tempDir,
  ], {
    cwd: process.cwd(),
    windowsHide: true,
  });
  return JSON.parse(stdout);
}

async function writeImport(payload, options = {}) {
  await mkdir(inputDir, { recursive: true });
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(inputPath, options.crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
  return text;
}

async function writeReview(payload) {
  await mkdir(reviewDir, { recursive: true });
  await writeFile(reviewPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readJson(name) {
  return JSON.parse(await readFile(path.join(tempDir, name), "utf8"));
}

async function writeDataJson(name, value) {
  await writeFile(path.join(tempDir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalizeHashInput(value) {
  return String(value || "").replace(/^\uFEFF/u, "").replace(/\r\n/g, "\n");
}
