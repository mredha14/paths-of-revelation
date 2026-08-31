"use client";

import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Place = {
  id: number;
  city: string;
  cityAr?: string;
  title: string;
  titleEn: string;
  type: string;
  typeEn: string;
  era: string;
  eraEn: string;
  description: string;
  descriptionEn: string;
  lat: number;
  lng: number;
  photo: string;
};
type FavoriteList = { id: number; title: string; placeIds: number[] };
type TaxonomyItem = { id: number; slug: string; nameAr: string; nameEn: string };
type UserLocation = { lat: number; lng: number };
const NEARBY_RADIUS_KM = 50;

const distanceInKm = (from: UserLocation, to: Pick<Place, "lat" | "lng">) => {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDistance = radians(to.lat - from.lat);
  const lngDistance = radians(to.lng - from.lng);
  const a = Math.sin(latDistance / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lngDistance / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const places: Place[] = [
  {
    id: 1,
    city: "Makkah",
    title: "غار حراء",
    titleEn: "Cave of Hira",
    type: "موضع وحي",
    typeEn: "Revelation site",
    era: "بداية الوحي",
    eraEn: "Beginning of revelation",
    description:
      "الموضع الذي ارتبط ببداية نزول الوحي على النبي محمد ﷺ. نموذج تعريفي قابل للاستبدال بمادتكم العلمية المعتمدة.",
    descriptionEn:
      "The site traditionally associated with the beginning of revelation to Prophet Muhammad ﷺ. This sample text can be replaced with your approved research.",
    lat: 21.4585,
    lng: 39.8579,
    photo:
      "https://images.unsplash.com/photo-1565552645890-46e7e38a0c30?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 2,
    city: "Makkah",
    title: "جبل النور",
    titleEn: "Jabal al-Nour",
    type: "معلم طبيعي",
    typeEn: "Natural landmark",
    era: "العهد المكي",
    eraEn: "Makkah period",
    description:
      "معلم بارز في مكة المكرمة، يشرف على المنطقة المحيطة بغار حراء.",
    descriptionEn:
      "A prominent Makkah landmark overlooking the area surrounding the Cave of Hira.",
    lat: 21.4598,
    lng: 39.8601,
    photo:
      "https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 3,
    city: "Madinah",
    title: "مسجد قباء",
    titleEn: "Quba Mosque",
    type: "مسجد",
    typeEn: "Mosque",
    era: "الهجرة",
    eraEn: "Hijrah",
    description:
      "من المواقع المركزية في سيرة الهجرة، ويُعرض هنا كنموذج لبطاقة موقع ثنائية اللغة.",
    descriptionEn:
      "A central location in the account of the Hijrah, presented here as a bilingual sample place card.",
    lat: 24.4398,
    lng: 39.6176,
    photo:
      "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: 4,
    city: "Madinah",
    title: "جبل أُحد",
    titleEn: "Mount Uhud",
    type: "موقع تاريخي",
    typeEn: "Historic site",
    era: "غزوة أُحد",
    eraEn: "Battle of Uhud",
    description: "معلم تاريخي شمال المدينة المنورة، مرتبط بأحداث غزوة أُحد.",
    descriptionEn:
      "A historic landmark north of Madinah associated with events of the Battle of Uhud.",
    lat: 24.506,
    lng: 39.6159,
    photo:
      "https://images.unsplash.com/photo-1532264523420-881a47db012d?auto=format&fit=crop&w=1000&q=80",
  },
];
export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Leaflet.Map | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [account, setAccount] = useState<{
    username: string;
    displayName: string;
    role: string;
  } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [allPlaces, setAllPlaces] = useState<Place[]>(places);
  const [placesReady, setPlacesReady] = useState(false);
  const [selected, setSelected] = useState(places[0]);
  const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([]);
  const [listsOpen, setListsOpen] = useState(false);
  const [openFavoriteListId, setOpenFavoriteListId] = useState<number | null>(null);
  const [favoritePickerOpen, setFavoritePickerOpen] = useState(false);
  const [pendingFavoritePlace, setPendingFavoritePlace] = useState<Place | null>(null);
  const [favoriteListName, setFavoriteListName] = useState("");
  const [favoriteError, setFavoriteError] = useState("");
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTab, setManageTab] = useState<"cities" | "categories">("cities");
  const [cities, setCities] = useState<TaxonomyItem[]>([]);
  const [categories, setCategories] = useState<TaxonomyItem[]>([]);
  const [taxonomyNameAr, setTaxonomyNameAr] = useState("");
  const [taxonomyNameEn, setTaxonomyNameEn] = useState("");
  const [editingTaxonomyId, setEditingTaxonomyId] = useState<number | null>(null);
  const [taxonomyError, setTaxonomyError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", titleEn: "", description: "", descriptionEn: "", city: "makkah", category: "mosque", coordinates: "", lat: "", lng: "" });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    titleEn: "",
    coordinates: "",
    city: "makkah",
    category: "mosque",
    description: "",
    descriptionEn: "",
  });
  const ar = language === "ar";
  const cityOptions = Array.from(new Set(allPlaces.map((place) => place.city)));
  const cityMatches = selectedCities.length ? allPlaces.filter((place) => selectedCities.includes(place.city)) : allPlaces;
  const categoryOptions = Array.from(new Set(cityMatches.map((place) => place.typeEn)));
  const visible = placesReady ? cityMatches.filter((place) => !selectedCategories.length || selectedCategories.includes(place.typeEn)) : [];
  const nearbyPlaces = userLocation ? visible.map((place) => ({ place, distance: distanceInKm(userLocation, place) })).filter(({ distance }) => distance <= NEARBY_RADIUS_KM).sort((a, b) => a.distance - b.distance) : [];
  const displayedPlaces = userLocation ? nearbyPlaces.map(({ place }) => place) : visible;
  const openFavoriteList = favoriteLists.find((list) => list.id === openFavoriteListId) ?? null;
  useEffect(() => {
    fetch("/api/auth/config")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((config) => setSupabase(createClient(config.url, config.anonKey)))
      .catch(() => setAuthError("Authentication is unavailable."));
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const restoreSession = async (accessToken?: string) => {
      if (!accessToken) { if (active) { setAccount(null); setFavoriteLists([]); } return; }
      try {
        const response = await fetch("/api/me", { headers: { Authorization: "Bearer " + accessToken } });
        const profile = await response.json();
        if (!response.ok) throw new Error(profile.error);
        if (!active) return;
        setAccount(profile);
        await loadFavoriteLists(accessToken);
        if (profile.role === "admin") await loadTaxonomy(accessToken);
      } catch { if (active) setAccount(null); }
    };
    supabase.auth.getSession().then(({ data }) => { void restoreSession(data.session?.access_token); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { void restoreSession(session?.access_token); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase]);
  useEffect(() => {
    const closeFilter = (event: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFiltersOpen(false); };
    document.addEventListener("mousedown", closeFilter);
    return () => document.removeEventListener("mousedown", closeFilter);
  }, []);
  useEffect(() => {
    fetch("/api/places")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((savedPlaces: Place[]) => {
        if (savedPlaces.length) { setAllPlaces(savedPlaces); setSelected(savedPlaces[0]); }
        setPlacesReady(true);
      })
      .catch(() => {
        // Keep the bundled sample places visible if persistence is unavailable.
        setPlacesReady(true);
      });
  }, []);
  useEffect(() => {
    let active = true;
    void import("leaflet").then((module) => {
      if (!active || !mapRef.current || mapInstance.current) return;
      const L = module.default;
      leaflet.current = module;
      const map = L.map(mapRef.current, {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([23, 39.75], 6);
      mapInstance.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      setMapReady(true);
    });
    return () => {
      active = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markers.current = null;
      leaflet.current = null;
      setMapReady(false);
    };
  }, []);
  useEffect(() => {
    const map = mapInstance.current;
    const L = leaflet.current?.default;
    if (!map || !L) return;
    markers.current?.remove();
    const layer = L.layerGroup().addTo(map);
    markers.current = layer;
    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#2f78c4", fillOpacity: 1 }).addTo(layer).bindTooltip(ar ? "موقعك" : "Your location", { direction: "top", offset: [0, -8] });
    }
    displayedPlaces.forEach((place) => {
      const isSelected = place.id === selected.id;
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: isSelected ? 12 : 9,
        color: "#fff",
        weight: 3,
        fillColor: isSelected ? "#ba8132" : "#315e4c",
        fillOpacity: 1,
      }).addTo(layer);
      marker.bindTooltip(place.title, {
        direction: "top",
        offset: [0, -8],
        opacity: 0.94,
      });
      marker.on("click", () => {
        setSelected(place);
        map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), {
          duration: 0.65,
        });
      });
    });
  }, [ar, displayedPlaces, mapReady, selected, userLocation]);
  useEffect(() => { setSelectedCategories((current) => current.filter((category) => categoryOptions.includes(category))); }, [categoryOptions.join("|")]);
  const text = (p: Place, k: "title" | "type" | "era" | "description") =>
    ar ? p[k] : (p[(k + "En") as keyof Place] as string);
  const cityLabel = (place: Pick<Place, "city" | "cityAr">) => {
    if (ar && place.cityAr) return place.cityAr;
    const normalized = place.city.trim().toLowerCase();
    const cities: Record<string, [string, string]> = { makkah: ["مكة المكرمة", "Makkah"], mecca: ["مكة المكرمة", "Makkah"], "مكة": ["مكة المكرمة", "Makkah"], "مكة المكرمة": ["مكة المكرمة", "Makkah"], madina: ["المدينة المنورة", "Madinah"], madinah: ["المدينة المنورة", "Madinah"], medina: ["المدينة المنورة", "Madinah"], "المدينة": ["المدينة المنورة", "Madinah"], "المدينة المنورة": ["المدينة المنورة", "Madinah"], karbala: ["كربلاء", "Karbala"], "كربلاء": ["كربلاء", "Karbala"], najaf: ["النجف", "Najaf"], "النجف": ["النجف", "Najaf"], mashhad: ["مشهد", "Mashhad"], "مشهد": ["مشهد", "Mashhad"] };
    if (cities[normalized]) return cities[normalized][ar ? 0 : 1];
    return place.city;
  };
  const tokenFor = async () => (await supabase?.auth.getSession())?.data.session?.access_token;
  const loadFavoriteLists = async (token: string) => {
    const response = await fetch("/api/favorite-lists", { headers: { Authorization: "Bearer " + token } });
    if (!response.ok) throw new Error((await response.json()).error || "Could not load favorite lists.");
    setFavoriteLists(await response.json());
  };
  const loadTaxonomy = async (token: string) => { const response = await fetch("/api/admin/taxonomy", { headers: { Authorization: "Bearer " + token } }); if (!response.ok) throw new Error("Could not load cities and categories."); const data = await response.json(); setCities(data.cities); setCategories(data.categories); };
  const openFavoritePicker = (place: Place) => {
    setPendingFavoritePlace(place);
    setFavoriteError("");
    if (!account) {
      setAuthOpen(true);
      return;
    }
    setFavoritePickerOpen(true);
  };
  const addPlaceToFavoriteList = async (listId: number) => {
    if (!pendingFavoritePlace) return;
    const token = await tokenFor();
    if (!token) return;
    setFavoriteBusy(true);
    setFavoriteError("");
    try {
      const response = await fetch(`/api/favorite-lists/${listId}/places`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ placeId: pendingFavoritePlace.id }) });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(data.error || "Could not save this place to the selected list.");
      setFavoriteLists((current) => current.map((list) => list.id === listId && !list.placeIds.includes(pendingFavoritePlace.id) ? { ...list, placeIds: [...list.placeIds, pendingFavoritePlace.id] } : list));
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not save this place.");
    } finally {
      setFavoriteBusy(false);
    }
  };
  const removePlaceFromFavoriteList = async (listId: number, placeId: number) => {
    const token = await tokenFor();
    if (!token) return;
    setFavoriteBusy(true);
    setFavoriteError("");
    try {
      const response = await fetch(`/api/favorite-lists/${listId}/places`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ placeId }) });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(data.error || "Could not remove this place from the list.");
      setFavoriteLists((current) => current.map((list) => list.id === listId ? { ...list, placeIds: list.placeIds.filter((id) => id !== placeId) } : list));
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not remove this place from the list.");
    } finally {
      setFavoriteBusy(false);
    }
  };
  const deleteFavoriteList = async (listId: number) => {
    const token = await tokenFor();
    if (!token) return;
    setFavoriteBusy(true);
    setFavoriteError("");
    try {
      const response = await fetch("/api/favorite-lists", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ id: listId }) });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(data.error || "Could not delete this list.");
      setFavoriteLists((current) => current.filter((list) => list.id !== listId));
      setOpenFavoriteListId(null);
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not delete this list.");
    } finally {
      setFavoriteBusy(false);
    }
  };
  const saveTaxonomyItem = async (event: React.FormEvent) => { event.preventDefault(); const token = await tokenFor(); if (!token) return; setFavoriteBusy(true); setTaxonomyError(""); try { const response = await fetch("/api/admin/taxonomy", { method: editingTaxonomyId ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ kind: manageTab, id: editingTaxonomyId ?? undefined, nameAr: taxonomyNameAr, nameEn: taxonomyNameEn }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); if (editingTaxonomyId) { const update = (items: TaxonomyItem[]) => items.map(item => item.id === editingTaxonomyId ? { ...item, nameAr: taxonomyNameAr, nameEn: taxonomyNameEn } : item); manageTab === "cities" ? setCities(update) : setCategories(update); } else manageTab === "cities" ? setCities(current => [...current, data]) : setCategories(current => [...current, data]); setEditingTaxonomyId(null); setTaxonomyNameAr(""); setTaxonomyNameEn(""); } catch (error) { setTaxonomyError(error instanceof Error ? error.message : "Could not save this item."); } finally { setFavoriteBusy(false); } };
  const deleteTaxonomyItem = async (item: TaxonomyItem) => { const token = await tokenFor(); if (!token) return; setFavoriteBusy(true); setTaxonomyError(""); try { const response = await fetch("/api/admin/taxonomy", { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ kind: manageTab, id: item.id, slug: item.slug }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); manageTab === "cities" ? setCities(current => current.filter(x => x.id !== item.id)) : setCategories(current => current.filter(x => x.id !== item.id)); } catch (error) { setTaxonomyError(error instanceof Error ? error.message : "Could not delete this item."); } finally { setFavoriteBusy(false); } };
  const shareFavoriteList = async (useShareSheet: boolean) => {
    if (!openFavoriteList) return;
    const token = await tokenFor();
    if (!token) return;
    setFavoriteBusy(true);
    setFavoriteError("");
    try {
      const response = await fetch(`/api/favorite-lists/${openFavoriteList.id}/share`, { method: "POST", headers: { Authorization: "Bearer " + token } });
      const data = await response.json().catch(() => ({} as { error?: string; shareToken?: string }));
      if (!response.ok || !data.shareToken) throw new Error(data.error || "Could not create a share link.");
      const url = `${window.location.origin}/favorites/${data.shareToken}`;
      if (useShareSheet && navigator.share) {
        await navigator.share({ title: openFavoriteList.title, url });
        setFavoriteError(ar ? "تمت مشاركة القائمة." : "List shared.");
      } else {
        await navigator.clipboard.writeText(url);
        setFavoriteError(ar ? "تم نسخ رابط القائمة." : "List link copied.");
      }
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not share this list.");
    } finally {
      setFavoriteBusy(false);
    }
  };
  const createFavoriteList = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = await tokenFor();
    if (!token) return;
    setFavoriteBusy(true);
    setFavoriteError("");
    try {
      const response = await fetch("/api/favorite-lists", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ title: favoriteListName }) });
      const list = await response.json();
      if (!response.ok) throw new Error(list.error);
      setFavoriteLists((current) => [...current, list]);
      setFavoriteListName("");
      if (pendingFavoritePlace) await addPlaceToFavoriteList(list.id);
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not create this list.");
    } finally {
      setFavoriteBusy(false);
    }
  };
  const selectFromList = (place: Place) => {
    setSelected(place);
    const map = mapInstance.current;
    if (map)
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 14), {
        animate: true,
        duration: 0.65,
      });
  };
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(ar ? "تحديد الموقع غير مدعوم في هذا المتصفح." : "Location is not supported by this browser.");
      return;
    }
    setLocationBusy(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { lat: coords.latitude, lng: coords.longitude };
        setUserLocation(location);
        setLocationBusy(false);
        const nearest = visible.map((place) => ({ place, distance: distanceInKm(location, place) })).filter(({ distance }) => distance <= NEARBY_RADIUS_KM).sort((a, b) => a.distance - b.distance)[0]?.place;
        if (nearest) setSelected(nearest);
        mapInstance.current?.flyTo([location.lat, location.lng], 12, { animate: true, duration: 0.65 });
      },
      (error) => {
        setLocationBusy(false);
        setLocationError(error.code === error.PERMISSION_DENIED ? (ar ? "يرجى السماح بالوصول إلى موقعك لعرض الأماكن القريبة." : "Allow location access to see nearby places.") : (ar ? "تعذر تحديد موقعك. حاول مرة أخرى." : "We could not determine your location. Please try again."));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };
  const clearNearbyResults = () => {
    setUserLocation(null);
    setLocationError("");
    mapInstance.current?.flyTo([23, 39.75], 6, { animate: true, duration: 0.65 });
  };
  const submitAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setAuthError(
        ar
          ? "خدمة تسجيل الدخول لم تجهز بعد. أعد تحميل الصفحة ثم حاول مرة أخرى."
          : "Sign-in is still connecting. Refresh the page, then try again.",
      );
      return;
    }
    setAuthError("");
    const result =
      authMode === "signup"
        ? await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: { data: { full_name: authName } },
          })
        : await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });
    if (result.error) {
      setAuthError(result.error.message);
      return;
    }
    if (!result.data.session) {
      setAuthError(
        ar
          ? "تحقق من بريدك الإلكتروني لإكمال التسجيل."
          : "Check your email to complete registration.",
      );
      return;
    }
    const response = await fetch("/api/me", {
      headers: { Authorization: "Bearer " + result.data.session.access_token },
    });
    const profile = await response.json();
    if (!response.ok) {
      setAuthError(profile.error);
      return;
    }
    setAccount(profile);
    try {
      await loadFavoriteLists(result.data.session.access_token);
      if (profile.role === "admin") await loadTaxonomy(result.data.session.access_token);
      if (pendingFavoritePlace) setFavoritePickerOpen(true);
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Could not load favorite lists.");
    }
    setAuthOpen(false);
  };
  const updateForm = (field: string, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const savePlace = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    const [lat, lng] = form.coordinates.split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormError(
        ar
          ? "أدخل الإحداثيات بصيغة: خط العرض، خط الطول"
          : "Enter coordinates as: latitude, longitude",
      );
      return;
    }
    if (!photoFile) { setFormError(ar ? "اختر صورة للمكان." : "Choose a photo for this place."); return; }
    const token = (await supabase?.auth.getSession())?.data.session
      ?.access_token;
    if (!token) {
      setFormError(
        ar ? "سجّل الدخول كمسؤول أولاً." : "Sign in as an administrator first.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries({ ...form, lat: String(lat), lng: String(lng) }).forEach(([key, value]) => payload.append(key, value));
      payload.append("photo", photoFile);
      const response = await fetch("/api/places", { method: "POST", headers: { Authorization: "Bearer " + token }, body: payload });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAllPlaces((current) => [...current, data]);
      setSelected(data);
      setAdmin(false);
      setForm({
        title: "",
        titleEn: "",
        coordinates: "",
        city: "makkah",
        category: "mosque",
        description: "",
        descriptionEn: "",
      });
      setPhotoFile(null);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save this place.",
      );
    } finally {
      setSaving(false);
    }
  };
  const deletePlace = async () => {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/places/${selected.id}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      if (!response.ok) throw new Error("Could not delete this place.");
      setAllPlaces((current) => current.filter((place) => place.id !== selected.id));
      setSelected(allPlaces.find((place) => place.id !== selected.id) ?? places[0]);
    } catch (error) { setFormError(error instanceof Error ? error.message : "Could not delete this place."); } finally { setSaving(false); }
  };
  const editPlace = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = (await supabase?.auth.getSession())?.data.session?.access_token; if (!token) return;
    const [lat,lng]=editForm.coordinates.split(",").map(Number); if(!Number.isFinite(lat)||!Number.isFinite(lng)){setFormError(ar?"أدخل الإحداثيات بصيغة: خط العرض، خط الطول":"Enter coordinates as: latitude, longitude");return;}
    setSaving(true); try { const payload=new FormData(); Object.entries(editForm).filter(([key])=>key!=="coordinates"&&key!=="lat"&&key!=="lng").forEach(([key,value])=>payload.append(key,value)); payload.append("lat",String(lat)); payload.append("lng",String(lng)); if(editPhotoFile)payload.append('photo',editPhotoFile); const response=await fetch(`/api/places/${selected.id}`,{method:"PUT",headers:{Authorization:"Bearer "+token},body:payload}); const data=await response.json(); if(!response.ok)throw new Error(data.error); const updated={...selected,...editForm,lat,lng,photo:editPhotoFile?URL.createObjectURL(editPhotoFile):selected.photo}; setSelected(updated); setAllPlaces(current=>current.map(place=>place.id===updated.id?updated:place)); setEditOpen(false); } catch(error){setFormError(error instanceof Error?error.message:"Could not update this place.");} finally{setSaving(false);}
  };
  return (
    <main dir={ar ? "rtl" : "ltr"} className="site">
      <header>
        <a className="brand" href="#map">
          <span><img src="/paths-of-revelation-logo.png" alt="" /></span>
          <b>
            {ar ? "دروب الوحي" : "Paths of Revelation"}
            <small>
              {ar ? "خريطة السيرة النبوية" : "A map of prophetic heritage"}
            </small>
          </b>
        </a>
        <button className="mobile-menu-toggle" type="button" aria-label={ar ? "فتح القائمة" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? "×" : "☰"}</button>
        <nav className={mobileMenuOpen ? "mobile-open" : ""} onClick={() => setMobileMenuOpen(false)}>
          <button onClick={() => { setFavoriteError(""); setOpenFavoriteListId(null); account ? setListsOpen(true) : setAuthOpen(true); }}>
            {ar ? "قوائمي المفضلة" : "My favorite lists"} <em>{favoriteLists.length}</em>
          </button>
          {account?.role === "admin" && (
            <><button onClick={() => setAdmin(true)}>{ar ? "إضافة مكان" : "Add place"}</button><button onClick={() => { setTaxonomyError(""); setManageOpen(true); }}>{ar ? "إدارة" : "Manage"}</button></>
          )}
          <button onClick={() => setLanguage(ar ? "en" : "ar")}>
            {ar ? "English" : "العربية"}
          </button>
          {account ? (
            <button
              className="solid"
              onClick={() => {
                supabase?.auth.signOut();
                setAccount(null);
                setFavoriteLists([]);
              }}
            >
              {account.displayName} · {ar ? "خروج" : "Sign out"}
            </button>
          ) : (
            <button className="solid" onClick={() => setAuthOpen(true)}>
              {ar ? "تسجيل الدخول" : "Sign in"}
            </button>
          )}
        </nav>
      </header>
      <section className="hero">
        <div>
          <p>{ar ? "مكة المكرمة . المدينة المنورة . كربلاء . النجف ... والمزيد" : "MAKKAH . MADINAH . KARBALA . NAJAF ... AND MORE"}</p>
          <h1>
            {ar ? (
              <>
                اكتشف الأماكن التي تحكي <i>السيرة</i>
              </>
            ) : (
              <>
                Discover places that tell the <i>Seerah</i>
              </>
            )}
          </h1>
          <small>
            {ar
              ? "خريطة حيّة، وقصص الأمكنة، وخطط زيارة تشاركها مع من تحب."
              : "A live map, stories, and visit plans to share."}
          </small>
        </div>
      </section>
      <section id="map" className="workspace">
        <aside className="explorer">
          <div className="explorer-heading">
            <div>
              <p>{ar ? "استكشف الخريطة" : "EXPLORE THE MAP"}</p>
              <h2>{ar ? "الأماكن المقدسة" : "Sacred places"}</h2>
            </div>
            <div className="explorer-actions"><span>{displayedPlaces.length}</span><div className="filter-wrap" ref={filterRef}><button className={`filter-icon ${(selectedCities.length || selectedCategories.length) ? "active" : ""}`} type="button" onClick={() => setFiltersOpen((open) => !open)} aria-label={ar ? "تصفية الأماكن" : "Filter places"} title={ar ? "تصفية الأماكن" : "Filter places"}>≡</button>{filtersOpen && <div className="filter-panel"><section><b>{ar ? "المدن" : "Cities"}</b>{cityOptions.map((option) => <button key={option} className={selectedCities.includes(option) ? "checked" : ""} onClick={() => setSelectedCities((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])}>{selectedCities.includes(option) ? "✓ " : ""}{ar ? allPlaces.find((place) => place.city === option)?.cityAr ?? option : option}</button>)}</section><section><b>{ar ? "الفئات" : "Categories"}</b>{categoryOptions.map((option) => <button key={option} className={selectedCategories.includes(option) ? "checked" : ""} onClick={() => setSelectedCategories((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])}>{selectedCategories.includes(option) ? "✓ " : ""}{ar ? allPlaces.find((place) => place.typeEn === option)?.type : option}</button>)}{!categoryOptions.length && <small>{ar ? "لا توجد فئات مطابقة" : "No matching categories"}</small>}</section>{(selectedCities.length || selectedCategories.length) > 0 && <button className="clear-filters" type="button" onClick={() => { setSelectedCities([]); setSelectedCategories([]); }}>{ar ? "مسح التصفية" : "Clear filters"}</button>}</div>}</div></div>
          </div>
          <div className="place-controls"><button className="nearby-button" type="button" onClick={captureLocation} disabled={locationBusy}><span>◎</span>{locationBusy ? (ar ? "جارٍ تحديد موقعك…" : "Finding your location…") : userLocation ? (ar ? "تحديث الأماكن القريبة" : "Refresh nearby places") : (ar ? "الأماكن القريبة مني" : "Places near me")}</button>{userLocation && <button className="clear-nearby-button" type="button" onClick={clearNearbyResults}>{ar ? "كل الأماكن" : "Show all"}</button>}</div>
          {userLocation && <p className="nearby-summary">{nearbyPlaces.length ? (ar ? `${nearbyPlaces.length} ضمن ${NEARBY_RADIUS_KM} كم` : `${nearbyPlaces.length} within ${NEARBY_RADIUS_KM} km`) : (ar ? `لا توجد أماكن ضمن ${NEARBY_RADIUS_KM} كم` : `No places within ${NEARBY_RADIUS_KM} km`)}</p>}
          {locationError && <p className="nearby-error">{locationError}</p>}
          <div className="place-list">
            {displayedPlaces.map((p) => (
              <button
                className={selected.id === p.id ? "selected" : ""}
                onClick={() => selectFromList(p)}
                key={p.id}
              >
                <img src={p.photo} alt="" />
                <span>
                  <b>{text(p, "title")}</b>
                  <small>{userLocation ? `${distanceInKm(userLocation, p).toFixed(1)} ${ar ? "كم" : "km"} · ${cityLabel(p)} · ${text(p, "type")}` : `${cityLabel(p)} · ${text(p, "type")}`}</small>
                </span>
                <i>↗</i>
              </button>
            ))}
          </div>
        </aside>
        <div className="map-area">
          <div
            ref={mapRef}
            className="map"
            aria-label={
              ar
                ? "خريطة تفاعلية لمكة والمدينة"
                : "Interactive map of Makkah and Madinah"
            }
          />
        </div>
        <article className="card">
          {!placesReady ? <div className="place-loading">{ar ? "جارٍ تحميل الأماكن…" : "Loading places…"}</div> : <><img src={selected.photo} alt={text(selected, "title")} />
          <div>
            <p>
              {ar ? cityLabel(selected) : cityLabel(selected).toUpperCase()}{" "}
              · {text(selected, "type")}
            </p>
            <section>
              <h2>{text(selected, "title")}</h2>
              <button aria-label={ar ? "إضافة إلى قائمة مفضلة" : "Add to a favorite list"} onClick={() => openFavoritePicker(selected)}>
                {favoriteLists.some((list) => list.placeIds.includes(selected.id)) ? "♥" : "♡"}
              </button>
            </section>
            <p className="description">{text(selected, "description")}</p>
            <nav>
              <a
                target="_blank"
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              >
                {ar ? "الاتجاهات" : "Directions"} ↗
              </a>
              <button onClick={() => openFavoritePicker(selected)}>
                {ar ? "أضف إلى المفضلة" : "Add to favorites"} +
              </button>
            </nav>
                {account?.role === "admin" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button disabled={saving} onClick={() => { setEditForm({title:selected.title,titleEn:selected.titleEn,description:selected.description,descriptionEn:selected.descriptionEn,city:cities.find(item=>item.nameEn===selected.city||item.nameAr===selected.city)?.slug??selected.city.toLowerCase(),category:categories.find(item=>item.nameEn===selected.typeEn||item.nameAr===selected.type)?.slug??selected.typeEn.toLowerCase(),coordinates:`${selected.lat}, ${selected.lng}`,lat:String(selected.lat),lng:String(selected.lng)}); setEditPhotoFile(null); setEditOpen(true); }} style={{ flex: 1, border: "1px solid #315e4c", background: "transparent", color: "#315e4c", padding: "9px", fontSize: 12, fontWeight: 400 }}>{ar ? "تعديل الموقع" : "Edit place"}</button><button disabled={saving} onClick={deletePlace} style={{ flex: 1, border: "1px solid #b45a4a", background: "transparent", color: "#9a493a", padding: "9px", fontSize: 12, fontWeight: 400 }}>{ar ? "حذف الموقع" : "Delete place"}</button></div>}
          </div></>}
        </article>
      </section>
      <section className="principles">
        <div>
          <span>01</span>
          <h3>{ar ? "مصادر واضحة" : "Clear sources"}</h3>
          <p>
            {ar
              ? "لكل موقع مساحة للمراجع والتحقق العلمي."
              : "Every place makes room for references and scholarly verification."}
          </p>
        </div>
        <div>
          <span>02</span>
          <h3>{ar ? "رحلتك الخاصة" : "Your own journey"}</h3>
          <p>
            {ar
              ? "احفظ الأماكن، رتّب الأيام، وشارك خطتك."
              : "Save places, arrange your days, and share your plan."}
          </p>
        </div>
        <div>
          <span>03</span>
          <h3>{ar ? "لغتان، معنى واحد" : "Two languages, one meaning"}</h3>
          <p>
            {ar
              ? "إدارة مستقلة للنص العربي وترجمته الإنجليزية."
              : "Independently managed Arabic and English content."}
          </p>
        </div>
      </section>
      {listsOpen && (
        <div className="backdrop" onClick={() => { setListsOpen(false); setOpenFavoriteListId(null); }}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => { setListsOpen(false); setOpenFavoriteListId(null); }}>
              ×
            </button>
            {openFavoriteList ? <>
              <button className="modal-back" onClick={() => setOpenFavoriteListId(null)}>← {ar ? "كل القوائم" : "All lists"}</button>
              <p>{ar ? "قائمة مفضلة" : "FAVORITE LIST"}</p>
              <h2>{openFavoriteList.title}</h2>
              <small>{openFavoriteList.placeIds.length ? (ar ? "اختر مكاناً لعرضه على الخريطة." : "Choose a place to view it on the map.") : (ar ? "هذه القائمة فارغة حتى الآن." : "This list is empty for now.")}</small>
              <div className="favorite-list-actions"><button type="button" disabled={favoriteBusy} onClick={() => shareFavoriteList(false)}>{ar ? "نسخ الرابط" : "Copy link"}</button>{typeof navigator !== "undefined" && "share" in navigator && <button type="button" disabled={favoriteBusy} onClick={() => shareFavoriteList(true)}>{ar ? "مشاركة" : "Share"}</button>}<button type="button" disabled={favoriteBusy} onClick={() => deleteFavoriteList(openFavoriteList.id)} className="delete-list-button">{ar ? "حذف القائمة" : "Delete list"}</button></div>
              <div className="favorite-place-items">
                {allPlaces.filter((place) => openFavoriteList.placeIds.includes(place.id)).map((place) => <div className="favorite-place-row" key={place.id}><button className="favorite-place-select" onClick={() => { selectFromList(place); setListsOpen(false); setOpenFavoriteListId(null); }}><img src={place.photo} alt="" /><span><b>{text(place, "title")}</b><small>{place.city}</small></span></button><button className="favorite-place-icon" type="button" aria-label={ar ? "عرض المكان على الخريطة" : "View place on map"} title={ar ? "عرض المكان على الخريطة" : "View place on map"} onClick={() => { selectFromList(place); setListsOpen(false); setOpenFavoriteListId(null); }}>↗</button><button className="favorite-place-icon delete" type="button" disabled={favoriteBusy} aria-label={ar ? "إزالة من القائمة" : "Remove from list"} title={ar ? "إزالة من القائمة" : "Remove from list"} onClick={() => removePlaceFromFavoriteList(openFavoriteList.id, place.id)}>🗑</button></div>)}
              </div>
              {favoriteError && <p className="form-error">{favoriteError}</p>}
            </> : <>
              <p>{ar ? "قوائمي" : "MY LISTS"}</p>
              <h2>{ar ? "قوائم الأماكن المفضلة" : "Favorite place lists"}</h2>
              <small>{ar ? "أنشئ قوائم باسمك واحفظ الأماكن في القائمة المناسبة." : "Create named lists and save each place in the list that fits."}</small>
              <div className="trip-items">
                {favoriteLists.map((list) => <button type="button" className="favorite-list-row" key={list.id} onClick={() => setOpenFavoriteListId(list.id)}><span>♥</span><b>{list.title}</b><small>{list.placeIds.length} {ar ? "أماكن" : "places"}</small><i>›</i></button>)}
                {!favoriteLists.length && <div><small>{ar ? "لا توجد قوائم بعد. أنشئ قائمتك الأولى." : "No lists yet. Create your first one."}</small></div>}
              </div>
              <form className="form" onSubmit={createFavoriteList}>
                <label className="full">{ar ? "اسم القائمة" : "List name"}<input required maxLength={80} value={favoriteListName} onChange={(e) => setFavoriteListName(e.target.value)} placeholder={ar ? "مثال: أماكن أود زيارتها" : "For example: Places to visit"} /></label>
                {favoriteError && <p className="form-error">{favoriteError}</p>}
                <button disabled={favoriteBusy} className="solid wide">{favoriteBusy ? (ar ? "جارٍ الإنشاء…" : "Creating…") : (ar ? "إنشاء قائمة جديدة" : "Create new list")}</button>
              </form>
            </>}
          </section>
        </div>
      )}
      {favoritePickerOpen && pendingFavoritePlace && (
        <div className="backdrop" onClick={() => setFavoritePickerOpen(false)}>
          <section className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setFavoritePickerOpen(false)}>×</button>
            <p>{ar ? "إضافة إلى المفضلة" : "ADD TO FAVORITES"}</p>
            <h2>{text(pendingFavoritePlace, "title")}</h2>
            <small>{ar ? "يمكنك حفظ هذا المكان في أكثر من قائمة. اختر كل القوائم المناسبة، أو أنشئ قائمة جديدة." : "You can save this place in more than one list. Choose every list that fits, or create a new one."}</small>
            <div className="trip-items">
              {favoriteLists.map((list) => <div className="favorite-picker-row" key={list.id}><b>{list.title}</b>{list.placeIds.includes(pendingFavoritePlace.id) ? <button className="favorite-picker-control remove" disabled={favoriteBusy} aria-label={ar ? "إزالة من القائمة" : "Remove from list"} title={ar ? "إزالة من القائمة" : "Remove from list"} onClick={() => removePlaceFromFavoriteList(list.id, pendingFavoritePlace.id)}>−</button> : <button className="favorite-picker-control" disabled={favoriteBusy} aria-label={ar ? "إضافة إلى القائمة" : "Add to list"} title={ar ? "إضافة إلى القائمة" : "Add to list"} onClick={() => addPlaceToFavoriteList(list.id)}>+</button>}</div>)}
            </div>
            <form className="form" onSubmit={createFavoriteList}>
              <label className="full">{ar ? "اسم القائمة الجديدة" : "New list name"}<input required maxLength={80} value={favoriteListName} onChange={(e) => setFavoriteListName(e.target.value)} placeholder={ar ? "مثال: زيارتي القادمة" : "For example: Next visit"} /></label>
              {favoriteError && <p className="form-error">{favoriteError}</p>}
              <button disabled={favoriteBusy} className="solid wide" style={{ fontSize: 12, fontWeight: 400, padding: "9px" }}>{ar ? "إنشاء وإضافة المكان" : "Create and add place"}</button>
            </form>
          </section>
        </div>
      )}
      {manageOpen && <div className="backdrop" onClick={() => setManageOpen(false)}><section className="modal admin" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setManageOpen(false)}>×</button><p>{ar ? "إدارة" : "MANAGE"}</p><h2>{ar ? "إدارة المدن والفئات" : "Manage cities and categories"}</h2><div className="manage-tabs"><button className={manageTab === "cities" ? "active" : ""} onClick={() => { setManageTab("cities"); setTaxonomyError(""); }}>{ar ? "المدن" : "Cities"}</button><button className={manageTab === "categories" ? "active" : ""} onClick={() => { setManageTab("categories"); setTaxonomyError(""); }}>{ar ? "الفئات" : "Categories"}</button></div><div className="manage-items">{(manageTab === "cities" ? cities : categories).map((item) => <div key={item.id}><span><b>{ar ? item.nameAr : item.nameEn}</b><small>{ar ? item.nameEn : item.nameAr}</small></span><aside><button type="button" disabled={favoriteBusy} title={ar ? "تعديل" : "Edit"} aria-label={ar ? "تعديل" : "Edit"} onClick={() => { setEditingTaxonomyId(item.id); setTaxonomyNameAr(item.nameAr); setTaxonomyNameEn(item.nameEn); }}>✎</button><button type="button" disabled={favoriteBusy} title={ar ? "حذف" : "Delete"} aria-label={ar ? "حذف" : "Delete"} onClick={() => deleteTaxonomyItem(item)}>🗑</button></aside></div>)}</div><form className="form" onSubmit={saveTaxonomyItem}><label>{ar ? "الاسم بالعربية" : "Arabic name"}<input required value={taxonomyNameAr} onChange={(e) => setTaxonomyNameAr(e.target.value)} /></label><label>{ar ? "الاسم بالإنجليزية" : "English name"}<input required value={taxonomyNameEn} onChange={(e) => setTaxonomyNameEn(e.target.value)} /></label>{taxonomyError && <p className="form-error">{taxonomyError}</p>}<button disabled={favoriteBusy} className="solid wide">{editingTaxonomyId ? (ar ? "حفظ التعديل" : "Save changes") : (ar ? "إضافة" : "Add")}</button>{editingTaxonomyId && <button type="button" className="auth-switch" onClick={() => { setEditingTaxonomyId(null); setTaxonomyNameAr(""); setTaxonomyNameEn(""); }}>{ar ? "إلغاء" : "Cancel"}</button>}</form></section></div>}
      {admin && (
        <div className="backdrop" onClick={() => setAdmin(false)}>
          <section className="modal admin" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setAdmin(false)}>
              ×
            </button>
            <p>{ar ? "لوحة الإدارة" : "ADMIN PANEL"}</p>
            <h2>{ar ? "إضافة موقع جديد" : "Add a new place"}</h2>
            <small>
              {ar
                ? "أضف البيانات بالعربية والإنجليزية، ثم يظهر الموقع مباشرة على الخريطة."
                : "Add Arabic and English content, then the place appears on the map immediately."}
            </small>
            <form className="form" onSubmit={savePlace}>
              <label>
                {ar ? "العنوان بالعربية" : "Arabic title"}
                <input
                  required
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="مثال: مسجد..."
                />
              </label>
              <label>
                {ar ? "العنوان بالإنجليزية" : "English title"}
                <input
                  required
                  value={form.titleEn}
                  onChange={(e) => updateForm("titleEn", e.target.value)}
                  placeholder="Example: Mosque..."
                />
              </label>
              <label>
                {ar ? "المدينة" : "City"}
                <select
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                >{(cities.length ? cities : [{ id: 1, slug: "makkah", nameAr: "مكة المكرمة", nameEn: "Makkah" }, { id: 2, slug: "madinah", nameAr: "المدينة المنورة", nameEn: "Madinah" }]).map((item) => <option key={item.slug} value={item.slug}>{ar ? item.nameAr : item.nameEn}</option>)}</select>
              </label>
              <label>
                {ar ? "الفئة" : "Category"}
                <select
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                >{(categories.length ? categories : [{ id: 1, slug: "mosque", nameAr: "مسجد", nameEn: "Mosque" }]).map((item) => <option key={item.slug} value={item.slug}>{ar ? item.nameAr : item.nameEn}</option>)}</select>
              </label>
              <label>
                GPS
                <input
                  required
                  value={form.coordinates}
                  onChange={(e) => updateForm("coordinates", e.target.value)}
                  placeholder="21.4225, 39.8262"
                />
              </label>
              <label>
                {ar ? "صورة المكان" : "Place photo"}
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="full">
                {ar ? "الوصف بالعربية" : "Arabic description"}
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                />
              </label>
              <label className="full">
                {ar ? "الوصف بالإنجليزية" : "English description"}
                <textarea
                  required
                  value={form.descriptionEn}
                  onChange={(e) => updateForm("descriptionEn", e.target.value)}
                />
              </label>
              {formError && <p className="form-error">{formError}</p>}
              <button disabled={saving} className="solid wide">
                {saving
                  ? ar
                    ? "جارٍ الحفظ…"
                    : "Saving…"
                  : ar
                    ? "نشر الموقع على الخريطة"
                    : "Publish place to map"}
              </button>
            </form>
          </section>
        </div>
      )}
      {editOpen && <div className="backdrop" onClick={() => setEditOpen(false)}><section className="modal admin" onClick={(e) => e.stopPropagation()}><button className="close" onClick={() => setEditOpen(false)}>×</button><p>{ar ? "تعديل الموقع" : "EDIT PLACE"}</p><h2>{ar ? "تعديل بيانات الموقع" : "Edit place details"}</h2><form className="form" onSubmit={editPlace}><label>{ar ? "العنوان بالعربية" : "Arabic title"}<input required value={editForm.title} onChange={(e)=>setEditForm(x=>({...x,title:e.target.value}))}/></label><label>{ar ? "العنوان بالإنجليزية" : "English title"}<input required value={editForm.titleEn} onChange={(e)=>setEditForm(x=>({...x,titleEn:e.target.value}))}/></label><label>{ar ? "المدينة" : "City"}<select value={editForm.city} onChange={(e)=>setEditForm(x=>({...x,city:e.target.value}))}>{(cities.length ? cities : [{id:1,slug:'makkah',nameAr:'مكة المكرمة',nameEn:'Makkah'},{id:2,slug:'madinah',nameAr:'المدينة المنورة',nameEn:'Madinah'}]).map(item=><option key={item.slug} value={item.slug}>{ar?item.nameAr:item.nameEn}</option>)}</select></label><label>{ar ? "الفئة" : "Category"}<select value={editForm.category} onChange={(e)=>setEditForm(x=>({...x,category:e.target.value}))}>{(categories.length ? categories : [{id:1,slug:'mosque',nameAr:'مسجد',nameEn:'Mosque'}]).map(item=><option key={item.slug} value={item.slug}>{ar?item.nameAr:item.nameEn}</option>)}</select></label><label>GPS<input required value={editForm.coordinates} onChange={(e)=>setEditForm(x=>({...x,coordinates:e.target.value}))} placeholder="21.4225, 39.8262"/></label><label>{ar ? "صورة جديدة (اختياري)" : "New photo (optional)"}<input type="file" accept="image/*" onChange={(e)=>setEditPhotoFile(e.target.files?.[0]??null)}/></label><label className="full">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea required value={editForm.description} onChange={(e)=>setEditForm(x=>({...x,description:e.target.value}))}/></label><label className="full">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea required value={editForm.descriptionEn} onChange={(e)=>setEditForm(x=>({...x,descriptionEn:e.target.value}))}/></label>{formError&&<p className="form-error">{formError}</p>}<button disabled={saving} className="solid wide">{ar ? "حفظ التعديلات" : "Save changes"}</button></form></section></div>}
      {authOpen && (
        <div className="backdrop" onClick={() => setAuthOpen(false)}>
          <section
            className="modal auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close" onClick={() => setAuthOpen(false)}>
              ×
            </button>
            <p>
              {authMode === "login"
                ? ar
                  ? "تسجيل الدخول"
                  : "SIGN IN"
                : ar
                  ? "إنشاء حساب"
                  : "CREATE ACCOUNT"}
            </p>
            <h2>
              {authMode === "login"
                ? ar
                  ? "مرحباً بعودتك"
                  : "Welcome back"
                : ar
                  ? "ابدأ رحلتك"
                  : "Start your journey"}
            </h2>
            <form className="form" onSubmit={submitAuth}>
              {authMode === "signup" && (
                <label className="full">
                  {ar ? "الاسم" : "Name"}
                  <input
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </label>
              )}
              <label className="full">
                {ar ? "البريد الإلكتروني" : "Email"}
                <input
                  required
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </label>
              <label className="full">
                {ar ? "كلمة المرور" : "Password"}
                <input
                  required
                  minLength={8}
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </label>
              {authError && <p className="form-error">{authError}</p>}
              <button className="solid wide">
                {authMode === "login"
                  ? ar
                    ? "دخول"
                    : "Sign in"
                  : ar
                    ? "إنشاء الحساب"
                    : "Create account"}
              </button>
            </form>
            <button
              className="auth-switch"
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
            >
              {authMode === "login"
                ? ar
                  ? "ليس لديك حساب؟ أنشئ حساباً"
                  : "New here? Create an account"
                : ar
                  ? "لديك حساب؟ سجّل الدخول"
                  : "Already have an account? Sign in"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
