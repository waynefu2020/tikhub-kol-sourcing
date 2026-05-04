const phases = [
  {
    number: "01",
    label: "产品诊断",
    en: "Product Intake",
    desc: "Claude 先了解你的产品品类、目标市场、核心卖点与竞品，再制定搜索策略。",
    icon: "◈",
  },
  {
    number: "02",
    label: "关键词策略",
    en: "Keyword Strategy",
    desc: "从品类词 / 场景词 / 竞品词 / 人群词四维度推荐 3–5 组精准关键词。",
    icon: "◎",
  },
  {
    number: "03",
    label: "确认接口",
    en: "API Confirmation",
    desc: "用户提供 TikHub 接口 URL，或使用推荐的默认接口，确认 API Key 配置。",
    icon: "◉",
  },
  {
    number: "04",
    label: "自动采集",
    en: "Auto Scrape",
    desc: "多关键词批量抓取、自动分页、全局去重、从 bio 提取邮箱，一键完成。",
    icon: "⊛",
  },
  {
    number: "05",
    label: "建联名单",
    en: "Outreach List",
    desc: "评分排序、A/B/C 三档分层、给出建联建议，输出可直接行动的 CSV 名单。",
    icon: "✦",
  },
];

const features = [
  {
    title: "四维关键词模型",
    body: "品类词 · 场景词 · 竞品词 · 人群词，系统性覆盖每个发现渠道，不遗漏任何品类契合的博主。",
    tag: "STRATEGY",
  },
  {
    title: "TikHub API 集成",
    body: "支持关键词搜用户、话题视频提取、通用搜索等多种 TikHub 接口，自动识别响应结构。",
    tag: "AUTOMATION",
  },
  {
    title: "邮箱智能提取",
    body: "从 bio 中识别 [at] / (dot) 等变体写法，提取有效邮箱，无需手动翻看每个主页。",
    tag: "EXTRACTION",
  },
  {
    title: "建联优先级评分",
    body: "有邮箱 +30 / 粉丝量匹配 +20 / 竞品词来源 +15 / PR 信号词 +10，量化筛选优先级。",
    tag: "SCORING",
  },
  {
    title: "A/B/C 三档分层",
    body: "≥60 分 A 级直接建联，40–59 分 B 级先互动，<40 分 C 级备选观察，一眼看清该跟谁。",
    tag: "SEGMENTATION",
  },
  {
    title: "UTF-8 BOM CSV",
    body: "带 BOM 的 UTF-8 编码，Excel 和 Numbers 中文直接显示，无需额外转码操作。",
    tag: "OUTPUT",
  },
];

const sampleRows = [
  { score: 85, tier: "A", username: "@stationerywithsarah", followers: "128.4K", email: "sarah@mgmt.io", keyword: "notebook review", match: "Y" },
  { score: 80, tier: "A", username: "@studywithelle", followers: "47.2K", email: "elle@creator.studio", keyword: "study with me", match: "N" },
  { score: 75, tier: "A", username: "@plannergirlmaya", followers: "312.8K", email: "maya@plannerlife.com", keyword: "rocketbook review", match: "Y" },
  { score: 55, tier: "B", username: "@desksetupjake", followers: "89.6K", email: null, keyword: "desk setup", match: "N" },
  { score: 50, tier: "B", username: "@collegeessentials_", followers: "23.1K", email: null, keyword: "college essentials", match: "N" },
  { score: 30, tier: "C", username: "@backtoschoolvibes", followers: "8.9K", email: null, keyword: "back to school", match: "N" },
];

const tierColor: Record<string, string> = {
  A: "bg-[#FE2C55] text-white",
  B: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  C: "bg-white/5 text-white/40 border border-white/10",
};

