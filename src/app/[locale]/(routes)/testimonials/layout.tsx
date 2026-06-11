import { Metadata } from 'next'

// The testimonials page is a client component and cannot export metadata,
// so the noindex directive lives in this server layout.
// TODO: remove noindex once real testimonials replace the template placeholder.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function TestimonialsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
