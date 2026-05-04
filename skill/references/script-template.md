# 抓取脚本模板

Claude 每次根据用户需求 adapt 此模板，生成一次性 TypeScript 脚本，用 `npx tsx` 执行。

## 自定义区

每次只需修改以下常量：

- `SEARCH_TASKS` — 关键词列表、接口路径、参数
- `MAX_PAGES` — 每个关键词最多翻几页（默认 10）
- `TARGET_PER_KEYWORD` — 每个关键词目标抓取数（默认 100）
- `CATEGORY_KEYWORDS` — 用于 bio 品类匹配的���键词
- `COMPETITOR_KEYWORDS` — 竞品关键词（用于评分加分）
- `FOLLOWER_MIN` / `FOLLOWER_MAX` — 目标粉丝量区间
- `OUTPUT_LABEL` — CSV 文件名中的品类标签

## 完整模板

```typescript
import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from "fs";

// ============================================================
// CUSTOMIZE: Claude adapts these constants per request
// ============================================================

const SEARCH_TASKS: SearchTask[] = [
  {
    keyword: "notebook review",
    endpoint: "/api/v1/tiktok/web/fetch_search_user",
    dimension: "category", // category | scene | competitor | audience
  },
  {
    keyword: "study with me",
    endpoint: "/api/v1/tiktok/web/fetch_search_user",
    dimension: "scene",
  },
];

const MAX_PAGES = 10;
const TARGET_PER_KEYWORD = 100;
const CATEGORY_KEYWORDS = ["notebook", "stationery", "planner"];
const COMPETITOR_KEYWORDS = ["rocketbook", "remarkable"];
const FOLLOWER_MIN = 10_000;
const FOLLOWER_MAX = 5_000_000;
const OUTPUT_LABEL = "stationery";

// ============================================================
// Types
// ============================================================

interface SearchTask {
  keyword: string;
  endpoint: string;
  dimension: "category" | "scene" | "competitor" | "audience";
}

interface NormalizedCreator {
  unique_id: string;
  nickname: string;
  avatar: string;
  bio: string;
  email: string | null;
  follower_count: number;
  video_count: number;
  search_keyword: string;
  dimension: string;
  matched_videos?: number;
}

interface ScoredCreator extends NormalizedCreator {
  priority_score: number;
  tier: "A" | "B" | "C";
  has_email: boolean;
  bio_category_match: boolean;
  profile_url: string;
}

// ============================================================
// Inline: TikHub fetch (from src/lib/tikhub.ts)
// ============================================================

const BASE_URL = "https://api.tikhub.io";

function getApiKey(): string {
  const key = process.env.TIKHUB_API_KEY;
  if (!key) {
    console.error("❌ 请在 .env 文件中配置 TIKHUB_API_KEY");
    process.exit(1);
  }
  return key;
}

async function tikhubFetch(path: string): Promise<any> {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TikHub API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ============================================================
// Inline: Email extraction (from src/lib/email-extractor.ts)
// ============================================================

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmails(text: string): string[] {
  if (!text) return [];
  const normalized = text
    .replace(/\s*[\[(]\s*at\s*[\])]\s*/gi, "@")
    .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi, ".")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s+dot\s+/gi, ".");
  const matches = normalized.match(EMAIL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

// ============================================================
// Response shape detection
// ============================================================

function extractRawCreators(data: any): any[] {
  // User-list endpoints
  if (Array.isArray(data?.user_list)) return data.user_list;
  if (Array.isArray(data?.users)) return data.users;

  // Post-list endpoints — extract authors
  if (Array.isArray(data?.aweme_list)) {
    return data.aweme_list
      .map((item: any) => item.author || item.user_info)
      .filter(Boolean);
  }

  // Generic data array — inspect first item
  if (Array.isArray(data?.data) && data.data.length > 0) {
    const first = data.data[0];
    if (first.unique_id || first.uniqueId) return data.data;
    if (first.aweme_id || first.video_id) {
      return data.data
        .map((item: any) => item.author || item.user_info)
        .filter(Boolean);
    }
    return data.data;
  }

  console.warn("⚠️  未识别的响应结构，顶层 key:", Object.keys(data || {}));
  return [];
}

function normalizeCreator(
  raw: any,
  keyword: string,
  dimension: string
): NormalizedCreator {
  const user = raw.user_info || raw;
  const bio = (user.signature || user.bio || "") as string;
  const emails = extractEmails(bio);
  const avatarMedium = user.avatar_medium as
    | { url_list?: string[] }
    | undefined;

  return {
    unique_id: (user.unique_id || user.uniqueId || "") as string,
    nickname: (user.nickname || "") as string,
    avatar:
      (user.avatarMedium as string) ||
      avatarMedium?.url_list?.[0] ||
      "",
    bio,
    email: emails[0] || null,
    follower_count: (user.follower_count ?? user.followerCount ?? 0) as number,
    video_count: (user.aweme_count ?? user.videoCount ?? 0) as number,
    search_keyword: keyword,
    dimension,
  };
}

// ============================================================
// Pagination helpers
// ============================================================

function buildUrl(endpoint: string, keyword: string, cursor: number): string {
  // Detect pagination style from endpoint path
  if (endpoint.includes("/web/")) {
    const params = new URLSearchParams({
      keyword,
      cursor: String(cursor),
    });
    return `${endpoint}?${params}`;
  }
  // App-style endpoints use offset/count
  const params = new URLSearchParams({
    keyword,
    offset: String(cursor),
    count: "20",
  });
  return `${endpoint}?${params}`;
}

function getNextCursor(data: any, currentCursor: number): number | null {
  if (data?.has_more === false) return null;
  if (data?.cursor !== undefined && data.cursor !== currentCursor) {
    return data.cursor;
  }
  // offset-based: advance by 20
  if (data?.has_more) return currentCursor + 20;
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Scrape all keywords
// ============================================================

async function scrapeAll(): Promise<NormalizedCreator[]> {
  const all: NormalizedCreator[] = [];

  for (const task of SEARCH_TASKS) {
    console.log(`\n🔍 搜索: "${task.keyword}" (${task.dimension})`);
    let cursor = 0;
    let pageCount = 0;
    let taskTotal = 0;

    while (pageCount < MAX_PAGES && taskTotal < TARGET_PER_KEYWORD) {
      try {
        const url = buildUrl(task.endpoint, task.keyword, cursor);
        const result = await tikhubFetch(url);
        const rawCreators = extractRawCreators(result?.data || result);

        if (rawCreators.length === 0) {
          console.log(`   页 ${pageCount + 1}: 无更多结果`);
          break;
        }

        const creators = rawCreators.map((raw) =>
          normalizeCreator(raw, task.keyword, task.dimension)
        );
        all.push(...creators);
        taskTotal += creators.length;
        pageCount++;
        console.log(
          `   页 ${pageCount}: +${creators.length} 位博主（累计 ${taskTotal}）`
        );

        const nextCursor = getNextCursor(
          result?.data || result,
          cursor
        );
        if (nextCursor === null) break;
        cursor = nextCursor;

        await sleep(1000);
      } catch (err) {
        console.error(
          `   ❌ 第 ${pageCount + 1} 页出错:`,
          err instanceof Error ? err.message : err
        );
        break;
      }
    }

    console.log(`   ✅ "${task.keyword}" 完成，共 ${taskTotal} 位博主`);
  }

  return all;
}

// ============================================================
// Deduplication
// ============================================================

function dedup(creators: NormalizedCreator[]): NormalizedCreator[] {
  const seen = new Map<string, NormalizedCreator>();
  for (const c of creators) {
    if (!c.unique_id) continue;
    if (!seen.has(c.unique_id)) {
      seen.set(c.unique_id, c);
    }
  }
  return [...seen.values()];
}

// ============================================================
// Outreach scoring
// ============================================================

function scoreCreator(c: NormalizedCreator): ScoredCreator {
  let score = 0;

  // Has email → can directly contact
  if (c.email) score += 30;

  // Follower count in target range
  if (c.follower_count >= FOLLOWER_MIN && c.follower_count <= FOLLOWER_MAX) {
    score += 20;
  }

  // Bio contains category keywords
  const bioLower = (c.bio || "").toLowerCase();
  const bioMatch = CATEGORY_KEYWORDS.some((k) => bioLower.includes(k));
  if (bioMatch) score += 15;

  // Active creator (30+ videos)
  if (c.video_count > 30) score += 10;

  // From competitor keyword search
  if (c.dimension === "competitor") score += 15;

  // From scene keyword search
  if (c.dimension === "scene") score += 10;

  // Bio signals: PR friendly, collab, business
  const outreachSignals =
    /\b(pr|collab|business|partner|brand|sponsor|email|contact|inquiry|合作|商务)\b/i;
  if (outreachSignals.test(c.bio || "")) score += 10;

  const tier = score >= 60 ? "A" : score >= 40 ? "B" : ("C" as const);

  return {
    ...c,
    priority_score: score,
    tier,
    has_email: !!c.email,
    bio_category_match: bioMatch,
    profile_url: c.unique_id
      ? `https://www.tiktok.com/@${c.unique_id}`
      : "",
  };
}

