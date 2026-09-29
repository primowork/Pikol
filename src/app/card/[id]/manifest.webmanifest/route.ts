import { prisma } from "@/lib/db";
import baseManifest from "../../../../../public/manifest.json";

/**
 * manifest אישי לכרטיס: אייקון שמוסיפים למסך הבית מתוך הכרטיס נפתח ישר
 * אליו. באייפון לאפליקציה במסך הבית יש אחסון נפרד מספארי, כך שה-start_url
 * הכללי (/card, שמחפש את מזהה הלקוח ב-localStorage) היה שולח לקוח שהוסיף
 * הרגע את האייקון לטופס ההצטרפות. id נשאר כמו ב-manifest הכללי, כדי
 * שהתקנה קיימת באנדרואיד תיחשב אותה אפליקציה.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
  if (!customer) {
    return Response.json({ error: "כרטיס לא נמצא" }, { status: 404 });
  }

  const manifest = { ...baseManifest, id: baseManifest.start_url, start_url: `/card/${customer.id}` };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
