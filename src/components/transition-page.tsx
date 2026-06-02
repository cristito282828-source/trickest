'use client'
import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { transitionVariantsPage } from '@/utils/motion-transitions'


function TransitionPage() {
  return (
    <AnimatePresence>
        <div>
            <motion.div
                className='fixed top-0 bottom-0 right-full w-screen z-30 bg-surface-deep'
                variants={transitionVariantsPage}
                initial='initial'
                animate='animate'
                exit="exit"
                transition={{delay:0, duration:0.3, ease:'easeInOut'}}
            >
            </motion.div>
        </div>
    </AnimatePresence>
  )
}

export default TransitionPage
