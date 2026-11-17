import { LOCALES, type Locale } from "@/lib/i18n";
import { BuildStudio } from "@/components/studio/BuildStudio";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function BuildPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <BuildStudio locale={locale === "ar" ? "ar" : "en"} />;
}
