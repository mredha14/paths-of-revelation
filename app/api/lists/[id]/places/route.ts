import { nextId, readStore, updateStore } from '@/lib/store';
import { requireSupabaseUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const identity=await requireSupabaseUser(request); if(!identity)return Response.json({error:'Sign in required.'},{status:401});
 const store=await readStore(); const profile=store.profiles.find((item)=>item.authSubject===identity.user.id); const id=Number((await context.params).id); const body=await request.json() as {placeId:number};
 if(!profile||!Number.isInteger(id)||!body.placeId)return Response.json({error:'Invalid list.'},{status:400});
 const list=store.itineraries.find((item)=>item.id===id&&item.profileId===profile.id); if(!list)return Response.json({error:'List not found.'},{status:404});
 await updateStore((current) => {
   const count = current.itineraryStops.filter((stop) => stop.itineraryId === id).length;
   current.itineraryStops.push({ id: nextId(current, 'itineraryStop'), itineraryId: id, placeId: body.placeId, dayNumber: 1, position: count });
 });
 return Response.json({ok:true});
}
