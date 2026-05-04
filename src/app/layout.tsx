import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "红人建联助手 — TikTok 红人建联自动化 Skill",
  description:
    "一句话找到精准合作红人。产品诊断 → 关键词策略 → 自动采集 → 建联评分 → CSV 导出，全流程 AI 自动化。兼容 Claude Code、龙虾、Codex、OpenCode 等 AI Agent。",
  openGraph: {
    title: "红人建联助手 — TikTok 红人建联自动化 Skill",
    description: "一句话找到精准合作红人，全流程 AI 自动化。",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "红人建联助手",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "红人建联助手 — TikTok 红人建联自动化 Skill",
    description: "一句话找到精准合作红人，全流程 AI 自动化。",
    images: ["/og-image.png"],
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
