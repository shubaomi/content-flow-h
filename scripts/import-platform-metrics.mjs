import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PLATFORMS = new Set(["douyin", "xiaohongshu", "shipinhao"]);
const RAW_FILE_BY_PLATFORM = {
  douyin: "douyinRecords.json",
  xiaohongshu: "xiaohongshuRecords.json",
  shipinhao: "shipinhaoRecords.json",
};

if (isCliEntry()) {
  const args = parseArgs(process.argv.slice(2));
  const platform = args.platform;
  const inputPath = args.input;
  const dataDir = args.dataDir || process.env.CONTENTFLOW_DATA_DIR;
  const dryRun = Boolean(args.dryRun);

  if (!PLATFORMS.has(platform) || !inputPath || !dataDir) {
    console.error([
      "Usage:",
      "  node scripts/import-platform-metrics.mjs --platform douyin|xiaohongshu|shipinhao --input <csv-or-json> --data-dir <contentflow-data>",
      "",
      "Notes:",
      "  - The script imports official platform backend exports only; it does not scrape platforms.",
      "  - Existing rows are updated by title/date or platform video id.",
    ].join("\n"));
    process.exit(1);
  }

  const result = await importPlatformMetrics({ platform, inputPath, dataDir, dryRun });
  console.log(JSON.stringify(result, null, 2));
}

export async function importPlatformMetrics({ platform, inputPath, dataDir, dryRun = false }) {
  const [videos, metrics, rawRecords, inputRows] = await Promise.all([
    readJson(path.join(dataDir, "videos.json"), []),
    readJson(path.join(dataDir, "metrics.json"), []),
    readJson(path.join(dataDir, RAW_FILE_BY_PLATFORM[platform]), []),
    readInputRows(inputPath),
  ]);

  const now = new Date().toISOString();
  const normalizedRows = inputRows
    .map((row) => normalizePlatformRow(platform, row, now))
    .filter((row) => row.title || row.description || row.platformVideoId);

  const nextRawRecords = [...rawRecords];
  const nextMetrics = [...metrics];
  const nextVideos = videos.map((video) => ({ ...video, platforms: Array.isArray(video.platforms) ? [...video.platforms] : [] }));
  let rawCreated = 0;
  let rawUpdated = 0;
  let metricsCreated = 0;
  let metricsUpdated = 0;
  let videoPlatformUpdated = 0;
  let unmatchedCount = 0;

  for (const row of normalizedRows) {
    const rawRecord = toRawRecord(platform, row, now);
    const rawKey = rawRecordKey(platform, rawRecord);
    const rawIndex = nextRawRecords.findIndex((item) => rawRecordKey(platform, item) === rawKey);
    if (rawIndex >= 0) {
      nextRawRecords[rawIndex] = { ...nextRawRecords[rawIndex], ...rawRecord, id: nextRawRecords[rawIndex].id, createdAt: nextRawRecords[rawIndex].createdAt || now };
      rawUpdated += 1;
    } else {
      nextRawRecords.push(rawRecord);
      rawCreated += 1;
    }

    const video = matchVideo(nextVideos, row);
    if (!video) {
      unmatchedCount += 1;
      continue;
    }

    upsertPlatformEntry(video, platform, row, now);
    videoPlatformUpdated += 1;

    const metric = toMetric(platform, video.id, row, now);
    const metricIndex = nextMetrics.findIndex((item) => item.videoId === metric.videoId && item.platform === metric.platform);
    if (metricIndex >= 0) {
      nextMetrics[metricIndex] = { ...nextMetrics[metricIndex], ...metric, id: nextMetrics[metricIndex].id, recordedAt: now };
      metricsUpdated += 1;
    } else {
      nextMetrics.push(metric);
      metricsCreated += 1;
    }
  }

  if (!dryRun) {
    await mkdir(dataDir, { recursive: true });
    await Promise.all([
      writeJson(path.join(dataDir, RAW_FILE_BY_PLATFORM[platform]), nextRawRecords),
      writeJson(path.join(dataDir, "metrics.json"), nextMetrics),
      writeJson(path.join(dataDir, "videos.json"), nextVideos),
    ]);
  }

  return {
    ok: true,
    platform,
    inputPath,
    dataDir,
    dryRun,
    importedRows: normalizedRows.length,
    rawCreated,
    rawUpdated,
    metricsCreated,
    metricsUpdated,
    videoPlatformUpdated,
    unmatchedCount,
    rawOutputPath: path.join(dataDir, RAW_FILE_BY_PLATFORM[platform]),
    metricsOutputPath: path.join(dataDir, "metrics.json"),
    videosOutputPath: path.join(dataDir, "videos.json"),
  };
}

