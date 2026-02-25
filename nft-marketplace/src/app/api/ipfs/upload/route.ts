import { NextRequest, NextResponse } from "next/server";

const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export async function POST(req: NextRequest) {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      return NextResponse.json(
        { error: "Server misconfiguration: Pinata JWT not set" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const pinataForm = new FormData();
    pinataForm.append("file", file);

    const metadata = JSON.stringify({
      name: file instanceof File ? file.name : "upload",
    });
    pinataForm.append("pinataMetadata", metadata);

    const options = JSON.stringify({ cidVersion: 1 });
    pinataForm.append("pinataOptions", options);

    const pinataRes = await fetch(PINATA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: pinataForm,
    });

    if (!pinataRes.ok) {
      const errBody = await pinataRes.text();
      console.error("Pinata upload failed:", pinataRes.status, errBody);
      return NextResponse.json(
        { error: `Pinata error: ${pinataRes.status}` },
        { status: 502 }
      );
    }

    const data = await pinataRes.json();

    return NextResponse.json({
      cid: data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    });
  } catch (err) {
    console.error("IPFS upload error:", err);
    return NextResponse.json(
      { error: "Internal server error during upload" },
      { status: 500 }
    );
  }
}
