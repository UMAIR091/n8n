import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "email", "name"]).default("createdAt"),
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

  const { page, pageSize, search, sortBy, sortDir } = parsed.data;
  const organizationId = session.user.organizationId;
  const skip = (page - 1) * pageSize;

  const where = {
    organizationId,
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { paymentFailures: true, checkoutEvents: true },
        },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    data: customers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
