const site = "https://testvocacional.teamggm.com";

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin
Disallow: /admin/login
Disallow: /admin/estudiante/
Disallow: /admin/estudiante
Disallow: /personalidad
Disallow: /personalidad/
Disallow: /mbti
Disallow: /mbti/
Disallow: /chaside
Disallow: /chaside/
Disallow: /kuder
Disallow: /kuder/

Sitemap: ${site}/sitemap-index.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
