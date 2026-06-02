import Image from "next/image";
import Link from "next/link";

interface PortfolioBoxProps {
    data: {
        id: number,
        title: string
        image: string
        urlGithub: string
        urlDemo: string
    }
}

const PortfolioBox = (props: PortfolioBoxProps) => {
    const { data } = props
    const { id, title, image, urlDemo, urlGithub } = data

    return (
        <div
            key={id}
            className="rounded-lg shadow-2xl shadow-surface-card bg-surface-card hover:shadow-md hover:shadow-success-500/50 transform hover:scale-105 transition duration-500 ease-in-out"
        >
            <Image
                src={image}
                alt="Image"
                width={200} height={200} className="w-full rounded-lg h-auto"
            />
            <div className="p-4">
                <h3 className="text-xl mt-2">{title}</h3>
                <div className="flex gap-5 mt-5 ">
                    <Link
                        href={urlGithub}
                        target="_blank"
                        className="p-2 transition duration-150 rounded-lg bg-success-500 hover:bg-success-500/80"
                    >
                        Github
                    </Link>

                    <Link
                        href={urlDemo}
                        target="_blank"
                        className="p-2 transition duration-150 rounded-lg bg-brand-pink hover:bg-brand-pink/80"
                    >
                        Live demo
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default PortfolioBox
