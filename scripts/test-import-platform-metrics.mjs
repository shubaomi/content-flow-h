import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { importPlatformMetrics } from "./import-platform-metrics.mjs";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "contentflow-platform-import-"));

try {
  const now = "2026-06-30T08:00:00.000Z";
  await writeJson("videos.json", [
    {
      id: "vid_001",
      title: "AI窗口别开太多",
      status: "published",
      platforms: [],
      statusHistory: [],
      shootingFormats: ["talking"],
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await writeJson("metrics.json", []);
  await writeJson("douyinRecords.json", []);
  await writeJson("shipinhaoRecords.json", []);
  await writeJson("xiaohongshuRecords.json", []);

  const csvPath = path.join(tempDir, "douyin.csv");
  await writeFile(csvPath, [
    "作品名称,发布时间,体裁,审核状态,播放量,完播率,5s完播率,封面点击率,2s跳出率,平均播放时长,点赞,分享,评论,收藏,粉丝增量",
    "AI窗口别开太多,2026-06-30 09:30:00,视频,公开,1200,12.5%,35%,4.2%,41%,18秒,60,8,5,22,3",
  ].join("\n"), "utf8");

  const result = await importPlatformMetrics({
    platform: "douyin",
    inputPath: csvPath,
    dataDir: tempDir,
  });

  assert.equal(result.ok, true);
  assert.equal(result.importedRows, 1);
  assert.equal(result.rawCreated, 1);
  assert.equal(result.metricsCreated, 1);
  assert.equal(result.videoPlatformUpdated, 1);
  assert.equal(result.unmatchedCount, 0);

  const [records, metrics, videos] = await Promise.all([
    readJson("douyinRecords.json"),
    readJson("metrics.json"),
    readJson("videos.json"),
  ]);

  assert.equal(records.length, 1);
  assert.equal(records[0].completionRate, 0.125);
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].videoId, "vid_001");
  assert.equal(metrics[0].completionRate, 12.5);
  assert.equal(metrics[0].plays, 1200);
  assert.equal(videos[0].platforms[0].platform, "douyin");
  assert.equal(videos[0].platforms[0].status, "published");

  console.log(JSON.stringify({
    ok: true,
    result,
    metric: metrics[0],
  }, null, 2));
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

async function writeJson(name, value) {
  await writeFile(path.join(tempDir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson(name) {
  return JSON.parse(await readFile(path.join(tempDir, name), "utf8"));
}
