'use client';

import React from 'react'
import localFont from 'next/font/local';
import { useTranslations } from 'next-intl';

const myFont = localFont({
    src: './fonts/blox.woff',
    display: 'auto'
});

const HowWin = () => {
    const t = useTranslations('howToWin');

    const steps = [
        { key: 'step1', image: t('step1Image') },
        { key: 'step2', image: t('step2Image') },
        { key: 'step3', image: t('step3Image') },
    ];

    const handleParticipate = () => {
        // Disparar evento para abrir el menú principal
        window.dispatchEvent(new CustomEvent('arcade-press-start'));
    };

    return (
        <div id="how-to-win" className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header - Estilo arcade consistente */}
                <div className="text-center mb-12">
                    <div className="inline-block">
                        <div className="bg-neutral-800 border-4 border-cyan-500 rounded-lg px-6 py-4 shadow-lg shadow-cyan-500/20">
                            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider">
                                {t('title')}
                            </h2>
                            <p className="text-cyan-400 mt-2 text-xs md:text-sm uppercase tracking-wider">
                                {t('subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Steps Grid */}
                <div className="flex w-full flex-wrap content-center justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center">
                                <img className="h-52 w-full object-contain mx-auto mb-4" src={step.image} alt={t(`${step.key}Title`)} />
                                <div className='p-4'>
                                    <h3 className={`mb-2 text-2xl md:text-4xl tracking-wide text-white ${myFont.className}`}>
                                        {t(`${step.key}Title`)}
                                    </h3>
                                    <p className="text-neutral-300 text-sm md:text-base">{t(`${step.key}Caption`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div className='flex justify-center items-center mt-8 w-full'>
                        <button
                            onClick={handleParticipate}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-wider px-8 py-3 rounded-lg border-4 border-cyan-400 shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:scale-105 cursor-pointer"
                        >
                            {t('participate')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HowWin