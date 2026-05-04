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
import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

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
  bio_link: string | null;
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
  has_bio_link: boolean;
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
// Helpers
// ============================================================

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// Phase 1: Video search → extract authors
// 使用视频搜索而非用户搜索，找真实内容创作者
// ============================================================

async function searchByVideos(): Promise<Map<string, Creator>> {
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
              bio_link: null,
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
        await sleep(1000);
      } catch (err) {
        console.error(`   ❌ 第 ${pageCount + 1} 页出错:`, err instanceof Error ? err.message : err);
        break;
      }
    }
  }

  return creatorMap;
}

// ============================================================
// Phase 2: Profile enrichment → get full bio, email, bioLink
// 关键步骤：视频搜索的 author.signature 常为空，必须补全
// ============================================================

async function enrichWithProfile(creatorMap: Map<string, Creator>): Promise<void> {
  const creators = Array.from(creatorMap.values());
  console.log(`\n📋 Phase 2: 补全 ${creators.length} 位博主的 Profile...`);

  let enriched = 0;
  let emailFound = 0;
  let bioLinkFound = 0;

  for (let i = 0; i < creators.length; i++) {
    const c = creators[i];
    try {
      const data = await tikhubFetch(
        "/api/v1/tiktok/web/fetch_user_profile",
        { uniqueId: c.unique_id }
      );
      const user = data?.data?.userInfo?.user;
      if (!user) continue;

      const fullBio = String(user.signature || "");
      const email = extractEmail(fullBio);
      const bioLink = user.bioLink?.link ? String(user.bioLink.link) : null;

      c.bio = fullBio || c.bio;
      c.nickname = user.nickname || c.nickname;
      c.follower_count = user.followerCount ?? c.follower_count;
      c.video_count = user.videoCount ?? c.video_count;
      c.bio_link = bioLink;

      if (email && !c.email) {
        c.email = email;
        emailFound++;
      }
      if (bioLink) bioLinkFound++;
      enriched++;

      if ((i + 1) % 10 === 0) {
        process.stdout.write(
          `  进度: ${i + 1}/${creators.length}，邮箱+${emailFound}，链接+${bioLinkFound}\n`
        );
      }
      await sleep(150); // 10 req/s 限速，保守 150ms
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") || msg.includes("limit")) {
        console.error(`  ⚠️  触发 API 限速，暂停 10 秒...`);
        await sleep(10_000);
      }
      // 单个失败不中断整体流程
    }
  }
  console.log(
    `  ✅ 补全完成：${enriched} 位，邮箱 ${emailFound} 个，bioLink ${bioLinkFound} 个`
  );
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
  if (c.bio_link) score += 5; // 有落地页链接加分
  if (c.best_video_plays > 100_000) score += 5; // 爆款视频加分

  const tier = score >= 60 ? "A" : score >= 40 ? "B" : ("C" as const);

  return {
    ...c,
    priority_score: score,
    tier,
    has_email: !!c.email,
    has_bio_link: !!c.bio_link,
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
    "follower_count", "video_count", "bio", "email", "bio_link", "profile_url",
    "best_video_plays", "best_video_likes", "best_video_desc",
    "search_keyword", "has_email", "has_bio_link", "bio_category_match",
  ];
  const rows = creators.map((c) =>
    [
      c.priority_score, c.tier, "@" + c.unique_id, c.nickname,
      c.follower_count, c.video_count, c.bio, c.email || "", c.bio_link || "",
      c.profile_url, c.best_video_plays, c.best_video_likes,
      c.best_video_desc, c.search_keyword,
      c.has_email ? "Y" : "N", c.has_bio_link ? "Y" : "N", c.bio_category_match ? "Y" : "N",
    ].map(esc).join(",")
  );
  return "﻿" + [headers.join(","), ...rows].join("\n");
}

