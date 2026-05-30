import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["OPEN", "RETRYING", "RECOVERED", "WRITTEN_OFF"])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["occurredAt", "amount", "status"])
    .default("occurredAt"),
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

  const {
    page,
    pageSize,
    status,
    startDate,
    endDate,
    customerId,
    sortBy,
    sortDir,
  } = parsed.data;

  const organizationId = session.user.organizationId;
  const skip = (page - 1) * pageSize;

  const where = {
    organizationId,
    ...(status && { status }),
    ...(customerId && { customerId }),
    ...(startDate || endDate
      ? {
          occurredAt: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        }
      : {}),
  };

  const [failures, total] = await Promise.all([
    prisma.paymentFailure.findMany({
      where,
      include: { customer: true },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: pageSize,
    }),
    prisma.paymentFailure.count({ where }),
  ]);

  return NextResponse.json({
    data: failures,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
