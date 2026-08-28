import { env } from 'cloudflare:workers';
export async function GET(_r:Request,c:{params:Promise<{key:string[]}>}){const o=await env.FILES.get((await c.params).key.join('/'));return o?new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType??'image/jpeg'}}):new Response('Not found',{status:404});}
