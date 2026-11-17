import { withBasePath } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "badge" | "stacked-dark" | "stacked-cream";
  className?: string;
  alt?: string;
}

export function BrandLogo({
  variant = "badge",
  className = "h-14 w-auto",
  alt = "MAX DAILY",
}: BrandLogoProps) {
  const file =
    variant === "badge"
      ? "/brand/logos/MAX_DAILY_vertical_fullcolor.svg"
      : variant === "stacked-dark"
        ? "/brand/logos/MAX_DAILY_vertical_stacked_dark_transparent.svg"
        : "/brand/logos/MAX_DAILY_vertical_stacked_cream_gold_transparent.svg";

  return <img src={withBasePath(file)} alt={alt} className={className} draggable={false} />;
}
