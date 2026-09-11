import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// סקריפט הזרעה: יוצר את משתמש הבעלים (owner) הראשוני מ-OWNER_USERNAME /
// OWNER_PASSWORD ב-.env. Prisma CLI טוען את .env אוטומטית גם עבור
// `prisma db seed`, כך שאין צורך בחבילת dotenv נפרדת. רץ אוטומטית בסוף
// `prisma migrate dev`, וניתן להריץ שוב בנפרד עם `npm run db:seed` -
// הרצה חוזרת לא יוצרת כפילות.

const prisma = new PrismaClient();

async function main() {
  const username = process.env.OWNER_USERNAME;
  const password = process.env.OWNER_PASSWORD;

  if (!username || !password) {
    console.warn(
      "OWNER_USERNAME / OWNER_PASSWORD לא מוגדרים ב-.env - מדלג על יצירת משתמש owner ראשוני."
    );
    return;
  }

  const existing = await prisma.staffUser.findUnique({ where: { username } });
  if (existing) {
    console.log(`חבר צוות בשם "${username}" כבר קיים במערכת, לא נוצרת כפילות.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.staffUser.create({
    data: {
      username,
      passwordHash,
      name: "בעל העסק",
      role: "OWNER",
    },
  });

  console.log(
    `נוצר משתמש owner בשם "${username}". חשוב להתחבר ולהחליף את הסיסמה מיד לאחר הפריסה הראשונה.`
  );
}

main()
  .catch((err) => {
    console.error("שגיאה בהרצת ה-seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
