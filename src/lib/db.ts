import { PrismaClient } from "@prisma/client";

// Singleton רגיל ל-Prisma Client ב-Next.js: ב-dev, hot reload היה יוצר
// חיבור DB חדש בכל שמירה בלי זה. שומרים את המופע על ה-global object
// (רק בסביבת פיתוח) כדי לעשות בו שימוש חוזר.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
