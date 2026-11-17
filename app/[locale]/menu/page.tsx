import { EditorialMenu } from "@/components/menu/EditorialMenu";
import { LOCALES, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function EditorialMenuPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "ar" ? "ar" : "en";

  return <EditorialMenu locale={locale} />;
}
