import { Urbanist } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from "@/components/header";
import ArcadeButtonsWrapper from "@/components/ArcadeButtonsWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieBanner from "@/components/CookieBanner";
import Footer from "@/components/Footer";
import { Providers } from "../providers";
import { CartProvider } from "@/components/providers/CartProvider";
import { generateSchemaLd } from "@/lib/schema-ld";
import { SITE_URL, SITE_NAME } from "@/config/site";

const urbanist = Urbanist({ subsets: ["latin"] });

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'metadata' });

  const appUrl = new URL(SITE_URL);

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
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
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

  const schema = generateSchemaLd(locale);

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema)
          }}
        />

        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-K4JDCBQQ');`}
        </Script>

        {/* Microsoft Clarity (ID: x506iw1c9j) */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "x506iw1c9j");`}
        </Script>
      </head>
      <body className={`${urbanist.className} bg-surface-deep`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K4JDCBQQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        {/* Microsoft Clarity se carga via script inline en el <head> (ver arriba) */}

        <NextIntlClientProvider messages={messages}>
          <Providers>
            <CartProvider>
              <div className="flex flex-col min-h-screen bg-surface-deep">
                <Header />
                <main className="flex-1 relative !bg-surface-deep">
                  {children}
                </main>
                <Footer />
                <ArcadeButtonsWrapper />
                <CookieBanner />
              </div>
            </CartProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
