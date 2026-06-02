'use client'
import TransitionPage from '@/components/transition-page'
import React from 'react'
import HighScore from '@/components/highScore';
import { TbSkateboarding } from "react-icons/tb";
import { useTranslations } from 'next-intl';


const TestimonialPage = () => {
    const t = useTranslations('testimonialsPage')
    return (
        <>
            <TransitionPage />
            <div className="relative flex flex-col w-full min-w-0 mb-6 break-words border border-dashed bg-clip-border rounded-2xl border-neutral-200 bg-surface-light/30 draggable">
                <div className="px-9 pt-9 flex-auto min-h-[70px] pb-0 bg-transparent">
                    <div className="flex flex-wrap mb-6 xl:flex-nowrap">
                        <div className="mb-5 mr-5">
                            <div className="relative inline-block shrink-0 rounded-2xl">
                                <img className="inline-block shrink-0 rounded-2xl w-[80px] h-[80px] lg:w-[160px] lg:h-[160px]" src="https://raw.githubusercontent.com/Loopple/loopple-public-assets/main/riva-dashboard-tailwind/img/avatars/avatar1.jpg" alt="image" />
                            </div>
                        </div>
                        <div className="grow">
                            <div className="flex flex-wrap items-start justify-between mb-2">
                                <div className="flex flex-col">
                                    <div className="flex items-center mb-2">
                                        <a className="text-ink-inverse hover:text-brand-pink transition-colors duration-200 ease-in-out font-semibold text-[1.5rem] mr-1" href="javascript:void(0)"> Keiner Baracali </a>
                                    </div>
                                    <div className="flex flex-wrap pr-2 mb-4 font-medium">
                                        <a className="flex items-center mb-2 mr-5 text-ink-subtle hover:text-brand-pink" href="javascript:void(0)">
                                            <span className="mr-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                                </svg>
                                            </span> Cali, CO </a>
                                        <a className="flex items-center mb-2 mr-5 text-ink-subtle hover:text-brand-pink" href="javascript:void(0)">
                                            {t('score')} <span className="mr-1">
                                                27.000
                                            </span>  </a>
                                    </div>
                                    <p>{t('team')}</p>
                                </div>
                                <div>
                                    <h1>{t('equipment')}</h1>
                                    <div>
                                    <a className="flex items-center mb-2 mr-5 text-ink-subtle hover:text-brand-pink" href="javascript:void(0)">
                                            <span className="mr-1">
                                            <TbSkateboarding size={50} />

                                            </span> Cali, CO </a>
                                    </div>
                                </div>
                                <div className="flex flex-wrap my-auto">
                                    <a href="javascript:void(0)" className="inline-block px-6 py-3 mr-3 text-base font-medium leading-normal text-center align-middle transition-colors duration-150 ease-in-out border-0 shadow-none cursor-pointer rounded-2xl text-ink-muted bg-surface-light border-surface-light hover:bg-neutral-200 active:bg-neutral-200 focus:bg-neutral-200 "> {t('follow')} </a>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-between">
                                <div className="flex flex-wrap items-center">
                                    <a href="javascript:void(0)" className="mr-3 mb-2 inline-flex items-center justify-center text-ink-inverse rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all duration-200 ease-in-out px-3 py-1 text-sm font-medium leading-normal"> Facebook </a>
                                    <a href="javascript:void(0)" className="mr-3 mb-2 inline-flex items-center justify-center text-ink-inverse rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all duration-200 ease-in-out px-3 py-1 text-sm font-medium leading-normal"> Instagram </a>
                                    <a href="javascript:void(0)" className="mr-3 mb-2 inline-flex items-center justify-center text-ink-inverse rounded-full bg-neutral-100 hover:bg-neutral-200 transition-all duration-200 ease-in-out px-3 py-1 text-sm font-medium leading-normal"> TikTok </a>
                                </div>

                            </div>

                        </div>
                        <p>
                            {t('bio')}
                        </p>
                    </div>
                    <ul nav-tabs className="group flex flex-wrap items-stretch text-[1.15rem] font-semibold list-none border-b-2 border-transparent border-solid active-assignments">
                        <li className="flex mt-2 -mb-[2px]">
                            <a aria-controls="summary" className="py-5 mr-1 sm:mr-3 lg:mr-10 transition-colors duration-200 ease-in-out border-b-2 border-transparent group-[.active-summary]:border-brand-pink group-[.active-summary]:text-brand-pink text-ink-muted hover:border-brand-pink" href="javascript:void(0)"> {t('tricks')} </a>
                        </li>
                        <li className="flex mt-2 -mb-[2px]">
                            <a aria-controls="assignments" className="py-5 mr-1 sm:mr-3 lg:mr-10 transition-colors duration-200 ease-in-out border-b-2 border-transparent group-[.active-assignments]:border-brand-pink group-[.active-assignments]:text-brand-pink text-ink-muted hover:border-brand-pink" href="javascript:void(0)"> {t('achievements')} </a>
                        </li>

                    </ul>
                    <div className='pt-28 text-center'>
                        <h1 className='text-neutral-200 my-2 text-2xl md:text-4xl font-bold'>{t('myTricks')}</h1>
                        <HighScore />
                    </div>
                </div>
            </div>
        </>
    )
}

export default TestimonialPage
