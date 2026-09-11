import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { STAMPS_REQUIRED } from "@/lib/config";
import StampCard from "@/components/StampCard";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    notFound();
  }

  // ה-QR מקודד קישור מלא (לא רק את המזהה) כדי שגם מצלמה רגילה שתסרוק
  // אותו בטעות תפתח את הכרטיס - בעל הקפה מחלץ את המזהה מתוך הקישור.
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const cardUrl = `${isLocal ? "http" : "https"}://${host}/card/${customer.id}`;

  const qrDataUrl = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#614943", light: "#ffffffff" },
  });

  return (
    <StampCard
      customerId={customer.id}
      initialName={customer.name}
      initialStamps={customer.currentStamps}
      stampsRequired={STAMPS_REQUIRED}
      initialRewardsEarned={customer.rewardsEarned}
      qrDataUrl={qrDataUrl}
    />
  );
}
