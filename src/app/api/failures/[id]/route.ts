import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const failure = await prisma.paymentFailure.findFirst({
    where: {
      id: params.id,
      organizationId: session.user.organizationId,
    },
    include: {
      customer: {
        include: {
          paymentFailures: {
            orderBy: { occurredAt: "desc" },
            take: 5,
          },
        },
      },
      notificationLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!failure) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: failure });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status } = body;

  if (!["OPEN", "RETRYING", "RECOVERED", "WRITTEN_OFF"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const failure = await prisma.paymentFailure.findFirst({
    where: {
      id: params.id,
      organizationId: session.user.organizationId,
    },
  });

  if (!failure) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.paymentFailure.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ data: updated });
}
