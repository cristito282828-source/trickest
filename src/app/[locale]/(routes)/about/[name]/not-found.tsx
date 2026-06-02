import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
    const t = await getTranslations('notFoundPage')
    return (
        <main className="h-screen w-full flex flex-col justify-center items-center bg-surface-shell">
            <h1 className="text-9xl font-extrabold text-white tracking-widest">404</h1>
            <div className="bg-brand-pink px-2 text-sm rounded rotate-12 absolute">
                {t('notFound')}
            </div>
            <button className="mt-5">
                <div
                    className="relative inline-block text-sm font-medium text-brand-pink group active:to-success-500 focus:outline-none focus:ring"
                >

                    <span className="relative block px-8 py-3 bg-transparent border border-current">
                        <Link href="/about-me/">{t('goBack')}</Link>
                    </span>
                </div>
            </button>
        </main>
    )
}
