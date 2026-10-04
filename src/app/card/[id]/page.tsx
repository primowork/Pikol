import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LAUNCH_TERMS_VERSION, STAMPS_REQUIRED, TERMS_VERSION } from "@/lib/config";
import { grantBirthdayRewardIfDue } from "@/lib/birthday-reward";
import { getAboutUsText, getBusinessDetails } from "@/lib/business-settings";
import StampCard from "@/components/StampCard";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await grantBirthdayRewardIfDue(id);

  const [customer, aboutUsText, businessDetails, lastTermsAcceptance] = await Promise.all([
    prisma.customer.findUnique({ where: { id } }),
    getAboutUsText(),
    getBusinessDetails(),
    // הגרסה האחרונה של התקנון שהלקוח אישר. אישור בלי גרסה (לפני ההרצה) נחשב
    // כגרסת ההשקה, כך שהפס מופיע רק מהשינוי הבא בתקנון.
    prisma.consentEvent.findFirst({
      where: { customerId: id, kind: "TERMS_ACCEPTED" },
      orderBy: { createdAt: "desc" },
      select: { termsVersion: true },
    }),
  ]);
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
      initialMarketingOptIn={customer.marketingOptIn}
      hasBirthdayReward={customer.bonusRewardsAvailable > 0}
      aboutUsText={aboutUsText}
      businessDetails={businessDetails}
      needsTermsApproval={(lastTermsAcceptance?.termsVersion ?? LAUNCH_TERMS_VERSION) !== TERMS_VERSION}
    />
  );
}