// ============================================================
// HTML Report
// ============================================================

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHTMLReport(
  creators: ScoredCreator[],
  kwStats: Map<string, number>,
  csvPath: string,
  timestamp: string
): string {
  const total = creators.length;
  const tierA = creators.filter((c) => c.tier === "A").length;
  const tierB = creators.filter((c) => c.tier === "B").length;
  const tierC = creators.filter((c) => c.tier === "C").length;
  const withEmail = creators.filter((c) => c.has_email).length;
  const withBioLink = creators.filter((c) => c.has_bio_link).length;
  const emailRate = total > 0 ? ((withEmail / total) * 100).toFixed(1) : "0";
  const linkRate = total > 0 ? ((withBioLink / total) * 100).toFixed(1) : "0";

  const kwEntries = Array.from(kwStats.entries()).sort((a, b) => b[1] - a[1]);
  const maxKwCount = kwEntries.length > 0 ? kwEntries[0][1] : 1;

  const rowsHtml = creators
    .map((c, i) => {
      const plays =
        c.best_video_plays >= 1_000_000
          ? (c.best_video_plays / 1_000_000).toFixed(1) + "M"
          : c.best_video_plays >= 1_000
          ? (c.best_video_plays / 1_000).toFixed(0) + "K"
          : String(c.best_video_plays);
      const tierColor =
        c.tier === "A" ? "#22c55e" : c.tier === "B" ? "#f59e0b" : "#ef4444";
      return `
      <tr data-keyword="${escHtml(c.search_keyword)}" data-tier="${c.tier}" data-search="${escHtml((c.nickname + " " + c.unique_id + " " + c.bio).toLowerCase())}">
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:13px">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b"><span style="color:${tierColor};font-weight:700;font-size:12px">${c.tier}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b">
          <a href="${escHtml(c.profile_url)}" target="_blank" style="color:#38bdf8;text-decoration:none;font-weight:600;font-size:14px">${escHtml(c.unique_id)}</a>
          <div style="color:#64748b;font-size:12px;margin-top:2px">${escHtml(c.nickname)}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px">${(c.follower_count / 1000).toFixed(1)}K</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px">${plays}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b">
          ${c.email ? `<a href="mailto:${escHtml(c.email)}" style="color:#22c55e;text-decoration:none;font-size:13px">${escHtml(c.email)}</a>` : '<span style="color:#475569;font-size:13px">—</span>'}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b">
          ${c.bio_link ? `<a href="${escHtml(c.bio_link)}" target="_blank" style="color:#a78bfa;text-decoration:none;font-size:13px">链接</a>` : '<span style="color:#475569;font-size:13px">—</span>'}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(c.bio)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #1e293b"><span style="background:#0f172a;color:#94a3b8;padding:3px 8px;border-radius:4px;font-size:11px">${escHtml(c.search_keyword)}</span></td>
      </tr>`;
    })
    .join("");

  const kwBarsHtml = kwEntries
    .map(([kw, count]) => {
      const pct = (count / maxKwCount) * 100;
      return `
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px">
          <span style="color:#cbd5e1;font-size:13px">${escHtml(kw)}</span>
          <span style="color:#94a3b8;font-size:12px">${count} 位</span>
        </div>
        <div style="background:#1e293b;height:6px;border-radius:3px;overflow:hidden">
          <div style="background:linear-gradient(90deg,#38bdf8,#818cf8);height:100%;width:${pct}%;border-radius:3px"></div>
        </div>
      </div>`;
    })
    .join("");

  const scr = "<" + "/script>";

  return `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TikTok KOL Report — ${escHtml(OUTPUT_LABEL)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0f19;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;min-height:100vh}
.container{max-width:1200px;margin:0 auto;padding:24px}
header{margin-bottom:28px}
header h1{font-size:24px;font-weight:700;background:linear-gradient(90deg,#38bdf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
header .meta{color:#64748b;font-size:13px;margin-top:4px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.card{background:#111827;border:1px solid #1e293b;border-radius:10px;padding:16px}
.card .label{color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
.card .value{font-size:22px;font-weight:700;color:#f8fafc}
.card .value.green{color:#22c55e}.card .value.blue{color:#38bdf8}.card .value.purple{color:#a78bfa}.card .value.orange{color:#f59e0b}
.section{background:#111827;border:1px solid #1e293b;border-radius:10px;padding:20px;margin-bottom:20px}
.section h2{font-size:16px;font-weight:600;color:#f8fafc;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.toolbar{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center}
.toolbar input{background:#0b0f19;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:13px;flex:1;min-width:200px;outline:none}
.toolbar input:focus{border-color:#38bdf8}
.toolbar button{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:6px 12px;color:#94a3b8;font-size:12px;cursor:pointer;transition:all .2s}
.toolbar button:hover{background:#334155;color:#e2e8f0}
.toolbar button.active{background:#38bdf8;color:#0b0f19;border-color:#38bdf8;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:13px}
th{padding:10px 12px;text-align:left;color:#94a3b8;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid #1e293b;cursor:pointer;user-select:none}
th:hover{color:#38bdf8}
td{vertical-align:top}
tr:hover td{background:#0f172a}
.path-box{background:#0b0f19;border:1px dashed #334155;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:12px;color:#94a3b8;word-break:break-all}
.empty{text-align:center;color:#475569;padding:40px;font-size:14px}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:#0b0f19}
::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:#475569}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🎯 TikTok KOL 采集报告</h1>
    <div class="meta">${escHtml(OUTPUT_LABEL)} · ${timestamp} · TikHub API</div>
  </header>
  <div class="cards">
    <div class="card"><div class="label">总博主数</div><div class="value blue">${total}</div></div>
    <div class="card"><div class="label">A 级（优先）</div><div class="value green">${tierA}</div></div>
    <div class="card"><div class="label">有邮箱</div><div class="value purple">${withEmail} <span style="font-size:14px;font-weight:400">(${emailRate}%)</span></div></div>
    <div class="card"><div class="label">有 Bio Link</div><div class="value orange">${withBioLink} <span style="font-size:14px;font-weight:400">(${linkRate}%)</span></div></div>
  </div>
  <div class="section">
    <h2>📊 关键词来源分布</h2>
    ${kwBarsHtml}
  </div>
  <div class="section">
    <h2>📋 博主列表</h2>
    <div class="toolbar">
      <input type="text" id="search" placeholder="🔍 搜索博主、邮箱、关键词..." oninput="filterRows()">
      <button onclick="filterByTier('')">全部</button>
      <button onclick="filterByTier('A')">A 级</button>
      <button onclick="filterByTier('B')">B 级</button>
      <button onclick="filterByTier('C')">C 级</button>
    </div>
    <div style="overflow-x:auto">
      <table>
        <thead>
          <tr>
            <th onclick="sortTable(0)">#</th>
            <th onclick="sortTable(1)">等级</th>
            <th onclick="sortTable(2)">博主</th>
            <th onclick="sortTable(3)">粉丝</th>
            <th onclick="sortTable(4)">最高播放</th>
            <th onclick="sortTable(5)">邮箱</th>
            <th onclick="sortTable(6)">Bio Link</th>
            <th>Bio</th>
            <th onclick="sortTable(8)">来源</th>
          </tr>
        </thead>
        <tbody id="tableBody">
          ${rowsHtml}
        </tbody>
      </table>
      <div id="emptyState" class="empty" style="display:none">没有找到匹配的博主</div>
    </div>
  </div>
  <div class="section">
    <h2>📁 数据文件</h2>
    <div class="path-box">${escHtml(csvPath)}</div>
    <p style="color:#64748b;font-size:12px;margin-top:8px">同时生成 CSV 文件，可用 Excel / Numbers 打开编辑</p>
  </div>
</div>
<script>
let currentTier = '';
function filterRows(){
  const q = document.getElementById('search').value.toLowerCase();
  const rows = document.querySelectorAll('#tableBody tr');
  let visible = 0;
  rows.forEach(row => {
    const tier = row.getAttribute('data-tier');
    const search = row.getAttribute('data-search');
    const match = (!currentTier || tier === currentTier) && (!q || search.includes(q));
    row.style.display = match ? '' : 'none';
    if (match) visible++;
  });
  document.getElementById('emptyState').style.display = visible === 0 ? '' : 'none';
}
function filterByTier(tier){
  currentTier = tier;
  document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  filterRows();
}
let sortDir = 1;
function sortTable(col){
  const tbody = document.getElementById('tableBody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a,b) => {
    let av = a.cells[col].textContent.trim();
    let bv = b.cells[col].textContent.trim();
    const an = parseFloat(av.replace(/[^0-9.]/g,'')); const bn = parseFloat(bv.replace(/[^0-9.]/g,''));
    if (!isNaN(an) && !isNaN(bn)) return sortDir * (an - bn);
    return sortDir * av.localeCompare(bv);
  });
  rows.forEach(r => tbody.appendChild(r));
  sortDir *= -1;
}
</script>
${scr}
</body>
</html>`;
}

