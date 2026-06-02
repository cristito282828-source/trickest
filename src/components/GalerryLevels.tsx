import React from 'react'
import { IoIosShareAlt } from "react-icons/io";
import { FaHeart } from "react-icons/fa";
import {dataTrickets} from "../../data";



const GalerryLevels = () => {
    return (
        <div className="flex w-full flex-wrap content-center justify-center px-7">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {
                    dataTrickets.map((tricket, index) => {
                        return (
                            <div className="max-w-xsborder    " key={index}>
                                <img className="h-52 w-full object-cover" src={`${tricket.imgURl}`} />
                                <div className='p-1 text-left'>
                                <h3>{tricket.name}</h3>
                                <ul className="mt-3 flex flex-wrap">
                                    <li className="mr-auto">
                                        <a href="#" className="flex text-neutral-400 hover:text-neutral-600">
                                            <IoIosShareAlt />
                                            {tricket.share}
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="flex text-neutral-400 hover:text-neutral-600">
                                            <FaHeart />
                                            {tricket.likes}
                                        </a>
                                    </li>
                                </ul>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default GalerryLevels