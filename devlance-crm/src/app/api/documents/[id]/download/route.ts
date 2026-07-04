import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

const mimeMap: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  image: "image/jpeg",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const doc = await prisma.documentItem.findUnique({ where: { id } });
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Private docs only visible to uploader (or admin)
  if (doc.scope === "PRIVATE" && doc.uploadedById !== userId && user.role !== "ADMIN") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Team docs visible to everyone
  if (!doc.base64) {
    return new NextResponse("File content not available", { status: 404 });
  }

  const buffer = Buffer.from(doc.base64, "base64");
  const mime = mimeMap[doc.type] ?? "application/octet-stream";
  const ext = doc.type === "pdf" ? ".pdf" : doc.type === "docx" ? ".docx" : doc.type === "xlsx" ? ".xlsx" : doc.type === "pptx" ? ".pptx" : doc.type === "image" ? ".jpg" : "";
  const filename = `${doc.name.replace(/[^a-zA-Z0-9._-]/g, "_")}${ext}`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
