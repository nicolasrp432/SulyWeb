// Generador de sitemap automático
const generateSitemap = () => {
  const baseUrl = 'https://sulyprettynails.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const pages = [
    {
      url: '/',
      changefreq: 'weekly',
      priority: '1.0',
      lastmod: currentDate
    },
    {
      url: '/servicios',
      changefreq: 'monthly',
      priority: '0.9',
      lastmod: currentDate
    },
    {
      url: '/galeria',
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: currentDate
    },
    {
      url: '/contacto',
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: currentDate
    },
    {
      url: '/reservas',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: currentDate
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};

export default generateSitemap;