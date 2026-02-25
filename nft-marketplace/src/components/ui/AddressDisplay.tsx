"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { getEtherscanUrl, shortenAddress } from "@/lib/contracts";

interface AddressDisplayProps {
  address: string;
  ensName?: string | null;
  avatar?: string | null;
  showCopy?: boolean;
  showEtherscan?: boolean;
  showAvatar?: boolean;
  short?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  ensName,
  avatar,
  showCopy = true,
  showEtherscan = true,
  showAvatar = true,
  short = true,
  className = "",
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayName = ensName || (short ? shortenAddress(address) : address);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard may not be available */ }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showAvatar && (
        avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <Blockies address={address} size={24} />
        )
      )}

      <span className="text-sm font-medium text-text-primary tabular-nums">
        {displayName}
      </span>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
          title="Copy address"
        >
          {copied ? (
            <Check size={13} className="text-success" />
          ) : (
            <Copy size={13} />
          )}
        </button>
      )}

      {showEtherscan && (
        <a
          href={getEtherscanUrl(address, "address")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface hover:text-primary"
          title="View on Etherscan"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  );
}

function Blockies({ address, size = 24 }: { address: string; size?: number }) {
  const seed = address.toLowerCase();
  const colors = [
    `hsl(${parseInt(seed.slice(2, 6), 16) % 360}, 70%, 60%)`,
    `hsl(${parseInt(seed.slice(6, 10), 16) % 360}, 60%, 50%)`,
  ];

  return (
    <div
      className="shrink-0 rounded-full ring-1 ring-border"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      }}
    />
  );
}
