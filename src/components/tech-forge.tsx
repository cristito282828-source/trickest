'use client';

import React from 'react'
import { useTranslations } from 'next-intl';

const TechForge = () => {
  const t = useTranslations('techForge');

  return (
    <div className='w-full flex flex-row gap-9 mb-24'>
        <div className='flex flex-col gap-8'>
            <h2 className='text-center text-brand-pink text-7xl'>{t('mission')}</h2>
            <p className='text-justify'>{t('missionDesc')}</p>
        </div>
        <div className='flex flex-col gap-8'>
            <h2 className='text-center text-brand-pink text-7xl'>{t('vision')}</h2>
            <p className='text-justify'>{t('visionDesc')}</p>
        </div>

    </div>
  )
}

export default TechForge
