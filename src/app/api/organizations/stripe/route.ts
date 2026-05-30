import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  webhookSecret: z.string().startsWith("whsec_"),
  liveMode: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Validation failed" },
      { status: 400 }
    );
  }

  const organizationId = session.user.organizationId;

  const connection = await prisma.stripeConnection.upsert({
    where: { organizationId },
    create: {
      organizationId,
      webhookSecret: parsed.data.webhookSecret,
      liveMode: parsed.data.liveMode,
    },
    update: {
      webhookSecret: parsed.data.webhookSecret,
      liveMode: parsed.data.liveMode,
    },
  });

  return NextResponse.json({ data: { id: connection.id, liveMode: connection.liveMode } });
}
