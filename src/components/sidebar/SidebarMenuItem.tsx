'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link'


interface Props {
    path: string;
    icon: JSX.Element;
    title: string;
    subTitle: string;
}

export const SidebarMenuItem = ({ path, icon, title, subTitle }: Props) => {

    const currentPath = usePathname();
    const isActive = currentPath === path;

    return (
        <Link
            href={path}
            className={`group block rounded-xl border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:ring-offset-2 ${
                isActive
                    ? 'border-cyan-200 bg-cyan-50'
                    : 'border-transparent hover:border-neutral-200 hover:bg-white'
            }`}
        >
            <div
                className="flex items-center gap-3 rounded-xl px-3 py-3"
            >
                {/* Icono */}
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive
                            ? 'bg-cyan-600 text-white'
                            : 'bg-neutral-100 text-neutral-500 group-hover:bg-cyan-50 group-hover:text-cyan-700'
                    }`}
                >
                    {icon}
                </div>

                {/* Texto */}
                <div className="flex flex-col">
                    <span
                        className={`text-sm font-bold ${
                            isActive
                                ? 'text-cyan-900'
                                : 'text-neutral-800'
                        }`}
                    >
                        {title}
                    </span>
                    <span
                        className={`text-xs ${
                            isActive
                                ? 'text-cyan-700'
                                : 'text-neutral-500'
                        } hidden md:block`}
                    >
                        {subTitle}
                    </span>
                </div>
            </div>
        </Link>
    )
}
