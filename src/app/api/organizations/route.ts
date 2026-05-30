import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { slugify } from "@/lib/utils";

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    data: memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { name } = parsed.data;
  let slug = slugify(name);

  // Ensure slug uniqueness
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
      notificationSettings: {
        create: {
          emailEnabled: true,
          emailRecipients: session.user.email ? [session.user.email] : [],
          whatsappEnabled: false,
          whatsappRecipients: [],
          smsEnabled: false,
          smsRecipients: [],
          minAmountThreshold: 0,
        },
      },
    },
    include: { memberships: true },
  });

  return NextResponse.json({ data: org }, { status: 201 });
}
