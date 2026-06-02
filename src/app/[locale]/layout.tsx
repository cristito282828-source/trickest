import { Urbanist } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from "@/components/header";
import ArcadeButtonsWrapper from "@/components/ArcadeButtonsWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import { Providers } from "../providers";
import { generateSchemaLd } from "@/lib/schema-ld";

const urbanist = Urbanist({ subsets: ["latin"] });

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'metadata' });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : new URL('http://localhost:3000');

  return {
    metadataBase: appUrl,
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/logo-main.png',
      shortcut: '/logo-main.png',
      apple: '/logo-main.png',
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: appUrl.toString(),
      siteName: 'TRICKEST',
      images: [
        {
          url: '/trick-est.webp',
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/trick-est.webp'],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  const messages = await getMessages();

  const schema = generateSchemaLd();

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />
      </head>
      <body className={`${urbanist.className} bg-surface-deep`}>
        {/* Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || ''} />

        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex flex-col min-h-screen bg-surface-deep">
              <Header />
              <main className="flex-1 relative !bg-surface-deep">
                {children}
              </main>
              <Footer />
              <ArcadeButtonsWrapper />
              <CookieBanner />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
