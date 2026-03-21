import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    return Response.json(user);
  } catch (error) {
    return Response.json({ error: "Error creating user" }, { status: 500 });
  }
}