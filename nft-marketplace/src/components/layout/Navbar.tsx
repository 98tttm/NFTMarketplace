"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, User, Tag, LogOut, Wallet } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { shortenAddress } from "@/lib/contracts";
import { useWalletStatus } from "@/hooks/useWalletStatus";
import { TransactionButton } from "@/components/TransactionPanel";
import { NotificationBell } from "@/components/NotificationPanel";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/activity", label: "Hoạt động" },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { balance } = useWalletStatus();
  const { disconnect } = useDisconnect();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 w-full border-b border-border"
        style={{ background: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(20px)" }}
        animate={{ boxShadow: scrolled ? "0 4px 30px rgba(139,92,246,0.1)" : "none" }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <DiamondIcon />
            <span className="text-lg font-bold gradient-text hidden sm:inline">NFT Market</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm transition-colors hover:text-text-primary"
                  style={{ fontWeight: active ? 600 : 400, color: active ? "#F9FAFB" : "#9CA3AF" }}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #8B5CF6, #3B82F6)" }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2.5">
            {isConnected && (
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                <Plus size={15} />
                <span className="hidden lg:inline">Tạo NFT</span>
              </Link>
            )}

            {isConnected && (
              <>
                <TransactionButton />
                <NotificationBell />
              </>
            )}

            {/* Profile Button + Dropdown */}
            {isConnected && address ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 transition-colors hover:border-primary"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary" />
                  <span className="text-sm font-medium text-text-primary hidden sm:inline">
                    {shortenAddress(address)}
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-background shadow-2xl shadow-black/40 overflow-hidden z-50"
                    >
                      {/* Profile Info */}
                      <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{shortenAddress(address)}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Wallet size={12} className="text-text-muted" />
                              <span className="text-xs text-text-muted">Số dư:</span>
                              <span className="text-xs font-bold text-primary">{balance} ETH</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href={`/profile/${address}`}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                        >
                          <User size={16} /> Trang cá nhân
                        </Link>
                        <Link
                          href="/create"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                        >
                          <Plus size={16} /> Tạo sản phẩm
                        </Link>
                        <Link
                          href={`/profile/${address}`}
                          onClick={() => { setProfileOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                        >
                          <Tag size={16} /> Bán sản phẩm
                        </Link>
                      </div>

                      {/* Disconnect */}
                      <div className="border-t border-border py-1">
                        <button
                          onClick={() => { disconnect(); setProfileOpen(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                        >
                          <LogOut size={16} /> Ngắt kết nối ví
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => {
                  if (!mounted) return null;
                  return (
                    <button
                      onClick={openConnectModal}
                      className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/25"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                    >
                      Kết nối ví
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 z-50 h-full w-64 border-l border-border bg-background p-6 md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold gradient-text">Danh mục</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => {
                  const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
                  return (
                    <Link key={link.href} href={link.href} className="rounded-xl px-4 py-3 text-sm font-medium transition-colors" style={{ background: active ? "rgba(139,92,246,0.1)" : "transparent", color: active ? "#A855F7" : "#9CA3AF" }}>
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {isConnected && address && (
                <div className="mt-6 flex flex-col gap-1 border-t border-border pt-6">
                  <div className="px-4 py-2 mb-2">
                    <p className="text-xs text-text-muted">Số dư</p>
                    <p className="text-sm font-bold text-primary">{balance} ETH</p>
                  </div>
                  <Link href={`/profile/${address}`} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                    <User size={18} /> Trang cá nhân
                  </Link>
                  <Link href="/create" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-text-secondary hover:bg-surface hover:text-text-primary transition-colors">
                    <Plus size={18} /> Tạo NFT
                  </Link>
                  <button onClick={() => { disconnect(); setMobileOpen(false); }} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors text-left">
                    <LogOut size={18} /> Ngắt kết nối
                  </button>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DiamondIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="diamond-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M16 2L28 12L16 30L4 12L16 2Z" fill="url(#diamond-grad)" fillOpacity="0.15" stroke="url(#diamond-grad)" strokeWidth="1.5" />
      <path d="M4 12H28M16 2L10 12L16 30M16 2L22 12L16 30" stroke="url(#diamond-grad)" strokeWidth="1.5" />
    </svg>
  );
}
