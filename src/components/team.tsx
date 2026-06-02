'use client';

import Image from 'next/image'
import React from 'react'
import { dataTeam } from '../../data'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl';

const Team = () => {
  const t = useTranslations('teamComponent');

  return (
    <div className='grid grid-cols-2 gap-2'>
      <div className='grid grid-cols-2'>
        {
          dataTeam.map((item) => (
            <div key={item.id} className='relative'>

            <div className='absolute w-full h-full z-10'>
              <Image
                src={`${item.imgURl}`}
                alt={`${item.name}`}
                height={200}
                width={200}
                className='w-full h-full object-cover'
              />
            </div>

            <div className='absolute w-full h-full z-20 flex justify-center items-center bg-neutral-800 opacity-0 transition duration-300 ease-in-out hover:opacity-70'>
              <Link className='font-bold' href={`/about/${item.name}` }>
                {t('moreInfo')}
              </Link>
            </div>
          </div>

          ))
        }
      </div>
      <div className='m-2 text-center'>
        <h2 className='text-7xl text-brand-pink '>{t('meetTeam')}</h2>
        <br />
        <p className='text-xl'>
          {t('teamDescription')}
        </p>
      </div>
    </div>
  )
}

export default Team
