import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const VALID_SHOOTING_FORMATS = new Set(["landscape", "portrait", "talking", "demo", "talking_demo"]);
const IMPORT_RESETTABLE_STATUSES = new Set(["topic", "scripting", "review"]);

const args = parseArgs(process.argv.slice(2));
const date = args.date || todayId();
const vaultDir = args.vault || process.env.HONGRUN_CONTENT_VAULT_DIR;
const dataDir = args.dataDir || process.env.CONTENTFLOW_DATA_DIR;

if (!dataDir) {
  throw new Error("Missing CONTENTFLOW_DATA_DIR or --data-dir");
}
if (!vaultDir && !args.input) {
  throw new Error("Missing HONGRUN_CONTENT_VAULT_DIR or --input");
}

const inputPath = args.input
  ? path.resolve(args.input)
  : path.join(vaultDir, "contentflow-import", `${date}.json`);
const importRelativePath = args.input
  ? path.relative(vaultDir || process.cwd(), inputPath).replaceAll(path.sep, "/")
  : `contentflow-import/${date}.json`;
const inputText = await readFile(inputPath, "utf8");
const sourceHash = sha256(stripBom(inputText));
const payload = parseContentFlowImport(parseJsonText(inputText));
const result = await importPacket({ dataDir, payload, importRelativePath, sourceHash });

console.log(JSON.stringify({
  ok: true,
  date,
  inputPath,
  dataDir,
  ...result,
}, null, 2));

