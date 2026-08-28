import { getDb } from '@/db';
import { itineraries, itineraryStops, profiles } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';
import { and, eq } from 'drizzle-orm';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
 const identity=await requireSupabaseUser(request); if(!identity)return Response.json({error:'Sign in required.'},{status:401});
 const db=getDb(); const profile=await db.select().from(profiles).where(eq(profiles.authSubject,identity.user.id)).get(); const id=Number((await context.params).id); const body=await request.json() as {placeId:number};
 if(!profile||!Number.isInteger(id)||!body.placeId)return Response.json({error:'Invalid list.'},{status:400});
 const list=await db.select().from(itineraries).where(and(eq(itineraries.id,id),eq(itineraries.profileId,profile.id))).get(); if(!list)return Response.json({error:'List not found.'},{status:404});
 const count=await db.select().from(itineraryStops).where(eq(itineraryStops.itineraryId,id)).all(); await db.insert(itineraryStops).values({itineraryId:id,placeId:body.placeId,dayNumber:1,position:count.length});
 return Response.json({ok:true});
}