async function readInputRows(filePath) {
  const content = await readFile(filePath, "utf8");
  if (filePath.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed.records) ? parsed.records : [];
  }
  return parseCsv(content);
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => {
    const record = {};
    for (let index = 0; index < headers.length; index += 1) {
      if (headers[index]) record[headers[index]] = values[index] ?? "";
    }
    return record;
  });
}

function normalizePlatformRow(platform, row, now) {
  if (platform === "douyin") return normalizeDouyinRow(row, now);
  if (platform === "xiaohongshu") return normalizeXiaohongshuRow(row, now);
  return normalizeShipinhaoRow(row, now);
}

function normalizeDouyinRow(row, now) {
  return {
    title: cleanTitle(readField(row, ["title", "作品名称", "作品标题", "视频标题", "笔记标题"])),
    publishedAt: readField(row, ["publishedAt", "发布时间", "首次发布时间", "日期", "发布日期"]),
    genre: readField(row, ["genre", "体裁", "类型", "内容类型"]),
    status: readField(row, ["status", "审核状态", "状态"]) || "公开",
    plays: parseInteger(readField(row, ["plays", "播放量", "播放", "播放次数", "观看量", "views"])),
    completionRate: parseRatio(readField(row, ["completionRate", "完播率"])),
    fiveSecRate: parseRatio(readField(row, ["fiveSecRate", "5s完播率", "5秒完播率"])),
    coverCtr: readField(row, ["coverCtr", "封面点击率"]) || "-",
    twoSecBounceRate: parseRatio(readField(row, ["twoSecBounceRate", "2s跳出率", "2秒跳出率"])),
    avgPlayDuration: parseSeconds(readField(row, ["avgPlayDuration", "平均播放时长", "人均观看时长", "均播时长"])),
    likes: parseInteger(readField(row, ["likes", "点赞", "点赞量"])),
    shares: parseInteger(readField(row, ["shares", "分享", "分享量"])),
    comments: parseInteger(readField(row, ["comments", "评论", "评论量"])),
    saves: parseInteger(readField(row, ["saves", "收藏", "收藏量"])),
    follows: parseInteger(readField(row, ["follows", "涨粉", "粉丝增量", "关注量"])),
    platformVideoId: readField(row, ["platformVideoId", "作品ID", "视频ID", "id"]),
    importedAt: now,
  };
}

function normalizeXiaohongshuRow(row, now) {
  return {
    title: cleanTitle(readField(row, ["title", "笔记标题", "作品名称", "作品标题", "视频标题"])),
    publishedAt: readField(row, ["publishedAt", "首次发布时间", "发布时间", "日期", "发布日期"]),
    genre: readField(row, ["genre", "体裁", "类型", "内容类型"]),
    impressions: parseInteger(readField(row, ["impressions", "曝光", "曝光量"])),
    views: parseInteger(readField(row, ["views", "观看量", "播放量", "播放", "阅读量"])),
    coverCtr: parseRatio(readField(row, ["coverCtr", "封面点击率", "点击率"])),
    likes: parseInteger(readField(row, ["likes", "点赞", "点赞量"])),
    comments: parseInteger(readField(row, ["comments", "评论", "评论量"])),
    saves: parseInteger(readField(row, ["saves", "收藏", "收藏量"])),
    follows: parseInteger(readField(row, ["follows", "涨粉", "粉丝增量", "关注量"])),
    shares: parseInteger(readField(row, ["shares", "分享", "分享量"])),
    avgWatchDuration: parseSeconds(readField(row, ["avgWatchDuration", "人均观看时长", "平均播放时长", "均播时长"])),
    danmaku: parseInteger(readField(row, ["danmaku", "弹幕"])),
    platformVideoId: readField(row, ["platformVideoId", "笔记ID", "作品ID", "视频ID", "id"]),
    importedAt: now,
  };
}

