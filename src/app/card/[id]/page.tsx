import { notFound } from "next/navigation";
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

  return (
    <StampCard
      customerId={customer.id}
      initialName={customer.name}
      initialStamps={customer.currentStamps}
      stampsRequired={STAMPS_REQUIRED}
      initialRewardsEarned={customer.rewardsEarned}
      vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? ""}
      initialBirthday={customer.birthday ? customer.birthday.toISOString().slice(0, 10) : null}
      marketingOptIn={customer.marketingOptIn}
    />
  );
}
