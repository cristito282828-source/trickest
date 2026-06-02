import Avatar from '@/components/avatar'
import ContainerPage from '@/components/container'
import Team from '@/components/team'
import TechForge from '@/components/tech-forge'
import TransitionPage from '@/components/transition-page'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import React from 'react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: t('metaKeywords'),
  };
}


const PageAboutMe = () => {
  return (
    <>
      <TransitionPage/>
      <ContainerPage>
        <TechForge/>       
        {/* <Avatar/> */}
        <Team/>
      </ContainerPage>
      
    </>
  )
}

export default PageAboutMe