import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(100),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.errors[0]?.message || "Validation failed",
      },
      { status: 400 }
    );
  }

  const { name, email, password, orgName } = parsed.data;

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create organization slug
  let slug = slugify(orgName);
  const existingOrg = await prisma.organization.findUnique({ where: { slug } });
  if (existingOrg) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  // Create user + org + membership atomically
  const user = await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: orgName,
              slug,
              notificationSettings: {
                create: {
                  emailEnabled: true,
                  emailRecipients: [email],
                  whatsappEnabled: false,
                  whatsappRecipients: [],
                  smsEnabled: false,
                  smsRecipients: [],
                  minAmountThreshold: 0,
                },
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
