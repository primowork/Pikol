import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// סקריפט הזרעה: יוצר את משתמש הבעלים (owner) הראשוני מ-OWNER_USERNAME /
// OWNER_PASSWORD ב-.env. Prisma CLI טוען את .env אוטומטית גם עבור
// `prisma db seed`, כך שאין צורך בחבילת dotenv נפרדת. רץ אוטומטית בסוף
// `prisma migrate dev`, וניתן להריץ שוב בנפרד עם `npm run db:seed` -
// הרצה חוזרת לא יוצרת כפילות.

const prisma = new PrismaClient();

/**
 * OWNER_EMAIL (אופציונלי) - מייל לשחזור סיסמה של ה-owner. נקבע רק אם עוד
 * לא שמור מייל בחשבון, כדי לא לדרוס מייל שנקבע אחר כך בעמוד ההגדרות.
 * ה-seed רץ בכל הפעלה (npm start), לכן בעיה במייל רק מדווחת ולא מפילה אותו.
 */
async function applyOwnerEmail(ownerId: string, currentEmail: string | null) {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!email || currentEmail) return;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn("OWNER_EMAIL לא נראה כמו כתובת מייל תקינה - מדלג.");
    return;
  }

  try {
    await prisma.staffUser.update({ where: { id: ownerId }, data: { email } });
    console.log("נשמר מייל לשחזור סיסמה של ה-owner (OWNER_EMAIL).");
  } catch (err) {
    console.warn("לא הצלחנו לשמור את OWNER_EMAIL (אולי הוא כבר שמור בחשבון אחר):", err);
  }
}

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
    await applyOwnerEmail(existing.id, existing.email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const owner = await prisma.staffUser.create({
    data: {
      username,
      passwordHash,
      name: "בעל העסק",
      role: "OWNER",
    },
  });
  await applyOwnerEmail(owner.id, null);

  console.log(
    `נוצר משתמש owner בשם "${username}". כדאי להתחבר ולהחליף את הסיסמה בעמוד ההגדרות מיד לאחר הפריסה הראשונה.`
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