function normalizeShipinhaoRow(row, now) {
  return {
    title: cleanTitle(readField(row, ["title", "视频标题", "作品名称"])),
    description: cleanTitle(readField(row, ["description", "描述", "视频描述", "动态描述", "内容"])),
    platformVideoId: readField(row, ["platformVideoId", "videoId", "视频ID", "作品ID", "id"]),
    publishedAt: readField(row, ["publishedAt", "发布时间", "日期", "发布日期"]),
    completionRate: parseRatio(readField(row, ["completionRate", "完播率"])),
    avgPlayDuration: readField(row, ["avgPlayDuration", "平均播放时长", "人均观看时长", "均播时长"]),
    plays: parseInteger(readField(row, ["plays", "播放量", "播放", "观看量", "views"])),
    recommendations: parseInteger(readField(row, ["recommendations", "推荐"])),
    likes: parseInteger(readField(row, ["likes", "喜欢", "点赞", "点赞量"])),
    comments: parseInteger(readField(row, ["comments", "评论", "评论量"])),
    shares: parseInteger(readField(row, ["shares", "分享", "分享量", "转发"])),
    follows: parseInteger(readField(row, ["follows", "关注量", "关注", "涨粉"])),
    forwardChat: parseInteger(readField(row, ["forwardChat", "转发聊天和朋友圈"])),
    setRingtone: parseInteger(readField(row, ["setRingtone", "设为铃声"])),
    setStatus: parseInteger(readField(row, ["setStatus", "设为状态"])),
    setMomentCover: parseInteger(readField(row, ["setMomentCover", "设为朋友圈封面"])),
    importedAt: now,
  };
}

function toRawRecord(platform, row, now) {
  if (platform === "douyin") {
    return {
      id: randomUUID(),
      title: row.title,
      publishedAt: row.publishedAt,
      genre: row.genre,
      status: row.status,
      plays: row.plays,
      completionRate: row.completionRate,
      fiveSecRate: row.fiveSecRate,
      coverCtr: row.coverCtr,
      twoSecBounceRate: row.twoSecBounceRate,
      avgPlayDuration: row.avgPlayDuration,
      likes: row.likes,
      shares: row.shares,
      comments: row.comments,
      saves: row.saves,
      profileVisits: 0,
      followerGain: row.follows,
      platformVideoId: row.platformVideoId,
      createdAt: now,
    };
  }
  if (platform === "xiaohongshu") {
    return {
      id: randomUUID(),
      title: row.title,
      publishedAt: row.publishedAt,
      genre: row.genre,
      impressions: row.impressions,
      views: row.views,
      coverCtr: row.coverCtr,
      likes: row.likes,
      comments: row.comments,
      saves: row.saves,
      follows: row.follows,
      shares: row.shares,
      avgWatchDuration: row.avgWatchDuration,
      danmaku: row.danmaku,
      platformVideoId: row.platformVideoId,
      createdAt: now,
    };
  }
  return {
    id: randomUUID(),
    description: row.description || row.title,
    videoId: row.platformVideoId,
    publishedAt: row.publishedAt,
    completionRate: row.completionRate,
    avgPlayDuration: row.avgPlayDuration,
    plays: row.plays,
    recommendations: row.recommendations,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    follows: row.follows,
    forwardChat: row.forwardChat,
    setRingtone: row.setRingtone,
    setStatus: row.setStatus,
    setMomentCover: row.setMomentCover,
    createdAt: now,
  };
}

