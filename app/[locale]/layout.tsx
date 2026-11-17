import { notFound } from "next/navigation";
import { DICTIONARY, LOCALES, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as Locale)) notFound();
  const copy = DICTIONARY[locale as Locale];

  return (
    <div dir={copy.dir} lang={locale} className="min-h-[100dvh]">
      {children}
    </div>
  );
}