async function importPacket({ dataDir, payload, importRelativePath, sourceHash }) {
  const timestamp = new Date().toISOString();
  const importMarker = `vault-import:${importRelativePath}`;
  const topicsPath = path.join(dataDir, "topics.json");
  const videosPath = path.join(dataDir, "videos.json");
  const scriptsPath = path.join(dataDir, "scripts.json");

  const topics = await readJson(topicsPath, []);
  const videos = await readJson(videosPath, []);
  const scripts = await readJson(scriptsPath, []);

  let video = videos.find((item) => String(item.notes || "").includes(importMarker))
    || videos.find((item) => normalizeTitle(item.title) === normalizeTitle(payload.videoTitle));
  const isNewVideo = !video;

  if (!video) {
    video = {
      id: genId("vid"),
      title: payload.videoTitle,
      status: "review",
      tagIds: [],
      shootingFormats: payload.shootingFormats,
      statusHistory: [{ status: "review", changedAt: timestamp }],
      platforms: [],
      thumbnailNote: payload.thumbnailNote,
      description: payload.videoDescription,
      notes: appendImportMarker(payload.notes, importMarker, sourceHash),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    videos.push(video);
  }

  let topic = video.topicId ? topics.find((item) => item.id === video.topicId) : null;
  if (!topic) {
    topic = topics.find((item) => normalizeTitle(item.title) === normalizeTitle(payload.topicTitle));
  }
  if (!topic) {
    topic = {
      id: genId("topic"),
      title: payload.topicTitle,
      description: payload.videoDescription,
      status: "in_progress",
      tagIds: [],
      inspiration: appendImportMarker(payload.notes, importMarker, sourceHash),
      linkedVideoId: video.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    topics.push(topic);
  }

  let script = video.scriptId ? scripts.find((item) => item.id === video.scriptId) : null;
  if (!script) {
    script = scripts.find((item) => item.videoId === video.id);
  }
  if (!script) {
    script = {
      id: genId("script"),
      videoId: video.id,
      topicId: topic.id,
      title: payload.videoTitle,
      wordCount: 0,
      estimatedDuration: 0,
      tagIds: [],
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    scripts.push(script);
  }

  const wordCount = payload.scriptMarkdown.replace(/\s+/g, "").length;
  const nextStatus = isNewVideo || IMPORT_RESETTABLE_STATUSES.has(video.status) ? "review" : video.status || "review";
  const statusChanged = video.status !== nextStatus;

  topic.title = payload.topicTitle;
  topic.description = payload.videoDescription;
  topic.status = topic.status === "done" ? topic.status : "in_progress";
  topic.inspiration = appendImportMarker(payload.notes, importMarker, sourceHash);
  topic.linkedVideoId = video.id;
  topic.updatedAt = timestamp;

  video.title = payload.videoTitle;
  video.status = nextStatus;
  video.topicId = topic.id;
  video.scriptId = script.id;
  video.shootingFormats = payload.shootingFormats;
  video.thumbnailNote = payload.thumbnailNote;
  video.description = payload.videoDescription;
  video.notes = appendImportMarker(payload.notes, importMarker, sourceHash);
  video.updatedAt = timestamp;
  if (statusChanged) {
    video.statusHistory = [...(video.statusHistory || []), { status: nextStatus, changedAt: timestamp }];
  }

  script.videoId = video.id;
  script.topicId = topic.id;
  script.title = payload.videoTitle;
  script.wordCount = wordCount;
  script.estimatedDuration = Math.round(wordCount / 3.5);
  script.updatedAt = timestamp;

  await mkdir(path.join(dataDir, "scripts"), { recursive: true });
  await writeFile(path.join(dataDir, "scripts", `${script.id}.md`), payload.scriptMarkdown, "utf8");
  await writeJson(topicsPath, topics);
  await writeJson(videosPath, videos);
  await writeJson(scriptsPath, scripts);

  return {
    imported: isNewVideo ? "created" : "updated",
    topicId: topic.id,
    videoId: video.id,
    scriptId: script.id,
    marker: importMarker,
    sourceHash,
  };
}

function parseContentFlowImport(input) {
  const source = readRecord(input);
  const payload = readRecord(source.contentFlowImport ?? source);
  const commercialIntent = readCommercialIntent(payload.commercialIntent ?? source.commercialIntent);
  return {
    topicTitle: readRequiredString(payload, "topicTitle"),
    videoTitle: readRequiredString(payload, "videoTitle"),
    videoDescription: readOptionalString(payload, "videoDescription"),
    scriptMarkdown: readRequiredString(payload, "scriptMarkdown"),
    thumbnailNote: readOptionalString(payload, "thumbnailNote"),
    notes: appendCommercialIntentNote(readOptionalString(payload, "notes"), commercialIntent),
    shootingFormats: readShootingFormats(payload.shootingFormats),
    commercialIntent,
  };
}

function readRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Import content must be a JSON object");
  }
  return value;
}

function readRequiredString(record, key) {
  const value = record[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required field: ${key}`);
  }
  return value.trim();
}

function readOptionalString(record, key) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readCommercialIntent(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const intent = {
    stage: readStringValue(value.stage),
    targetAudience: readStringValue(value.targetAudience),
    audiencePain: readStringValue(value.audiencePain),
    businessHypothesis: readStringValue(value.businessHypothesis),
    cta: readStringValue(value.cta),
    relatedOffer: readStringValue(value.relatedOffer),
  };
  return Object.values(intent).some(Boolean) ? intent : null;
}

function readStringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function appendCommercialIntentNote(notes, intent) {
  const text = String(notes || "").trim();
  if (!intent || text.includes("商业意图:")) return text || undefined;
  const block = [
    "商业意图:",
    intent.stage ? `- 阶段: ${intent.stage}` : "",
    intent.targetAudience ? `- 目标人群: ${intent.targetAudience}` : "",
    intent.audiencePain ? `- 痛点: ${intent.audiencePain}` : "",
    intent.businessHypothesis ? `- 假设: ${intent.businessHypothesis}` : "",
    intent.cta ? `- CTA: ${intent.cta}` : "",
    intent.relatedOffer ? `- 关联产品/服务: ${intent.relatedOffer}` : "",
  ].filter(Boolean).join("\n");
  return [text, block].filter(Boolean).join("\n\n");
}

function readShootingFormats(value) {
  if (value === undefined) return ["talking"];
  if (!Array.isArray(value)) throw new Error("shootingFormats must be an array");
  const formats = value.map((item) => {
    if (typeof item !== "string" || !VALID_SHOOTING_FORMATS.has(item)) {
      throw new Error(`Unsupported shooting format: ${String(item)}`);
    }
    return item;
  });
  return formats.length > 0 ? formats : ["talking"];
}

async function readJson(filePath, fallback) {
  try {
    return parseJsonText(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseJsonText(text) {
  return JSON.parse(stripBom(text));
}

function stripBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function appendImportMarker(notes, marker, sourceHash) {
  const text = String(notes || "").trim();
  const lines = text
    .split(/\r?\n/u)
    .filter((line) => !line.startsWith("Source: vault-import:") && !line.startsWith("Source-Hash: sha256:"));
  return [
    lines.join("\n").trim(),
    `Source: ${marker}`,
    sourceHash ? `Source-Hash: sha256:${sourceHash}` : "",
  ].filter(Boolean).join("\n\n");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalizeTitle(value) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function genId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
}

function todayId() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--date") parsed.date = values[++index];
    else if (value === "--vault") parsed.vault = values[++index];
    else if (value === "--data-dir") parsed.dataDir = values[++index];
    else if (value === "--input") parsed.input = values[++index];
  }
  return parsed;
}
