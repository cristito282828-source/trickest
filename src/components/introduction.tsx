'use client'
import Image from "next/image";
import { TypeAnimation } from 'react-type-animation';
import localFont from 'next/font/local';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const myFont = localFont({
    src: './fonts/blox.woff',
    display: 'auto'
});

const Introduction = () => {
    const t = useTranslations('introduction');
    return (
        <div className="relative z-0 w-full grid items-center p-6 py-20 md:py-0 md:grid-cols-3 justify-center bg-surface-deep bg-[url('/png-big-city.png')] bg-repeat-x animate-city-scroll" style={{ backgroundSize: '1920px 100%', backgroundPosition: '0 15px' }}>
            <div className="flex flex-col w-full justify-center mx-auto">
            <div className="justify-between">
                    <Link href='/' className="text-center">
                        <Image src="/logo.png" priority width="100" height="450" alt="Avatar" className="mx-auto pt--4" />
                    </Link>
                </div>
                <p className={`mx-auto mb-2 text-4xl
                text-center md:text-6xl md:mx-0 md:mb-8 ${myFont.className}`}>
                    <span className="block md:flex">
                        {t('tagline1')}
                    </span>
                    <span className="text-brand-pink md:text-9xl">
                        {t('tagline2')}
                    </span>
                </p>               

            </div>
            <div className="flex col-span-2 md:col-span-1 w-full justify-center md:justify-end text-center ">
                <Image src="/arcade.png" priority width="200" height="500" alt="Avatar" className=" w-full" />
            </div>
            <div className="flex flex-col justify-center md:max-w-md  mx-auto text-center">
                <h1 className="text-6xl text-center text-brand-pink font-bold mb-5">{t('finalSpot')}</h1>
                <Image src="/trick-est.webp" priority width="250" height="380" alt="Avatar" className="mx-auto" />

            </div>

        </div>
    );
}

export default Introduction;
