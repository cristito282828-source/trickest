import Avatar from '@/components/avatar'
import CircleImage from '@/components/circle-image'
import SliderServices from '@/components/slider-services'
import TransitionPage from '@/components/transition-page'
import { Metadata } from 'next'
import React from 'react'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('servicesPage')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

const ServicePage = async () => {
  const t = await getTranslations('servicesPage')

  return (
    <>
      <TransitionPage />
      <CircleImage />
      <div className='grid items-center justify-center h-screen max-w-5xl
      gap-6 mx-auto md:grid-cols-2 md:grid-flow-col'>
        <div className='max-w-[450px'>
          <h1 className='text-2xl leading-tight text-center md:text-left md:text-4xl md:mb-5'>{t('our')} <span className='font-bold text-brand-pink'>{t('servicesTitle')}</span> </h1>
          <p className="mb-3 text-xl text-neutral-300">{t('description')}</p>
          <button className="px-3 py-2 rounded-lg bg-brand-pink hover:bg-brand-pink/65">{t('contactUs')}</button>
        </div>

        {/* SLIDER */}
        <div>
          <SliderServices />
        </div>
      </div>


    </>
  )
}

export default ServicePage
