"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";

type Place = { id:number; city:string; cityAr:string; title:string; titleEn:string; type:string; typeEn:string; era:string; eraEn:string; description:string; descriptionEn:string; lat:number; lng:number; photo:string };
type SharedList = { title: string; places: Place[] };

export default function SharedList({ shareToken }: { shareToken: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Leaflet.Map | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [shared, setShared] = useState<SharedList | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const [placeDetailsOpen, setPlaceDetailsOpen] = useState(false);
  const [error, setError] = useState("");
  const ar = language === "ar";
  const text = (place: Place, key: "title" | "type" | "era" | "description") => ar ? place[key] : (place[(key + "En") as keyof Place] as string);
  const cityLabel = (place: Place) => ar ? place.cityAr : place.city;

  useEffect(() => { fetch(`/api/shared-favorite-lists/${encodeURIComponent(shareToken)}`).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setShared(data); setSelected(data.places[0] ?? null); }).catch((cause) => setError(cause instanceof Error ? cause.message : "This favorite list is unavailable.")); }, [shareToken]);
  useEffect(() => { let active = true; void import("leaflet").then((module) => { if (!active || !mapRef.current || mapInstance.current) return; const L = module.default; leaflet.current = module; const map = L.map(mapRef.current, { scrollWheelZoom: true, zoomControl: true }).setView([23, 39.75], 6); mapInstance.current = map; L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map); setMapReady(true); }); return () => { active = false; mapInstance.current?.remove(); mapInstance.current = null; markers.current = null; leaflet.current = null; setMapReady(false); }; }, []);
  useEffect(() => { const map = mapInstance.current, L = leaflet.current?.default; if (!map || !L || !shared) return; markers.current?.remove(); const layer = L.layerGroup().addTo(map); markers.current = layer; shared.places.forEach((place) => { const marker = L.circleMarker([place.lat, place.lng], { radius: place.id === selected?.id ? 12 : 9, color: "#fff", weight: 3, fillColor: place.id === selected?.id ? "#ba8132" : "#315e4c", fillOpacity: 1 }).addTo(layer); marker.bindTooltip(ar ? place.title : place.titleEn, { direction: "top", offset: [0, -8], opacity: .94 }); marker.on("click", () => { setSelected(place); if (window.matchMedia("(max-width: 1050px)").matches) setPlaceDetailsOpen(true); map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), { duration: .65 }); }); }); }, [ar, mapReady, shared, selected]);
  const choose = (place: Place) => { setSelected(place); mapInstance.current?.flyTo([place.lat, place.lng], Math.max(mapInstance.current.getZoom(), 14), { duration: .65 }); };
  const openPlaceDetails = (place: Place) => { choose(place); setPlaceDetailsOpen(true); };

  return <main className="site" dir={ar ? "rtl" : "ltr"}>
    <header><a className="brand" href="/"><span><img src="/paths-of-revelation-logo.png" alt="" /></span><b>{ar ? "دروب الوحي" : "Paths of Revelation"}<small>{ar ? "خريطة السيرة النبوية" : "A map of prophetic heritage"}</small></b></a><nav><button onClick={() => setLanguage(ar ? "en" : "ar")}>{ar ? "English" : "العربية"}</button></nav></header>
    <section className="shared-list-title"><p>{ar ? "قائمة مفضلة مشتركة" : "SHARED FAVORITE LIST"}</p><h1>{shared?.title ?? (ar ? "جارٍ تحميل القائمة…" : "Loading list…")}</h1></section>
    {error ? <section className="shared-empty"><h1>{ar ? "القائمة غير متاحة" : "List unavailable"}</h1><p>{error}</p><a href="/">{ar ? "العودة إلى الخريطة" : "Back to the map"}</a></section> : <section className="workspace shared-workspace">
      <aside className="explorer"><div className="explorer-heading"><h2>{ar ? "الأماكن" : "Places"}</h2><span>{shared?.places.length ?? 0}</span></div><p className="shared-list-subtitle">{ar ? "أماكن هذه القائمة" : "Places in this list"}</p><div className="place-list">{shared?.places.map((place) => <div className="place-row" key={place.id}><button className={`place-select ${selected?.id === place.id ? "selected" : ""}`} onClick={() => choose(place)}><img src={place.photo} alt=""/><span><b>{text(place, "title")}</b><small>{cityLabel(place)} · {text(place, "type")}</small></span><i>‹</i></button><button className="place-details-button" type="button" onClick={() => openPlaceDetails(place)} aria-label={ar ? `تفاصيل ${text(place, "title")}` : `Details for ${text(place, "title")}`} title={ar ? "عرض التفاصيل" : "View details"}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg></button></div>)}{shared && !shared.places.length && <small>{ar ? "لا توجد أماكن في هذه القائمة بعد." : "This list does not contain any places yet."}</small>}</div><footer>{ar ? "دروب الوحي — قائمة أماكن مشتركة" : "Paths of Revelation — Shared place list"}</footer></aside>
      <section className="map-area"><div ref={mapRef} className="map" /></section>
      <article className="card">{selected ? <><img src={selected.photo} alt={text(selected, "title")}/><div><p>{cityLabel(selected)} · {text(selected, "type")}</p><section><h2>{text(selected, "title")}</h2></section><p className="description">{text(selected, "description")}</p><nav><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}>{ar ? "الاتجاهات" : "Directions"} ↗</a></nav></div></> : <div className="shared-card-empty">{ar ? "اختر مكاناً من القائمة." : "Choose a place from the list."}</div>}</article>
    </section>}
    {placeDetailsOpen && selected && <div className="backdrop place-details-backdrop" onClick={() => setPlaceDetailsOpen(false)}><article className="place-details-modal" onClick={(event) => event.stopPropagation()}><button className="close" type="button" onClick={() => setPlaceDetailsOpen(false)} aria-label={ar ? "إغلاق التفاصيل" : "Close details"}>×</button><img src={selected.photo} alt={text(selected, "title")}/><div><p>{cityLabel(selected)} · {text(selected, "type")}</p><section><h2>{text(selected, "title")}</h2></section><p className="description">{text(selected, "description")}</p><nav><a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}>{ar ? "الاتجاهات" : "Directions"} ↗</a></nav></div></article></div>}
  </main>;
}
