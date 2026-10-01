export type SeoOverrides = {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  applicationName?: string;
  url?: string;
  image?: string;
  imageAlt?: string;
  robots?: string;
  canonical?: string;
  lang?: string;
  showHeader?: boolean;
};

export const siteConfig = {
  name: "TeamGGM",
  siteName: "TeamGGM",
  baseUrl: "https://testvocacional.teamggm.com",
  defaultTitle: "Tests vocacionales TeamGGM | MBTI, CHASIDE y Kuder",
  defaultDescription:
    "Descubre tu tipo, intereses y áreas profesionales con MBTI, CHASIDE y Kuder en TeamGGM.",
  defaultKeywords:
    "tests vocacionales, MBTI, CHASIDE, Kuder, orientación vocacional, TeamGGM, Quito, Ecuador",
  defaultImage:
    "https://testvocacional.teamggm.com/logo-teamggm-horizontal-con-transparencia.webp",
  defaultImageAlt: "Tests vocacionales y de personalidad TeamGGM",
  author: "TeamGGM",
  twitterHandle: "@teamggm",
  phone: "+593 96 794 1844",
  email: "ggm.instituto@gmail.com",
  address: {
    streetAddress: "Quito",
    addressLocality: "Quito",
    addressRegion: "Pichincha",
    addressCountry: "EC",
  },
  sameAs: [
    "https://www.instagram.com/teamggm.ec/",
    "https://www.tiktok.com/@teamggm.latam",
    "https://wa.me/593967941844",
  ],
} as const;

export function getPageSeo(overrides: Partial<SeoOverrides> = {}) {
  const baseUrl = siteConfig.baseUrl;

  return {
    title: overrides.title ?? siteConfig.defaultTitle,
    description: overrides.description ?? siteConfig.defaultDescription,
    keywords: overrides.keywords ?? siteConfig.defaultKeywords,
    author: overrides.author ?? siteConfig.author,
    applicationName: overrides.applicationName ?? "TeamGGM Tests Vocacionales",
    url: overrides.url ?? baseUrl,
    image: overrides.image ?? siteConfig.defaultImage,
    imageAlt: overrides.imageAlt ?? siteConfig.defaultImageAlt,
    robots: overrides.robots ?? "index, follow",
    canonical: overrides.canonical ?? overrides.url ?? baseUrl,
    lang: overrides.lang ?? "es",
    showHeader: overrides.showHeader !== undefined ? overrides.showHeader : false,
  };
}

export function buildBusinessSchema(overrides: Partial<SeoOverrides> = {}) {
  const seo = getPageSeo(overrides);

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteConfig.name,
    legalName: siteConfig.name,
    url: seo.url,
    logo: siteConfig.defaultImage,
    image: siteConfig.defaultImage,
    description: seo.description,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      ...siteConfig.address,
    },
    areaServed: ["Quito", "Ecuador"],
    sameAs: siteConfig.sameAs,
    knowsAbout: [
      "Tests vocacionales",
      "MBTI",
      "CHASIDE",
      "Kuder",
      "Orientación vocacional",
      "Preuniversitario",
    ],
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Tests vocacionales y orientación vocacional",
          description: seo.description,
          provider: {
            "@type": "EducationalOrganization",
            name: siteConfig.name,
          },
        },
      },
    ],
  };
}
