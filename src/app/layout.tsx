import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "红人建联助手 — TikHub KOL Sourcing Skill",
  description:
    "帮 KOL 运营从零开始获取 TikTok 红人建联名单。产品诊断 → 关键词策略 → 自动采集 → 建联评分 → CSV 导出。兼容 Claude Code、OpenClaw、Codex、OpenCode 等 AI Agent。",
  openGraph: {
    title: "红人建联助手 — TikHub KOL Sourcing Skill",
    description: "帮 KOL 运营从零开始获取 TikTok 红人建联名单，全流程 AI 自动化。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="antialiased">{children}</body>
    </html>
  );
}
