const site = "https://teamggm.com";

export async function GET() {
  const body = `# TeamGGM public landing content
# This file intentionally exposes only the public marketing page.

${site}/

# Restricted from public indexing:
# /admin
# /admin/login
# /admin/estudiante/*
# /personalidad
# /mbti
# /chaside
# /kuder
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
