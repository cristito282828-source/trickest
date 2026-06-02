import React from 'react'
import { dataTeam } from '../../../../../../data'
import { notFound } from "next/navigation";
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import TransitionPage from '@/components/transition-page';
import { getTranslations } from 'next-intl/server';


interface Props {
    params: Promise<{ name: string }>
}


const getTemaMember = (name: string) => {
    return dataTeam.find((item) => item.name === name.toLowerCase()) || notFound()
}

const PageDetailEmployee = async ({ params }: Props) => {
    try {
        const t = await getTranslations('aboutMember')
        const { name } = await params
        const teamMember = getTemaMember(name)
        const { name: memberName, imgURl, role, experience, education, skills, socialNetworks, description } = teamMember

        return (
            <div>
                <TransitionPage/>
                {
                    <div
                        className="bg-surface-deep flex items-center justify-center min-h-screen text-ink-soft">
                        <section
                            className="w-full max-w-[430px] relative bg-surface-panel/60 rounded-[6px] shadow-[0px_15px_39px_16px_rgba(52,45,91,0.65)] backdrop-blur-sm mx-2 overflow-hidden">
                            <Image
                                width={100}
                                height={100}
                                alt={memberName}
                                src={imgURl}
                                className="rounded-full w-[120px] mx-auto my-10 p-0 border-[6px] box-content border-surface-panel
                                shadow-[0px_27px_16px_-11px_rgba(31,27,56,0.25)] transition-all duration-150 ease-in  slide-in-elliptic-top-fwd" />

                            <h1 className="text-xl font-bold text-center">{memberName.toUpperCase()}</h1>
                            <p className="text-center mb-2">{role}</p>
                            <div className="flex items-center justify-center gap-5 mb-5">
                                {socialNetworks.map(({ logo, src, id }) => (
                                    <Link
                                        key={id}
                                        href={src}
                                        target="_blank"
                                        className="transition-all duration-300 hover:text-brand-pink"
                                    >
                                        {logo}
                                    </Link>
                                ))}
                            </div>
                            <div className="bg-surface-panel/70 p-4 text-sm font-semibold backdrop-blur-sm">
                                <p>{t('skills')}</p>
                                <ul
                                    className="flex mt-4 flex-wrap items-center justify-start gap-2 gap-y-3 [&>li]:border-2 [&>li]:border-surface-border [&>li]:px-3 [&>li]:py-1 [&>li]:rounded-[4px] [&>li]:transition-all [&>li]:duration-150 [&>li]:ease-in [&>li:hover]:scale-105 [&>li:hover]:cursor-pointer">
                                    {
                                        skills.map((skill, index) => (
                                            <li key={index}>{skill}</li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </section>
                    </div>

                }
            </div>
        )
    } catch (error) {
        notFound()
    }
}

export default PageDetailEmployee
