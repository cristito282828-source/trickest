import { getTranslations, setRequestLocale } from 'next-intl/server';
import ComingSoonContent from './ComingSoonContent';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'comingSoon' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ComingSoonPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComingSoonContent />;
}
