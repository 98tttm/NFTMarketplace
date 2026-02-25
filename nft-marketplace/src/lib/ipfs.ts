import type { NFTMetadata } from "@/types";

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const CLOUDFLARE_GATEWAY = "https://cloudflare-ipfs.com/ipfs";

export async function uploadImageToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload image to IPFS");
  }

  const data = await res.json();
  return data.cid as string;
}

export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  const file = new File([blob], "metadata.json", { type: "application/json" });

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/ipfs/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to upload metadata to IPFS");
  }

  const data = await res.json();
  return data.cid as string;
}

export function getIPFSUrl(cid: string): string {
  if (!cid) return "";
  const cleanCid = cid.replace("ipfs://", "");
  return `${PINATA_GATEWAY}/${cleanCid}`;
}

export function resolveIPFS(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return `${PINATA_GATEWAY}/${uri.slice(7)}`;
  }
  if (uri.startsWith("ar://")) {
    return `https://arweave.net/${uri.slice(5)}`;
  }
  return uri;
}

export async function fetchMetadataFromIPFS(tokenURI: string): Promise<NFTMetadata | null> {
  try {
    const url = resolveIPFS(tokenURI);
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      name: data.name || "Untitled",
      description: data.description || "",
      image: resolveIPFS(data.image || ""),
      external_url: data.external_url,
      attributes: data.attributes || [],
    };
  } catch {
    return null;
  }
}
