import { formatDistanceToNow, cn } from "@/lib/utils";
import { shortenAddress, formatPrice, parsePrice, getEtherscanUrl } from "@/lib/contracts";
import { parseTxError } from "@/lib/toast";

describe("formatDistanceToNow", () => {
  it("returns 'just now' for recent timestamps", () => {
    expect(formatDistanceToNow(Date.now() - 10_000)).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatDistanceToNow(Date.now() - 5 * 60_000)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(formatDistanceToNow(Date.now() - 3 * 3600_000)).toBe("3h ago");
  });

  it("returns days ago", () => {
    expect(formatDistanceToNow(Date.now() - 7 * 86400_000)).toBe("7d ago");
  });
});

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});

describe("shortenAddress", () => {
  it("shortens a full address", () => {
    expect(shortenAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234...5678");
  });

  it("returns empty for empty input", () => {
    expect(shortenAddress("")).toBe("");
  });
});

describe("formatPrice", () => {
  it("formats zero", () => {
    expect(formatPrice(0n)).toBe("0");
  });

  it("formats whole ETH", () => {
    expect(formatPrice(1000000000000000000n)).toBe("1");
  });

  it("formats fractional ETH", () => {
    const result = formatPrice(2450000000000000000n);
    expect(result).toBe("2.45");
  });

  it("shows < 0.0001 for dust", () => {
    expect(formatPrice(10000000000n)).toBe("< 0.0001");
  });
});

describe("parsePrice", () => {
  it("converts ETH string to wei", () => {
    expect(parsePrice("1")).toBe(1000000000000000000n);
  });
});

describe("getEtherscanUrl", () => {
  it("returns tx URL", () => {
    expect(getEtherscanUrl("0xabc", "tx")).toBe("https://sepolia.etherscan.io/tx/0xabc");
  });

  it("returns address URL", () => {
    expect(getEtherscanUrl("0xabc", "address")).toBe("https://sepolia.etherscan.io/address/0xabc");
  });
});

describe("parseTxError", () => {
  it("detects user rejection", () => {
    expect(parseTxError(new Error("user rejected transaction"))).toBe("Transaction rejected by user");
  });

  it("detects insufficient funds", () => {
    expect(parseTxError(new Error("insufficient funds for gas"))).toBe("Insufficient funds for transaction");
  });

  it("detects reverted tx with reason", () => {
    expect(parseTxError(new Error('execution reverted, reason="Price too low"'))).toBe("Price too low");
  });

  it("detects no wallet", () => {
    expect(parseTxError(new Error("no provider found"))).toBe("No wallet detected — please install MetaMask");
  });

  it("truncates long messages", () => {
    const long = "x".repeat(200);
    const result = parseTxError(new Error(long));
    expect(result.length).toBeLessThanOrEqual(123);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns Unknown error for null", () => {
    expect(parseTxError(null)).toBe("Unknown error");
  });
});
