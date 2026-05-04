# 抓取脚本模板

Claude 每次根据用户需求 adapt 此模板，生成一次性 TypeScript 脚本，用 `npx tsx` 执行。

## 核心设计思路

**视频搜索 → 提取作者**，而非直接搜用户账号。

原因：用户搜索（`fetch_search_user`）按账号名匹配关键词，结果充斥商家号/机构号——它们恰好把产品词放在账号名里；视频搜索（`fetch_general_search_result?search_type=1`）找到的是「在做这类内容」的真实创作者，与 TikTok 网页搜索行为一致。

**关键词要用内容词，不用产品词**：
- ❌ "masticating juicer"（产品词，商家会投广告）
- ✅ "juicer review" / "cold press juice" / "morning juice routine"（内容词，真实创作者会发）

规律：**品类词 + "review/tutorial/recipe/routine"** 通常比纯品类词质量高。

## 自定义区

每次只需修改以下常量：

- `SEARCH_TASKS` — 关键词列表和搜索维度（**用内容词**，见上方说明）
- `MAX_PAGES` — 每个关键词最多翻几页（默认 5）
- `CATEGORY_KEYWORDS` — 用于 bio 品类匹配的词
- `COMPETITOR_KEYWORDS` — 竞品品牌名（用于评分加分）
- `FOLLOWER_MIN` / `FOLLOWER_MAX` — 目标粉丝量区间（默认 5000 / 5000000）
- `TARGET_TOTAL` — 最终输出博主数（默认 50）
- `OUTPUT_LABEL` — CSV 文件名中的品类标签

## 完整模板

```typescript
import "dotenv/config";
import { writeFileSync, mkdirSync, existsSync } from "fs";

// ============================================================
// CUSTOMIZE: Claude adapts these constants per request
// ============================================================

const SEARCH_TASKS = [
  // 用内容词，不用产品词
  { keyword: "juicer review", dimension: "category" as const },
  { keyword: "cold press juice", dimension: "scene" as const },
  { keyword: "morning juice routine", dimension: "scene" as const },
  { keyword: "hurom juicer", dimension: "competitor" as const },
];

const MAX_PAGES = 5;
const TARGET_TOTAL = 50;          // 最终输出博主数
const CATEGORY_KEYWORDS = ["juicer", "juice", "juicing", "cold press", "blender"];
const COMPETITOR_KEYWORDS = ["hurom", "omega juicer", "kuvings"];
const FOLLOWER_MIN = 5_000;       // 过滤商家号/新号
const FOLLOWER_MAX = 5_000_000;
const OUTPUT_LABEL = "juicer";

// ============================================================
// Types
// ============================================================

type Dimension = "category" | "scene" | "competitor" | "audience";

interface Creator {
  unique_id: string;
  nickname: string;
  follower_count: number;
  video_count: number;
  bio: string;
  email: string | null;
  profile_url: string;
  search_keyword: string;
  dimension: Dimension;
  best_video_plays: number;
  best_video_likes: number;
  best_video_desc: string;
}

interface ScoredCreator extends Creator {
  priority_score: number;
  tier: "A" | "B" | "C";
  has_email: boolean;
  bio_category_match: boolean;
}

// ============================================================
// TikHub fetch
// ============================================================

function getApiKey(): string {
  const key = process.env.TIKHUB_API_KEY;
  if (!key) {
    console.error("❌ 请在 .env 文件中配置 TIKHUB_API_KEY");
    process.exit(1);
  }
  return key;
}

async function tikhubFetch(
  path: string,
  params: Record<string, string | number>
): Promise<any> {
  const url = new URL(`https://api.tikhub.io${path}`);
  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, String(v))
  );
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// ============================================================
// Email extraction
// ============================================================

function extractEmail(text: string): string | null {
  if (!text) return null;
  const normalized = text
    .replace(/\[at\]/gi, "@").replace(/\(at\)/gi, "@").replace(/ at /gi, "@")
    .replace(/\[dot\]/gi, ".").replace(/\(dot\)/gi, ".").replace(/ dot /gi, ".");
  const m = normalized.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : null;
}

// ============================================================
// Video search → extract authors
// 使用视频搜索而非用户搜索，找真实内容创作者
// ============================================================

async function scrapeAll(): Promise<Map<string, Creator>> {
  const creatorMap = new Map<string, Creator>();

  for (const task of SEARCH_TASKS) {
    console.log(`\n🔍 搜索: "${task.keyword}" (${task.dimension})`);
    let offset = 0;
    let pageCount = 0;

    while (pageCount < MAX_PAGES) {
      try {
        const data = await tikhubFetch(
          "/api/v1/tiktok/app/v3/fetch_general_search_result",
          { keyword: task.keyword, offset, count: 20, search_type: 1 }
        );

        // 视频结果在 data.data[] 中，每条有 aweme_info.author
        const items: any[] = data?.data?.data || [];
        if (items.length === 0) break;

        let newCount = 0;
        for (const item of items) {
          const aweme = item?.aweme_info;
          if (!aweme) continue;
          const author = aweme.author;
          if (!author?.unique_id) continue;

          const uid = String(author.unique_id);
          const follower = Number(author.follower_count || 0);
          if (follower < FOLLOWER_MIN) continue; // 过滤商家号/微型账号

          const plays = Number(aweme.statistics?.play_count || 0);
          const likes = Number(aweme.statistics?.digg_count || 0);
          const desc = String(aweme.desc || "").slice(0, 100);
          const bio = String(author.signature || author.search_user_desc || "");

          const existing = creatorMap.get(uid);
          if (existing) {
            // 同一博主保留播放量最高的视频
            if (plays > existing.best_video_plays) {
              existing.best_video_plays = plays;
              existing.best_video_likes = likes;
              existing.best_video_desc = desc;
            }
          } else {
            creatorMap.set(uid, {
              unique_id: uid,
              nickname: String(author.nickname || ""),
              follower_count: follower,
              video_count: Number(author.aweme_count || 0),
              bio,
              email: extractEmail(bio),
              profile_url: `https://www.tiktok.com/@${uid}`,
              search_keyword: task.keyword,
              dimension: task.dimension,
              best_video_plays: plays,
              best_video_likes: likes,
              best_video_desc: desc,
            });
            newCount++;
          }
        }

        const hasMore = data?.data?.has_more;
        console.log(
          `   页 ${pageCount + 1}: +${newCount} 位新创作者，累计 ${creatorMap.size} 位`
        );

        if (!hasMore) break;
        offset += items.length;
        pageCount++;
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.error(`   ❌ 第 ${pageCount + 1} 页出错:`, err instanceof Error ? err.message : err);
        break;
      }
    }
  }

  return creatorMap;
}

