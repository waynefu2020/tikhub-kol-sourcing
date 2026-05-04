"use client";

const phases = [
  {
    number: "01",
    label: "产品诊断",
    en: "Product Intake",
    desc: "Claude 先了解你的产品品类、目标市场、核心卖点与竞品，再制定搜索策略。",
    icon: "🎯",
    color: "bg-orange-500",
  },
  {
    number: "02",
    label: "关键词策略",
    en: "Keyword Strategy",
    desc: "从品类词 / 场景词 / 竞品词 / 人群词四维度推荐 3–5 组精准关键词。",
    icon: "🔍",
    color: "bg-blue-500",
  },
  {
    number: "03",
    label: "确认配置",
    en: "Configuration",
    desc: "AI 自动选择最佳接口，确认 API Key 即可开始采集。",
    icon: "🔗",
    color: "bg-purple-500",
  },
  {
    number: "04",
    label: "自动采集",
    en: "Auto Scrape",
    desc: "多关键词批量抓取、自动分页、全局去重、从 bio 提取邮箱，一键完成。",
    icon: "⚡",
    color: "bg-emerald-500",
  },
  {
    number: "05",
    label: "建联名单",
    en: "Outreach List",
    desc: "评分排序、A/B/C 三档分层、给出建联建议，输出可直接行动的 CSV 名单。",
    icon: "📋",
    color: "bg-rose-500",
  },
];

const features = [
  {
    title: "亚马逊商品解析",
    body: "粘贴亚马逊链接，自动提取品牌、品类、卖点，支持 OpenCLI 一键抓取，零门槛也能手动输入。",
    tag: "NEW",
    icon: "🛒",
    blob: "bg-amber-500",
  },
  {
    title: "四维关键词模型",
    body: "品类词 · 场景词 · 竞品词 · 人群词，系统性覆盖每个发现渠道，不遗漏任何品类契合的博主。",
    tag: "STRATEGY",
    icon: "🗺️",
    blob: "bg-orange-500",
  },
  {
    title: "TikHub API 集成",
    body: "支持关键词搜用户、话题视频提取、通用搜索等多种 TikHub 接口，自动识别响应结构。",
    tag: "AUTOMATION",
    icon: "🤖",
    blob: "bg-blue-500",
  },
  {
    title: "邮箱智能提取",
    body: "从 bio 中识别 [at] / (dot) 等变体写法，提取有效邮箱，无需手动翻看每个主页。",
    tag: "EXTRACTION",
    icon: "📧",
    blob: "bg-purple-500",
  },
  {
    title: "建联优先级评分",
    body: "有邮箱 +30 / 粉丝量匹配 +20 / 竞品词来源 +15 / PR 信号词 +10，量化筛选优先级。",
    tag: "SCORING",
    icon: "⭐",
    blob: "bg-emerald-500",
  },
  {
    title: "A/B/C 三档分层",
    body: "≥60 分 A 级直接建联，40–59 分 B 级先互动，<40 分 C 级备选观察，一眼看清该跟谁。",
    tag: "SEGMENTATION",
    icon: "🏆",
    blob: "bg-rose-500",
  },
  {
    title: "UTF-8 BOM CSV",
    body: "带 BOM 的 UTF-8 编码，Excel 和 Numbers 中文直接显示，无需额外转码操作。",
    tag: "OUTPUT",
    icon: "📁",
    blob: "bg-cyan-500",
  },
];

const sampleRows = [
  { score: 85, tier: "A", username: "@smoothieswithsam", followers: "89.3K", email: "sam@creator.studio", keyword: "portable blender review", match: "Y" },
  { score: 80, tier: "A", username: "@healthyjen_official", followers: "156.7K", email: "jen@influencemgmt.com", keyword: "smoothie recipe", match: "Y" },
  { score: 75, tier: "A", username: "@blendjetvsthis", followers: "43.2K", email: "collab@blendvsthis.com", keyword: "blendjet alternative", match: "N" },
  { score: 55, tier: "B", username: "@mealprepsunday_", followers: "67.4K", email: null, keyword: "meal prep", match: "N" },
  { score: 50, tier: "B", username: "@fitnessjourneyalex", followers: "28.9K", email: null, keyword: "healthy breakfast", match: "Y" },
  { score: 30, tier: "C", username: "@gymvlogs_official", followers: "12.1K", email: null, keyword: "gym snacks", match: "N" },
];