export default function HomePage() {
  return (
    <div className="bg-[#080808] text-white overflow-x-hidden min-h-screen">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#FE2C55]" />
          <span className="text-sm font-mono text-white/60">tikhub-kol-sourcing</span>
        </div>
        <a
          href="https://github.com/waynefu2020/tikhub-kol-sourcing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white/80 transition-colors border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative z-10 pt-20 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px w-8 bg-[#FE2C55]" />
          <span className="text-[#FE2C55] text-xs tracking-[0.25em] uppercase font-mono">
            AI Agent Skill
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.92] tracking-tight mb-6">
              <span className="block text-white">红人</span>
              <span className="block text-[#FE2C55]">建联</span>
              <span className="block text-white/30">助手</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm mb-10 font-light">
              从产品诊断到建联名单，全流程自动化。只需告诉 AI
              你卖什么，剩下的交给它。
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["TikHub API", "多关键词批量", "邮箱提取", "A/B/C 分层", "CSV 输出"].map((tag) => (
                <span key={tag} className="px-3 py-1 text-xs font-mono text-white/50 border border-white/10 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {["Claude Code", "OpenClaw", "Codex", "OpenCode"].map((agent) => (
                <span key={agent} className="px-3 py-1 text-xs font-mono text-[#FE2C55]/60 border border-[#FE2C55]/20 rounded-full">
                  {agent}
                </span>
              ))}
            </div>
          </div>

          {/* Terminal */}
          <div className="relative">
            <div className="absolute -inset-8 bg-[#FE2C55]/5 rounded-3xl blur-2xl" />
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#111111] shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-xs text-white/30 font-mono">agent — ~/my-project</span>
              </div>
              <div className="px-5 py-5 font-mono text-sm space-y-3">
                <div className="flex gap-2">
                  <span className="text-[#FE2C55]">▶</span>
                  <span className="text-white/80">帮我找一批 TikTok 博主合作</span>
                </div>
                <div className="text-white/40 text-xs pl-4 space-y-1">
                  <p><span className="text-[#FE2C55]/70">●</span> 检测到：红人建联助手技能</p>
                </div>
                <div className="pl-4 text-white/60 text-xs space-y-1">
                  <p>好的！在开始之前，我先了解一下你的产品：</p>
                  <p className="text-white/30 mt-2">1. 产品名称和品类？</p>
                  <p className="text-white/30">2. 目标市场是哪个国家？</p>
                  <p className="text-white/30">3. 核心卖点是什么？</p>
                  <p className="text-white/30">4. 有没有主要的竞品品牌？</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="text-[#FE2C55]">▶</span>
                  <span className="text-white/50">ideaShell 智能笔记本，主打美国市场...</span>
                </div>
                <div className="pl-4 text-white/40 text-xs space-y-1">
                  <p><span className="text-emerald-400">✓</span> 推荐关键词：notebook review · study with me · rocketbook review · college essentials</p>
                  <p><span className="text-emerald-400">✓</span> 开始抓取，共 4 组关键词...</p>
                  <p><span className="text-emerald-400">✓</span> 采集完成：112 位博主，A 级 23 位，有邮箱 31 位</p>
                  <p><span className="text-emerald-400">✓</span> <span className="text-white/60">output/kol-stationery-20260503-143022.csv</span></p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[#FE2C55]">▶</span>
                  <span className="w-2 h-4 bg-white/60 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PHASES ───────────────────────────────────────────── */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px w-8 bg-[#FE2C55]" />
            <span className="text-[#FE2C55] text-xs tracking-[0.25em] uppercase font-mono">Workflow</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {phases.map((p) => (
              <div key={p.number} className="group rounded-2xl border border-white/8 bg-[#111111] p-6 hover:border-[#FE2C55]/30 hover:bg-[#151515] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-black text-white/10 group-hover:text-[#FE2C55]/20 transition-colors">{p.number}</span>
                  <span className="text-xl text-white/20 group-hover:text-[#FE2C55]/40 transition-colors">{p.icon}</span>
                </div>
                <p className="text-xs font-mono text-[#FE2C55]/60 mb-1 tracking-wider uppercase">{p.en}</p>
                <h3 className="text-base font-bold text-white mb-3">{p.label}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-[#FE2C55]" />
            <span className="text-[#FE2C55] text-xs tracking-[0.25em] uppercase font-mono">Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-12">每个细节都为运营效率而设计</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-white/8 bg-[#0f0f0f] p-6 hover:border-[#FE2C55]/20 hover:bg-[#131313] transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-base font-bold text-white">{f.title}</h3>
                  <span className="text-[10px] font-mono text-[#FE2C55]/50 tracking-widest border border-[#FE2C55]/20 px-2 py-0.5 rounded ml-2 shrink-0">{f.tag}</span>
                </div>
                <p className="text-sm text-white/45 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CSV PREVIEW ──────────────────────────────────────── */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-[#FE2C55]" />
            <span className="text-[#FE2C55] text-xs tracking-[0.25em] uppercase font-mono">Output Preview</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">打开 CSV，优先级一目了然</h2>
          <p className="text-white/40 mb-10 text-sm">按 priority_score 降序排列 · A 级博主在最顶部 · 运营直接从第一行开始联系</p>
          <div className="rounded-2xl border border-white/8 bg-[#0f0f0f] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FE2C55]" />
              <span className="text-xs font-mono text-white/30">kol-stationery-20260503-143022.csv</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/5">
                    {["SCORE", "TIER", "USERNAME", "FOLLOWERS", "EMAIL", "KEYWORD", "BIO MATCH"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-white/25 font-normal tracking-widest text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3"><span className="text-white font-bold">{row.score}</span></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-black ${tierColor[row.tier]}`}>{row.tier}</span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{row.username}</td>
                      <td className="px-4 py-3 text-white/50">{row.followers}</td>
                      <td className="px-4 py-3">{row.email ? <span className="text-emerald-400">{row.email}</span> : <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3 text-white/35">{row.keyword}</td>
                      <td className="px-4 py-3">{row.match === "Y" ? <span className="text-emerald-400 text-[10px] tracking-widest">Y</span> : <span className="text-white/20 text-[10px]">N</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/5 flex flex-wrap gap-6">
              {[
                { tier: "A", label: "优先建联 ≥60", cls: "bg-[#FE2C55] text-white" },
                { tier: "B", label: "值得联系 40–59", cls: "bg-amber-500/20 text-amber-400" },
                { tier: "C", label: "备选观察 <40", cls: "bg-white/5 text-white/40" },
              ].map((t) => (
                <div key={t.tier} className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-black ${t.cls}`}>{t.tier}</span>
                  <span className="text-xs text-white/30">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SCORING ──────────────────────────────────────────── */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-[#FE2C55]" />
            <span className="text-[#FE2C55] text-xs tracking-[0.25em] uppercase font-mono">Scoring Model</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-10">建联优先级评分模型</h2>
          <div className="grid md:grid-cols-2 gap-3 max-w-3xl">
            {[
              { signal: "有邮箱（可直接联系）", pts: "+30", color: "text-[#FE2C55]" },
              { signal: "粉丝量在目标区间", pts: "+20", color: "text-[#FE2C55]" },
              { signal: "Bio 含品类关键词", pts: "+15", color: "text-amber-400" },
              { signal: "来自竞品词搜索", pts: "+15", color: "text-amber-400" },
              { signal: "活跃创作者（视频数 >30）", pts: "+10", color: "text-white/50" },
              { signal: "来自场景词搜索", pts: "+10", color: "text-white/50" },
              { signal: "Bio 含 PR/collab/合作 等信号词", pts: "+10", color: "text-white/50" },
            ].map((row) => (
              <div key={row.signal} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/6 bg-[#0f0f0f]">
                <span className="text-sm text-white/60">{row.signal}</span>
                <span className={`font-mono font-bold text-sm ${row.color}`}>{row.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK START ──────────────────────────────────────── */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8 bg-[#FE2C55]" />
            <span className="text-[#FE2C55] text-xs tracking-[0.25em] uppercase font-mono">Quick Start</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-10">一句话开始</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { step: "1", title: "Clone 到项目", code: "git clone github.com/waynefu2020/tikhub-kol-sourcing", desc: "把 skill/ 目录放入你的项目根目录，Agent 会自动读取。" },
              { step: "2", title: "配置 TikHub Key", code: "TIKHUB_API_KEY=your_key", desc: "在项目 .env 文件中添加 TikHub API Key，在 tikhub.io 获取。" },
              { step: "3", title: "说一句话", code: "帮我找一批 TikTok 博主合作", desc: "Skill 自动触发，AI 开始引导你完成完整的 5 步建联流程。" },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl border border-white/8 bg-[#0f0f0f] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full border border-[#FE2C55]/30 text-[#FE2C55] text-xs font-mono font-bold flex items-center justify-center">{s.step}</span>
                  <h3 className="text-sm font-bold text-white">{s.title}</h3>
                </div>
                <div className="font-mono text-xs bg-black/40 rounded-lg px-3 py-2 mb-3 text-white/70 border border-white/5 break-all">{s.code}</div>
                <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#0f0f0f] p-6">
            <p className="text-xs font-mono text-white/30 mb-4 tracking-widest uppercase">触发短语 — 以下任意一句都能激活 Skill</p>
            <div className="flex flex-wrap gap-2">
              {["帮我找一批 TikTok 博主合作", "我要做红人建联", "抓红人到 CSV", "帮我搜一批博主", "我想找 skincare 类的红人", "用 TikHub 抓红人", "准备开始建联名单"].map((phrase) => (
                <span key={phrase} className="px-3 py-1.5 text-xs font-mono bg-[#FE2C55]/8 text-[#FE2C55]/70 border border-[#FE2C55]/15 rounded-lg">
                  &ldquo;{phrase}&rdquo;
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 border-t border-white/5">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">红人建联助手</p>
            <p className="text-xs text-white/30 mt-1">tikhub-kol-sourcing · AI Agent Skill</p>
          </div>
          <a
            href="https://github.com/waynefu2020/tikhub-kol-sourcing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 font-mono transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            github.com/waynefu2020/tikhub-kol-sourcing
          </a>
        </div>
      </footer>
    </div>
  );
}
