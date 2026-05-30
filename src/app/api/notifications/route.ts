import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  channel: z.enum(["EMAIL", "WHATSAPP", "SMS"]).optional(),
  status: z
    .enum(["PENDING", "SENT", "FAILED", "RETRYING"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const { page, pageSize, channel, status, sortDir } = parsed.data;
  const organizationId = session.user.organizationId;
  const skip = (page - 1) * pageSize;

  const where = {
    organizationId,
    ...(channel && { channel }),
    ...(status && { status }),
  };

  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      include: { paymentFailure: true },
      orderBy: { createdAt: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.notificationLog.count({ where }),
  ]);

  return NextResponse.json({
    data: logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
