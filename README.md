# 红人建联助手 · tikhub-kol-sourcing

> AI Agent Skill — TikTok 红人建联自动化 Skill

**官网**: [tikhub-kol-sourcing.netlify.app](https://tikhub-kol-sourcing.netlify.app)

**兼容**: Claude Code · 龙虾 · Codex · OpenCode 及其他支持 Skill 的 AI Agent

---

## 这是什么

一个 AI Agent Skill，帮助非技术的 KOL 运营人员完成从产品理解到红人建联名单的全流程：

```
产品诊断 → 关键词策略 → TikHub 采集 → 建联评分 → CSV 输出
```

不需要写代码，不需要懂 API，只需要告诉 AI 你卖什么产品。

---

## 快速上手

### 1. 把 skill/ 目录放入你的项目

```bash
git clone https://github.com/waynefu2020/tikhub-kol-sourcing.git
cp -r tikhub-kol-sourcing/skill /your-project/skill
```

或直接 clone 本 repo 作为项目目录使用。

### 2. 配置 TikHub API Key

在项目根目录创建 `.env` 文件：

```env
TIKHUB_API_KEY=你的密钥
```

在 [tikhub.io](https://tikhub.io) 注册获取 API Key。

### 3. 启动 AI Agent，说一句话

```
帮我找一批 TikTok 博主合作
```

其他触发短语：

- "我要做红人建联，帮我采集一批博主"
- "用 TikHub 抓红人导出 CSV"
- "帮我搜一批博主，准备开始建联"
- "我想找 skincare 类的红人"

---

## 工作流程（5 步）

| Phase | 说明 |
|-------|------|
| **01 产品诊断** | AI 收集产品名称、品类、目标市场、核心卖点、竞品等 7 个维度 |
| **02 关键词策略** | 从品类词 / 场景词 / 竞品词 / 人群词四维度推荐 3–5 组关键词 |
| **03 确认接口** | 用户提供 TikHub 接口，或使用推荐的默认接口 |
| **04 自动采集** | 多关键词批量抓取、自动分页、全局去重、邮箱提取 |
| **05 建联名单** | A/B/C 分层评分、输出 CSV + 可操作建联建议 |

---

## 建联优先级评分

| 信号 | 分值 |
|------|------|
| 有邮箱（可直接联系） | +30 |
| 粉丝量在目标区间 | +20 |
| Bio 含品类关键词 | +15 |
| 来自竞品词搜索 | +15 |
| 活跃创作者（视频数 >30） | +10 |
| 来自场景词搜索 | +10 |
| Bio 含 PR/collab/合作 等信号词 | +10 |

- **A 级（≥60）** — 直接发开发信
- **B 级（40–59）** — 先互动再建联
- **C 级（<40）** — 备选观察

---

## CSV 输出列

```
priority_score, tier, username, nickname, follower_count, video_count,
bio, email, profile_url, search_keyword, has_email, bio_category_match
```

---

## 文件结构

```
tikhub-kol-sourcing/
├── skill/                        ← 放入你的项目使用
│   ├── SKILL.md                  # Skill 主定义（触发条件 + 5 Phase 流程）
│   └── references/
│       ├── product-intake.md     # 产品诊断模板 + 7 大品类关键词策略
│       ├── endpoints.md          # TikHub 接口速查
│       ├── script-template.md    # 完整 TypeScript 采集脚本模板
│       └── outreach-scoring.md   # 评分模型 + 博主分层逻辑
└── src/                          ← 展示网站源码
    └── app/
        ├── layout.tsx
        └── page.tsx
```

---

## 技术说明

Skill 采集脚本的关键特性：

- **独立运行**：脚本内联 `tikhubFetch` 和 `extractEmails`，不依赖外部模块
- **响应结构自动检测**：`user_list` → `users` → `aweme_list` → `data.data` cascade
- **自动分页**：每关键词最多 10 页，页间 1 秒间隔避免限流
- **多关键词批量**：一次任务支持多组关键词，按 `unique_id` 全局去重
- **UTF-8 BOM CSV**：带 BOM 编码，Excel/Numbers 中文直接显示

---

## License

MIT
