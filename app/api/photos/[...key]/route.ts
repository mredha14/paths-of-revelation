import { env } from 'cloudflare:workers';
export async function GET(_r:Request,c:{params:Promise<{key:string[]}>}){const key=(await c.params).key;if(key[0]!=='places')return new Response('Not found',{status:404});const o=await env.FILES.get(key.join('/'));return o?new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType??'image/jpeg'}}):new Response('Not found',{status:404});}
