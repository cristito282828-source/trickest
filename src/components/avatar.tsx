
'use client'

import Image from 'next/image'

import MotionTransition from './transition-component'

const Avatar = () => {
  return (
    <MotionTransition position='bottom' className='bottom-0 right-0 hidden md:inline-block md:absolute'>
        <Image
            src='/avatar-1.png'
            alt='avatar'
            width={200}
            height={200}
            className='w-full h-full'
        />
    </MotionTransition>
  )
}

export default Avatar