// ============================================================
// CSV output
// ============================================================

function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(creators: ScoredCreator[]): string {
  const headers = [
    "priority_score",
    "tier",
    "username",
    "nickname",
    "follower_count",
    "video_count",
    "bio",
    "email",
    "profile_url",
    "search_keyword",
    "has_email",
    "bio_category_match",
  ];

  const rows = creators.map((c) =>
    [
      c.priority_score,
      c.tier,
      c.unique_id,
      c.nickname,
      c.follower_count,
      c.video_count,
      c.bio,
      c.email || "",
      c.profile_url,
      c.search_keyword,
      c.has_email ? "Y" : "N",
      c.bio_category_match ? "Y" : "N",
    ]
      .map(escapeCSV)
      .join(",")
  );

  // UTF-8 BOM for Excel compatibility
  return "﻿" + [headers.join(","), ...rows].join("\n");
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("🚀 开始红人采集...\n");

  const raw = await scrapeAll();
  console.log(`\n📊 原始采集: ${raw.length} 条记录`);

  const unique = dedup(raw);
  console.log(`🔄 去重后: ${unique.length} 位博主`);

  const scored = unique.map(scoreCreator).sort((a, b) => b.priority_score - a.priority_score);

  // Stats
  const tierA = scored.filter((c) => c.tier === "A").length;
  const tierB = scored.filter((c) => c.tier === "B").length;
  const tierC = scored.filter((c) => c.tier === "C").length;
  const withEmail = scored.filter((c) => c.has_email).length;

  // Per-keyword stats
  const kwStats = new Map<string, number>();
  for (const c of scored) {
    kwStats.set(c.search_keyword, (kwStats.get(c.search_keyword) || 0) + 1);
  }

  // Write CSV
  const now = new Date();
  const ts =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "-" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const dir = "output";
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const filename = `${dir}/kol-${OUTPUT_LABEL}-${ts}.csv`;

  writeFileSync(filename, toCSV(scored), "utf-8");

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎯 红人建联名单已生成！\n");
  console.log("📊 采集摘要：");
  for (const [kw, count] of kwStats) {
    console.log(`   "${kw}": ${count} 位博主`);
  }
  console.log(`   合并去重后：${scored.length} 位博主\n`);
  console.log("📋 建联分层：");
  console.log(`   A 级（优先建联）: ${tierA} 位`);
  console.log(`   B 级（值得联系）: ${tierB} 位`);
  console.log(`   C 级（备选观察）: ${tierC} 位\n`);
  console.log(
    `📧 有邮箱：${withEmail} 位（${((withEmail / scored.length) * 100).toFixed(1)}%）\n`
  );
  console.log(`📁 文件：${filename}`);
  console.log("=".repeat(50));
}

main().catch((err) => {
  console.error("❌ 执行出错:", err);
  process.exit(1);
});
```

## 使用说明

1. Claude 复制此模板，修改 `CUSTOMIZE` 区域的常量
2. 将脚本保存为临时文件（如 `_scrape.ts`）
3. 用 `npx tsx _scrape.ts` 执行
4. 执行完毕后删除临时脚本文件
5. CSV 输出在 `output/` 目���

## 适配不同接口

如果用户提供的接口不是默认的 `fetch_search_user`：

1. 修改 `SEARCH_TASKS` 中的 `endpoint`
2. 如果分页方式不同，可能需要调整 `buildUrl` 和 `getNextCursor`
3. 如果是帖子类接口，`extractRawCreators` 已自动处理 author 提取