// ============================================================
// Outreach scoring
// ============================================================

const PR_SIGNALS = /\b(pr|collab|business|partner|brand|sponsor|email|contact|inquiry|ugc|creator|合作|商务)\b/i;

function scoreCreator(c: Creator): ScoredCreator {
  let score = 0;
  const bioLower = (c.bio || "").toLowerCase();

  if (c.email) score += 30;
  if (c.follower_count >= FOLLOWER_MIN && c.follower_count <= FOLLOWER_MAX) score += 20;

  const bioMatch = CATEGORY_KEYWORDS.some((k) => bioLower.includes(k));
  if (bioMatch) score += 15;

  if (c.dimension === "competitor") score += 15;
  if (c.video_count > 30) score += 10;
  if (c.dimension === "scene") score += 10;
  if (PR_SIGNALS.test(c.bio || "")) score += 10;
  if (c.best_video_plays > 100_000) score += 5; // 爆款视频加分

  const tier = score >= 60 ? "A" : score >= 40 ? "B" : ("C" as const);

  return {
    ...c,
    priority_score: score,
    tier,
    has_email: !!c.email,
    bio_category_match: bioMatch,
  };
}

// ============================================================
// CSV output
// ============================================================

function esc(v: unknown): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(creators: ScoredCreator[]): string {
  const headers = [
    "priority_score", "tier", "username", "nickname",
    "follower_count", "video_count", "bio", "email", "profile_url",
    "best_video_plays", "best_video_likes", "best_video_desc",
    "search_keyword", "has_email", "bio_category_match",
  ];
  const rows = creators.map((c) =>
    [
      c.priority_score, c.tier, "@" + c.unique_id, c.nickname,
      c.follower_count, c.video_count, c.bio, c.email || "",
      c.profile_url, c.best_video_plays, c.best_video_likes,
      c.best_video_desc, c.search_keyword,
      c.has_email ? "Y" : "N", c.bio_category_match ? "Y" : "N",
    ].map(esc).join(",")
  );
  return "﻿" + [headers.join(","), ...rows].join("\n");
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("🚀 开始红人采集（视频搜索模式）...\n");

  const creatorMap = await scrapeAll();
  console.log(`\n📊 去重后共 ${creatorMap.size} 位博主`);

  const scored = Array.from(creatorMap.values())
    .map(scoreCreator)
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, TARGET_TOTAL);

  const tierA = scored.filter((c) => c.tier === "A").length;
  const tierB = scored.filter((c) => c.tier === "B").length;
  const tierC = scored.filter((c) => c.tier === "C").length;
  const withEmail = scored.filter((c) => c.has_email).length;

  const kwStats = new Map<string, number>();
  for (const c of scored) {
    kwStats.set(c.search_keyword, (kwStats.get(c.search_keyword) || 0) + 1);
  }

  if (!existsSync("output")) mkdirSync("output", { recursive: true });
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const filename = `output/kol-${OUTPUT_LABEL}-${ts}.csv`;
  writeFileSync(filename, toCSV(scored), "utf-8");

  console.log("\n" + "=".repeat(50));
  console.log("🎯 红人建联名单已生成！\n");
  console.log("📊 采集摘要：");
  for (const [kw, count] of kwStats) {
    console.log(`   "${kw}": ${count} 位博主`);
  }
  console.log(`   合并去重后（Top ${TARGET_TOTAL}）：${scored.length} 位博主\n`);
  console.log("📋 建联分层：");
  console.log(`   A 级（优先建联）: ${tierA} 位`);
  console.log(`   B 级（值得联系）: ${tierB} 位`);
  console.log(`   C 级（备选观察）: ${tierC} 位\n`);
  console.log(`📧 有邮箱：${withEmail} 位（${((withEmail / scored.length) * 100).toFixed(1)}%）`);
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
5. CSV 输出在 `output/` 目录

## 备用接口（视频搜索无结果时）

如果 `fetch_general_search_result?search_type=1` 对某个关键词返回空结果，可回退到用户搜索：

```typescript
// 备用：用户搜索（注意：商家号比例更高）
const data = await tikhubFetch(
  "/api/v1/tiktok/web/fetch_search_user",
  { keyword: task.keyword, cursor: offset }
);
// 响应路径改为 data.data.user_list
const items = data?.data?.user_list || [];
// author 就是每条记录本身（不是 aweme_info.author）
```
