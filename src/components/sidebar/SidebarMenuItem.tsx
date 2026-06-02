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
            className={`block rounded-lg transition-all duration-200 ${
                isActive
                    ? 'bg-gradient-to-r from-accent-cyan-500 to-accent-purple-600 p-[2px] shadow-lg shadow-accent-cyan-500/30'
                    : 'hover:bg-neutral-800'
            }`}
        >
            <div
                className={`flex items-center gap-3 px-3 py-3 rounded-lg ${
                    isActive
                        ? 'bg-neutral-900'
                        : ''
                }`}
            >
                {/* Icono */}
                <div
                    className={`${
                        isActive
                            ? 'text-accent-cyan-400'
                            : 'text-neutral-500 group-hover:text-accent-cyan-400'
                    }`}
                >
                    {icon}
                </div>

                {/* Texto */}
                <div className="flex flex-col">
                    <span
                        className={`text-sm font-black uppercase tracking-wide ${
                            isActive
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan-400 to-accent-purple-400'
                                : 'text-neutral-300'
                        }`}
                    >
                        {title}
                    </span>
                    <span
                        className={`text-xs ${
                            isActive
                                ? 'text-accent-cyan-300'
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