const tierBadge: Record<string, string> = {
  A: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  B: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  C: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

import { useState, useEffect, useRef } from "react";

const githubUrl = "https://github.com/waynefu2020/tikhub-kol-sourcing";

export default function HomePage() {
  // Terminal typewriter lines
  const terminalLines = [
    { type: "input", text: "帮我找红人：https://amazon.sg/dp/B0BBMQ7C6Q" },
    { type: "system", text: "检测到亚马逊链接，使用 OpenCLI 解析..." },
    { type: "success", text: "品牌：Braun | 品类：咖啡机 | 评分：4.1⭐ (642评论)" },
    { type: "ai", text: "目标市场是哪个国家？核心卖点是什么？" },
    { type: "input", text: "新加坡，OptiBrew 系统，10 杯容量" },
    { type: "success", text: "推荐关键词：coffee maker review · morning coffee routine · braun coffee" },
    { type: "success", text: "开始抓取，共 3 组关键词..." },
    { type: "success", text: "采集完成：76 位博主，A 级 15 位，有邮箱 22 位" },
    { type: "file", text: "output/kol-coffee-20260504.csv" },
  ];
  const [terminalStep, setTerminalStep] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const startAnimation = () => {
      interval = setInterval(() => {
        setTerminalStep((prev) => {
          if (prev >= terminalLines.length) {
            clearInterval(interval);
            timeout = setTimeout(() => {
              setTerminalStep(0);
              startAnimation();
            }, 3000);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
    };

    startAnimation();

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalStep]);
  return (
    <div
      className="text-white overflow-x-hidden min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 75% 20%, #1a0818 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, #080a2a 0%, transparent 50%), #080E1A",
      }}
    >
      {/* Subtle grain */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#080E1A]/80 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-sm">🎯</div>
          <span className="text-sm font-semibold text-white">红人建联助手</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
          <a href="#workflow" className="hover:text-white transition-colors">工作流程</a>
          <a href="#scoring" className="hover:text-white transition-colors">评分模型</a>
          <a href="#quickstart" className="hover:text-white transition-colors">接入指南</a>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
        >
          免费获取 Skill
        </a>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative z-10 pt-20 pb-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Powered by TikHub API · AI Agent Skill</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              <span className="block text-white">一句话</span>
              <span className="block text-blue-400">找到精准合作红人</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-10">
              不用写代码、不用翻主页，告诉 AI 你卖什么，它帮你找红人、评分、输出建联名单。
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3 rounded-full transition-colors"
              >
                开始建联
              </a>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/20 hover:border-white/40 text-white/80 hover:text-white font-semibold px-8 py-3 rounded-full transition-colors"
              >
                查看 GitHub
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>兼容：</span>
              {["Claude Code", "OpenClaw", "Codex", "OpenCode"].map((a) => (
                <span key={a} className="text-slate-400">{a}</span>
              ))}
            </div>
          </div>

          {/* Right — Terminal */}
          <div className="relative">
            {/* Glow behind terminal */}
            <div className="absolute -inset-8 bg-blue-500/8 rounded-3xl blur-3xl" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d1424] shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#111928] border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                <span className="ml-3 text-xs text-white/30 font-mono">agent — ~/my-project</span>
              </div>
              <div ref={terminalRef} className="px-5 py-5 font-mono text-sm space-y-3 max-h-[320px] overflow-y-auto">
                {terminalLines.slice(0, terminalStep).map((line, i) => (
                  <div key={i} className={i === terminalStep - 1 ? "animate-fadeIn" : ""}>
                    {line.type === "input" && (
                      <div className="flex gap-2">
                        <span className="text-blue-400">▶</span>
                        <span className="text-white/80">{line.text}</span>
                      </div>
                    )}
                    {line.type === "system" && (
                      <div className="text-slate-500 text-xs pl-4">
                        <span className="text-blue-400">●</span> {line.text}
                      </div>
                    )}
                    {line.type === "ai" && (
                      <div className="pl-4 text-slate-400 text-xs">{line.text}</div>
                    )}
                    {line.type === "success" && (
                      <div className="pl-4 text-slate-500 text-xs">
                        <span className="text-emerald-400">✓</span> {line.text}
                      </div>
                    )}
                    {line.type === "file" && (
                      <div className="pl-4 text-slate-500 text-xs">
                        <span className="text-emerald-400">✓</span> <span className="text-slate-300">{line.text}</span>
                      </div>
                    )}
                  </div>
                ))}
                {terminalStep >= terminalLines.length && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-blue-400">▶</span>
                    <span className="w-2 h-4 bg-white/60 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
              A级博主 19位
            </div>
            <div className="absolute -bottom-3 -left-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
              有邮箱 27位
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto py-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
          {[
            { num: "98+", label: "位博主一次采集" },
            { num: "50%+", label: "有邮箱率" },
            { num: "5 步", label: "全自动完成" },
            { num: "A·B·C", label: "三档优先级" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center px-4 gap-1">
              <span className="text-2xl font-black text-white">{s.num}</span>
              <span className="text-xs text-slate-500 text-center">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PHASES ───────────────────────────────────────────── */}
      <section id="workflow" className="relative z-10 py-24 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">Five-Phase Workflow</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">五步完成红人建联全流程</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {phases.map((p, i) => (
            <div key={p.number} className="relative group rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] hover:border-blue-500/30 p-6 transition-all duration-300">
              {/* Arrow connector */}
              {i < phases.length - 1 && (
                <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-white/20 text-xs">›</div>
              )}
              <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center text-lg mb-4`}>
                {p.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-blue-500 font-mono">{p.number}</span>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{p.en}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{p.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="relative z-10 py-24 border-t border-white/[0.06] px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">Core Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">每个细节都为运营效率而设计</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05] hover:border-blue-500/20 p-6 transition-all duration-300"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-xl ${f.blob} flex items-center justify-center text-xl shrink-0`}>
                  {f.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-500/70 tracking-widest uppercase">{f.tag}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{f.title}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CSV PREVIEW ──────────────────────────────────────── */}
      <section className="relative z-10 py-24 border-t border-white/[0.06] px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">Sample Output</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">打开 CSV，优先级一目了然</h2>
          <p className="text-slate-500 text-sm">按 priority_score 降序排列 · A 级博主在最顶部 · 运营直接从第一行开始联系</p>
        </div>
        <div className="mt-10 rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-mono text-slate-500">kol-blender-20260504-091532.csv</span>
            </div>
            <div className="flex gap-3">
              {[
                { tier: "A", label: "优先建联 ≥60", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
                { tier: "B", label: "值得联系 40–59", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
                { tier: "C", label: "备选观察 <40", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
              ].map((t) => (
                <div key={t.tier} className="hidden sm:flex items-center gap-1.5">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-black border ${t.cls}`}>{t.tier}</span>
                  <span className="text-[10px] text-slate-500">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["SCORE", "TIER", "USERNAME", "FOLLOWERS", "EMAIL", "KEYWORD", "BIO"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-slate-600 font-normal tracking-widest text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3"><span className="text-white font-bold">{row.score}</span></td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-black border ${tierBadge[row.tier]}`}>{row.tier}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.username}</td>
                    <td className="px-4 py-3 text-slate-500">{row.followers}</td>
                    <td className="px-4 py-3">{row.email ? <span className="text-emerald-400">{row.email}</span> : <span className="text-slate-700">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500">{row.keyword}</td>
                    <td className="px-4 py-3">{row.match === "Y" ? <span className="text-emerald-400 text-[10px] tracking-wider">Y</span> : <span className="text-slate-700 text-[10px]">N</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SCORING ──────────────────────────────────────────── */}
      <section id="scoring" className="relative z-10 py-24 border-t border-white/[0.06] px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">Outreach Scoring</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">建联优先级评分模型</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Signals */}
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-4">评分信号</p>
            {[
              { signal: "有邮箱（可直接联系）", pts: "+30", border: "border-l-blue-500", text: "text-blue-400" },
              { signal: "粉丝量在目标区间", pts: "+20", border: "border-l-blue-400", text: "text-blue-400" },
              { signal: "Bio 含品类关键词", pts: "+15", border: "border-l-cyan-500", text: "text-cyan-400" },
              { signal: "来自竞品词搜索", pts: "+15", border: "border-l-cyan-500", text: "text-cyan-400" },
              { signal: "活跃创作者（视频数 >30）", pts: "+10", border: "border-l-slate-500", text: "text-slate-400" },
              { signal: "来自场景词搜索", pts: "+10", border: "border-l-slate-500", text: "text-slate-400" },
              { signal: "Bio 含 PR/collab/合作 等信号词", pts: "+10", border: "border-l-slate-500", text: "text-slate-400" },
            ].map((row) => (
              <div key={row.signal} className={`flex items-center justify-between px-4 py-3 rounded-xl border-l-2 ${row.border} bg-white/[0.03] border border-white/[0.07]`}>
                <span className="text-sm text-slate-400">{row.signal}</span>
                <span className={`font-mono font-black text-sm ${row.text}`}>{row.pts}</span>
              </div>
            ))}
          </div>
          {/* Tiers */}
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-4">博主分层</p>
            {[
              {
                tier: "A",
                range: "≥ 60 分",
                label: "优先建联",
                desc: "有邮箱、粉丝量合适、来自竞品词的博主。建议直接发开发信，转化率最高。",
                cls: "border-emerald-500/30 bg-emerald-500/5",
                badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                pts: "text-emerald-400",
              },
              {
                tier: "B",
                range: "40 – 59 分",
                label: "值得联系",
                desc: "粉丝量匹配或有品类 bio，但暂无邮箱。建议先互动几次，再发私信建联。",
                cls: "border-amber-500/30 bg-amber-500/5",
                badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                pts: "text-amber-400",
              },
              {
                tier: "C",
                range: "< 40 分",
                label: "备选观察",
                desc: "规模较小或匹配度较低。可放入候选池持续观察，等待合适时机再接触。",
                cls: "border-slate-500/30 bg-slate-500/5",
                badge: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
                pts: "text-slate-400",
              },
            ].map((t) => (
              <div key={t.tier} className={`rounded-2xl border p-6 ${t.cls}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black border ${t.badge}`}>{t.tier}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{t.label}</p>
                    <p className={`text-xs font-mono ${t.pts}`}>{t.range}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUICK START ──────────────────────────────────────── */}
      <section id="quickstart" className="relative z-10 py-24 border-t border-white/[0.06] px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">Quick Start</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">一句话开始建联</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            {
              step: "1",
              title: "获取 Skill 文件",
              code: "git clone github.com/waynefu2020/tikhub-kol-sourcing",
              altCode: "或下载 ZIP 解压",
              desc: "把 skill/ 目录放入你的项目根目录，AI Agent 会自动读取技能定义。",
              color: "bg-blue-500",
            },
            {
              step: "2",
              title: "安装 OpenCLI（可选）",
              code: "npm install -g @jackwener/opencli",
              desc: "可选步骤，安装后可自动解析亚马逊商品链接，不装也能手动输入。",
              color: "bg-amber-500",
            },
            {
              step: "3",
              title: "配置 TikHub API Key",
              code: "TIKHUB_API_KEY=your_key_here",
              desc: "在项目 .env 文件中添加 TikHub API Key，在 tikhub.io 注册获取。",
              color: "bg-purple-500",
            },
            {
              step: "4",
              title: "说一句话触发",
              code: "帮我找一批 TikTok 博主合作",
              desc: "Skill 自动触发，AI 开始引导你完成完整的 5 步建联流程。",
              color: "bg-emerald-500",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-8 h-8 rounded-full ${s.color} text-white text-sm font-black flex items-center justify-center`}>{s.step}</span>
                <h3 className="text-sm font-bold text-white">{s.title}</h3>
              </div>
              <div className="font-mono text-xs bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2.5 mb-2 text-slate-300 break-all">{s.code}</div>
              {s.altCode && (
                <a
                  href={`${githubUrl}/archive/refs/heads/main.zip`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mb-4 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {s.altCode}
                </a>
              )}
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        {/* Trigger phrases */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <p className="text-[10px] font-bold text-slate-600 tracking-widest uppercase mb-4">触发短语 — 以下任意一句都能激活 Skill</p>
          <div className="flex flex-wrap gap-2">
            {["帮我找一批 TikTok 博主合作", "这是我的亚马逊链接，帮我找红人", "我要做红人建联", "抓红人到 CSV", "帮我搜一批博主", "我想找 skincare 类的红人", "用 TikHub 抓红人"].map((phrase) => (
              <span key={phrase} className="px-3 py-1.5 text-xs font-mono bg-blue-500/8 text-blue-400/70 border border-blue-500/15 rounded-lg">
                &ldquo;{phrase}&rdquo;
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 border-t border-white/[0.06] px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-black text-white">常见问题</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {[
            {
              q: "有亚马逊链接能直接用吗？",
              a: "可以！粘贴链接自动解析商品信息。推荐安装 OpenCLI 一键抓取，不装也能手动输入。",
            },
            {
              q: "OpenCLI 是什么？怎么安装？",
              a: "免费开源工具，能把亚马逊等网站变成命令行。运行 npm install -g @jackwener/opencli 即可安装。",
            },
            {
              q: "需要会写代码吗？",
              a: "完全不需要。只要会用 AI Agent（如 Claude Code），说一句话就能触发完整流程。",
            },
            {
              q: "需要 TikHub 账号吗？",
              a: "需要。在 tikhub.io 注册获取 API Key，免费额度即可开始。",
            },
            {
              q: "支持哪些国家？",
              a: "全球 TikTok 内容都支持。关键词语言跟随目标市场，美国用英文，日本用日文等。",
            },
            {
              q: "一次能采集多少博主？",
              a: "通常 50-200 位，取决于关键词数量和去重结果。可调整抓取量。",
            },
            {
              q: "邮箱准确吗？",
              a: "邮箱直接从博主 bio 提取，准确率高。但部分博主可能已更换邮箱。",
            },
            {
              q: "数据怎么导出？",
              a: "自动输出 CSV 文件，带 BOM 编码，Excel / Numbers 直接打开，中文正常显示。",
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
              <h3 className="text-sm font-bold text-white mb-2">{faq.q}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 border-t border-white/[0.06]">
        <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center text-sm">🎯</div>
            <span className="text-sm font-bold text-white">红人建联助手</span>
          </div>
          <p className="text-xs text-slate-600">tikhub-kol-sourcing · AI Agent Skill · MIT License</p>
          <div className="flex items-center gap-4">
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.xiaohongshu.com/user/profile/6391a19d000000001f0180f2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              小红书
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