// === Report Index: write meta + rebuild index page ===
function writeMetaJson(csvPath: string, meta: Record<string, unknown>): void {
  const metaPath = csvPath.replace(/\.csv$/, ".meta.json");
  writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
}

function updateReportIndex(): void {
  const outputDir = "output";
  const metaFiles = readdirSync(outputDir)
    .filter((f) => f.startsWith("kol-") && f.endsWith(".meta.json"))
    .sort((a, b) => b.localeCompare(a));

  const records = metaFiles.map((f) => {
    const meta = JSON.parse(readFileSync(join(outputDir, f), "utf8"));
    const htmlFile = f.replace(".meta.json", ".html");
    const hasHtml = existsSync(join(outputDir, htmlFile));
    return { ...meta, htmlFile, hasHtml };
  });

  const recordsJson = JSON.stringify(records);
  const scr = "<" + "/script>";
  const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>TikTok KOL 采集中心 — 历史记录</title><style>
*{box-sizing:border-box;margin:0;padding:0}body{background:#0b0f19;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.5;min-height:100vh}.container{max-width:1100px;margin:0 auto;padding:24px}header{margin-bottom:24px}header h1{font-size:24px;font-weight:700;background:linear-gradient(90deg,#38bdf8,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent}header .meta{color:#64748b;font-size:13px;margin-top:4px}.toolbar{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}.toolbar input{background:#0b0f19;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:13px;flex:1;min-width:200px;outline:none}.toolbar input:focus{border-color:#38bdf8}.toolbar button{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:6px 12px;color:#94a3b8;font-size:12px;cursor:pointer}.toolbar button:hover{background:#334155;color:#e2e8f0}.records{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}.card{background:#111827;border:1px solid #1e293b;border-radius:10px;padding:18px;transition:border-color .2s}.card:hover{border-color:#334155}.card .top{display:flex;justify-content:space-between;align-items:start;margin-bottom:10px}.card .product{font-size:15px;font-weight:700;color:#f8fafc;text-transform:capitalize}.card .time{color:#64748b;font-size:12px}.card .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.card .stat{text-align:center}.card .stat .val{font-size:18px;font-weight:700;color:#38bdf8}.card .stat .lbl{color:#64748b;font-size:11px;margin-top:2px}.card .actions{display:flex;gap:8px;margin-top:12px}.card .actions a{flex:1;text-align:center;background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:7px 0;color:#94a3b8;font-size:12px;text-decoration:none;transition:all .2s}.card .actions a:hover{background:#1e293b;color:#e2e8f0;border-color:#38bdf8}.card .actions a.primary{border-color:#38bdf8;color:#38bdf8}.card .actions a.primary:hover{background:#38bdf8;color:#0b0f19}.empty{text-align:center;color:#475569;padding:60px 20px;font-size:14px}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;margin-left:6px}.badge.a{background:rgba(34,197,94,.15);color:#22c55e}.badge.b{background:rgba(245,158,11,.15);color:#f59e0b}.badge.c{background:rgba(239,68,68,.15);color:#ef4444}
</style></head><body><div class="container"><header><h1>📂 TikTok KOL 采集中心</h1><div class="meta">历史搜索记录 · 数据保存在本地 output/ 目录</div></header>
<div class="toolbar"><input type="text" id="search" placeholder="🔍 搜索产品名..." oninput="render()"><button onclick="clearSearch()">清除</button></div>
<div id="records" class="records"></div>
<div id="empty" class="empty" style="display:none">没有找到匹配的记录</div>
</div>
<script>
const allRecords=${recordsJson};
function fmtDate(ts){return ts.slice(0,4)+'-'+ts.slice(4,6)+'-'+ts.slice(6,8)+' '+ts.slice(8,10)+':'+ts.slice(10,12)}
function render(){const q=document.getElementById('search').value.toLowerCase();const list=allRecords.filter(r=>!q||r.product.toLowerCase().includes(q));const el=document.getElementById('records');document.getElementById('empty').style.display=list.length?'none':'';el.innerHTML=list.map(r=>\`<div class="card"><div class="top"><span class="product">\${r.product}<span class="badge \${r.aCount>0?'a':r.bCount>0?'b':'c'}">\${r.aCount}A / \${r.bCount}B / \${r.cCount}C</span></span><span class="time">\${fmtDate(r.timestamp)}</span></div><div class="stats"><div class="stat"><div class="val">\${r.total}</div><div class="lbl">博主数</div></div><div class="stat"><div class="val" style="color:#22c55e">\${r.emailCount}</div><div class="lbl">有邮箱</div></div><div class="stat"><div class="val" style="color:#a78bfa">\${r.emailRate}%</div><div class="lbl">邮箱率</div></div></div><div class="actions">\${r.hasHtml?\`<a href="\${r.htmlFile}" class="primary" target="_blank">查看报告</a>\`:'<a style="opacity:.4;cursor:not-allowed">无报告</a>'}<a href="\${r.csvFile}" download>下载 CSV</a></div></div>\`).join('')}
function clearSearch(){document.getElementById('search').value='';render()}render();
</script>${scr}</body></html>`;
  writeFileSync(join(outputDir, "index.html"), html, "utf8");
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log("🚀 开始红人采集（视频搜索 + Profile 补全）...\n");

  // Phase 1: 视频搜索发现创作者
  const creatorMap = await searchByVideos();
  console.log(`\n📊 Phase 1 完成：去重后共 ${creatorMap.size} 位博主`);

  // Phase 2: 补全 Profile（关键：获取完整 bio 和邮箱）
  await enrichWithProfile(creatorMap);

  // 评分 + 排序 + 取 Top N
  const scored = Array.from(creatorMap.values())
    .map(scoreCreator)
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, TARGET_TOTAL);

  const tierA = scored.filter((c) => c.tier === "A").length;
  const tierB = scored.filter((c) => c.tier === "B").length;
  const tierC = scored.filter((c) => c.tier === "C").length;
  const withEmail = scored.filter((c) => c.has_email).length;
  const withBioLink = scored.filter((c) => c.has_bio_link).length;

  const kwStats = new Map<string, number>();
  for (const c of scored) {
    kwStats.set(c.search_keyword, (kwStats.get(c.search_keyword) || 0) + 1);
  }

  if (!existsSync("output")) mkdirSync("output", { recursive: true });
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const filename = `output/kol-${OUTPUT_LABEL}-${ts}.csv`;
  writeFileSync(filename, toCSV(scored), "utf-8");

  const htmlFilename = filename.replace(/\.csv$/, ".html");
  writeFileSync(
    htmlFilename,
    toHTMLReport(scored, kwStats, filename, now.toLocaleString("zh-CN")),
    "utf-8"
  );

  // Meta JSON for index page
  writeMetaJson(filename, {
    product: OUTPUT_LABEL.replace(/-/g, " "),
    timestamp: ts,
    total: scored.length,
    aCount: tierA,
    bCount: tierB,
    cCount: tierC,
    emailCount: withEmail,
    emailRate: scored.length > 0 ? Math.round((withEmail / scored.length) * 100) : 0,
    bioLinkCount: withBioLink,
    csvFile: filename.split("/").pop(),
    htmlFile: htmlFilename.split("/").pop(),
  });

  // Rebuild index page
  updateReportIndex();
  console.log(`🗂️  索引页已更新：output/index.html`);

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
  console.log(`🔗 有 bioLink：${withBioLink} 位（${((withBioLink / scored.length) * 100).toFixed(1)}%）`);
  console.log(`📁 CSV：${filename}`);
  console.log(`🌐 报告：${htmlFilename}`);
  console.log("\n📌 Top 10 博主：");
  scored.slice(0, 10).forEach((c, i) => {
    const plays = c.best_video_plays >= 1_000_000
      ? (c.best_video_plays / 1_000_000).toFixed(1) + "M"
      : (c.best_video_plays / 1_000).toFixed(0) + "K";
    const emailStr = c.email ? `✉️  ${c.email}` : "无邮箱";
    console.log(
      `  ${i + 1}. @${c.unique_id} | ${c.tier}级${c.priority_score}分 | ${(c.follower_count / 1_000).toFixed(1)}K粉 | ${plays}播放 | ${emailStr}`
    );
    console.log(`     ${c.best_video_desc.slice(0, 65)}`);
  });
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
5. CSV + HTML 报告输出在 `output/` 目录（可直接双击 `.html` 文件在浏览器中查看）
6. 每次执行后自动更新 `output/index.html` —— 采集中心首页，列出所有历史搜索记录，支持按产品名搜索、查看报告、下载 CSV

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
