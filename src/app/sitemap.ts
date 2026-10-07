import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://airadar.dev';
  const currentDate = new Date().toISOString();

  const publicRoutes = [
    '',
    '/news',
    '/briefing',
    '/tools',
    '/research',
    '/coding-agents',
    '/trends',
    '/career',
    '/business',
    '/safety',
    '/pricing',
    '/terms',
    '/privacy',
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: route === '' || route === '/news' || route === '/briefing' ? 'hourly' : 'daily',
    priority: route === '' ? 1.0 : route === '/briefing' || route === '/news' ? 0.9 : 0.7,
  }));
}
