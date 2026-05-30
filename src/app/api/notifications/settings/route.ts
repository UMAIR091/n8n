import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  emailEnabled: z.boolean(),
  emailRecipients: z.array(z.string().email()),
  whatsappEnabled: z.boolean(),
  whatsappRecipients: z.array(z.string()),
  smsEnabled: z.boolean().optional().default(false),
  smsRecipients: z.array(z.string()).optional().default([]),
  minAmountThreshold: z.number().int().min(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.notificationSetting.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  return NextResponse.json({ data: settings });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const organizationId = session.user.organizationId;

  const settings = await prisma.notificationSetting.upsert({
    where: { organizationId },
    create: {
      organizationId,
      ...parsed.data,
    },
    update: parsed.data,
  });

  return NextResponse.json({ data: settings });
}
