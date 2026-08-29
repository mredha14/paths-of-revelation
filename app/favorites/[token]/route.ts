export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return Response.redirect(new URL(`/favorites?list=${encodeURIComponent(token)}`, request.url), 302);
}