function toMetric(platform, videoId, row, now) {
  return {
    id: randomUUID(),
    videoId,
    platform,
    recordedAt: now,
    dataDate: normalizeDate(row.publishedAt) || now.slice(0, 10),
    plays: row.plays || row.views || 0,
    likes: row.likes || 0,
    comments: row.comments || 0,
    shares: row.shares || row.forwardChat || 0,
    saves: row.saves || 0,
    follows: row.follows || row.followerGain || 0,
    completionRate: ratioToPercent(row.completionRate),
  };
}

function upsertPlatformEntry(video, platform, row, now) {
  const status = platform === "douyin" && row.status && row.status !== "公开" ? "violated" : "published";
  const entry = {
    platform,
    status,
    publishedAt: toIsoDateTime(row.publishedAt) || now,
    platformVideoId: row.platformVideoId || undefined,
  };
  const index = video.platforms.findIndex((item) => item.platform === platform);
  if (index >= 0) {
    video.platforms[index] = { ...video.platforms[index], ...entry };
  } else {
    video.platforms.push(entry);
  }
  video.status = video.status === "archived" ? video.status : "published";
  video.updatedAt = now;
}

function matchVideo(videos, row) {
  const title = normalizeTitle(row.title || row.description);
  const platformId = normalizeTitle(row.platformVideoId);
  if (!title && !platformId) return null;

  return videos.find((video) => {
    if (platformId && video.platforms?.some((item) => normalizeTitle(item.platformVideoId) === platformId)) return true;
    const videoTitle = normalizeTitle(video.title);
    if (!title || !videoTitle) return false;
    return title === videoTitle || title.includes(videoTitle) || videoTitle.includes(title);
  }) || null;
}

function rawRecordKey(platform, row) {
  if (platform === "shipinhao" && row.videoId) return `id:${normalizeTitle(row.videoId)}`;
  if (row.platformVideoId) return `id:${normalizeTitle(row.platformVideoId)}`;
  const title = normalizeTitle(row.title || row.description);
  return `${title}|${normalizeDate(row.publishedAt)}`;
}

function readField(row, aliases) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    if (row[normalized] != null && String(row[normalized]).trim()) return String(row[normalized]).trim();
    if (row[alias] != null && String(row[alias]).trim()) return String(row[alias]).trim();
  }
  return "";
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .replace(/^\uFEFF/u, "");
}

function cleanTitle(value) {
  return String(value || "")
    .split(/\n/u)[0]
    .replace(/#\S+/gu, "")
    .replace(/@\S+/gu, "")
    .trim();
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function parseInteger(value) {
  const text = String(value || "").replace(/[,，\s]/gu, "");
  if (!text) return 0;
  if (/万/u.test(text)) return Math.round(Number.parseFloat(text) * 10000) || 0;
  return Number.parseInt(text, 10) || 0;
}

function parseRatio(value) {
  const text = String(value || "").trim();
  if (!text || text === "-") return 0;
  const number = Number.parseFloat(text.replace("%", ""));
  if (!Number.isFinite(number)) return 0;
  return text.includes("%") || number > 1 ? number / 100 : number;
}

function ratioToPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  return number <= 1 ? Number((number * 100).toFixed(2)) : Number(number.toFixed(2));
}

function parseSeconds(value) {
  const number = Number.parseFloat(String(value || "").replace("秒", ""));
  return Number.isFinite(number) ? number : 0;
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/u);
  if (!match) return "";
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function toIsoDateTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.replace(/\//gu, "-").replace(" ", "T");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const item = values[index];
    if (item === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    if (item === "--platform") parsed.platform = values[++index];
    if (item === "--input") parsed.input = values[++index];
    if (item === "--data-dir") parsed.dataDir = values[++index];
  }
  return parsed;
}

function isCliEntry() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
