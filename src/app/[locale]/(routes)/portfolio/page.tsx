import CircleImage from '@/components/circle-image'
import ContainerPage from '@/components/container'
import PortfolioBox from '@/components/portfolio-box'
import TransitionPage from '@/components/transition-page'
import React from 'react'
import { dataPortfolio } from '../../../../../data'
import { getTranslations } from 'next-intl/server'

const page = async () => {
  const t = await getTranslations('portfolio')
  return (
    <ContainerPage>
        <TransitionPage/>
        <div className='flex flex-col justify-center h-full'>
            <h1 className='text-2xl leading-tight text-center
            md:text-4xl md:mb-5'>{t('latest')} <span className='text-brand-pink font-bold'>{t('projects')}</span></h1>
            <div className='relative z-10 grid max-w-5xl 
            gap-6 mx-auto mt-4 sm:grid-cols-2 md:grid-cols-4'>                
                {
                    dataPortfolio.map((data)=>(
                        <PortfolioBox key={data.id} data={data}/> //Paso de datos a PortfolioBox
                        ))
                    }
            </div>
        </div>
    </ContainerPage>
  )
}

export default page
