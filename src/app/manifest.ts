import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pipfolio — Gold Trading Journal',
    short_name: 'Pipfolio',
    description: 'Track your XAU/USD trades and P&L',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F3',
    theme_color: '#15140F',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
