"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md" style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }} />
            <span className="text-sm font-bold gradient-text">NFT Marketplace</span>
          </div>

          <nav className="flex items-center gap-4 text-xs text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <Link href="/create" className="hover:text-primary transition-colors">Tạo NFT</Link>
            <Link href="/activity" className="hover:text-primary transition-colors">Hoạt động</Link>
            <a
              href="https://github.com/98tttm/NFTMarketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Github size={12} /> GitHub
            </a>
          </nav>

          <p className="text-xs text-text-muted">
            &copy; 2026 NFT Marketplace
          </p>
        </div>
      </div>
    </footer>
  );
}
