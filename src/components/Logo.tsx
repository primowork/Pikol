import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function Logo({ size = 96, className = "", priority = false }: LogoProps) {
  return (
    <Image
      src="/icons/logo-round.png"
      alt="קפה פיקולו"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
