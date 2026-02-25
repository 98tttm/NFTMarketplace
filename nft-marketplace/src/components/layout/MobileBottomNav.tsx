"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { Home, Search, Plus, Activity, User } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/marketplace", label: "Explore", icon: Search },
  { href: "/create", label: "Create", icon: Plus, accent: true },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: User, needsAuth: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const href =
            item.needsAuth && isConnected ? `/profile/${address}` : item.href;
          const isActive =
            pathname === href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          if (item.accent) {
            return (
              <Link
                key={item.href}
                href={href}
                className="relative -mt-4 flex items-center justify-center"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-primary/30"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
                >
                  <Icon size={22} className="text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 tap-target"
            >
              <Icon
                size={20}
                style={{ color: isActive ? "#A855F7" : "#6B7280" }}
                className="transition-colors"
              />
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: isActive ? "#A855F7" : "#6B7280" }}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute -top-1.5 h-0.5 w-5 rounded-full"
                  style={{ background: "linear-gradient(90deg, #8B5CF6, #3B82F6)" }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Safe area for iPhones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
