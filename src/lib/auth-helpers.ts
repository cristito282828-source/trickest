import { getServerSession } from "next-auth";
import prisma from "@/app/lib/prisma";

export async function getUserRole(email: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    return user?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function isJudge(email: string): Promise<boolean> {
  const role = await getUserRole(email);
  return role === "judge" || role === "admin";
}

export async function isAdmin(email: string): Promise<boolean> {
  const role = await getUserRole(email);
  return role === "admin";
}

export async function canEvaluateSubmissions(email: string): Promise<boolean> {
  return await isJudge(email);
}
