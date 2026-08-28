"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Place = {
  id: number;
  city: "Makkah" | "Madinah";
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
  source: string;
};
type FavoriteList = { id: number; title: string; placeIds: number[] };
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
    source: "مادة تجريبية — أضف المصدر المعتمد",
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
    source: "مادة تجريبية — أضف المصدر المعتمد",
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
    source: "مادة تجريبية — أضف المصدر المعتمد",
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
    source: "مادة تجريبية — أضف المصدر المعتمد",
  },
];
export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
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
  const [city, setCity] = useState<"all" | Place["city"]>("all");
  const [allPlaces, setAllPlaces] = useState<Place[]>(places);
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
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    title: "",
    titleEn: "",
    coordinates: "",
    city: "Makkah",
    category: "mosque",
    description: "",
    descriptionEn: "",
    photo: "",
  });
  const ar = language === "ar";
  const visible =
    city === "all" ? allPlaces : allPlaces.filter((p) => p.city === city);
  const favoritePlaceCount = new Set(favoriteLists.flatMap((list) => list.placeIds)).size;
  const openFavoriteList = favoriteLists.find((list) => list.id === openFavoriteListId) ?? null;
  useEffect(() => {
    fetch("/api/auth/config")
      .then((response) => response.json())
      .then((config) => setSupabase(createClient(config.url, config.anonKey)))
      .catch(() => setAuthError("Authentication is unavailable."));
  }, []);
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([23, 39.75], 6);
    mapInstance.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    markers.current?.remove();
    const layer = L.layerGroup().addTo(map);
    markers.current = layer;
    allPlaces.forEach((place) => {
      const marker = L.circleMarker([place.lat, place.lng], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: "#315e4c",
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
  }, [allPlaces]);
  const text = (p: Place, k: "title" | "type" | "era" | "description") =>
    ar ? p[k] : (p[(k + "En") as keyof Place] as string);
  const tokenFor = async () => (await supabase?.auth.getSession())?.data.session?.access_token;
  const loadFavoriteLists = async (token: string) => {
    const response = await fetch("/api/favorite-lists", { headers: { Authorization: "Bearer " + token } });
    if (!response.ok) throw new Error((await response.json()).error || "Could not load favorite lists.");
    setFavoriteLists(await response.json());
  };
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
      const response = await fetch("/api/places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ ...form, lat, lng }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAllPlaces((current) => [...current, data]);
      setSelected(data);
      setAdmin(false);
      setForm({
        title: "",
        titleEn: "",
        coordinates: "",
        city: "Makkah",
        category: "mosque",
        description: "",
        descriptionEn: "",
        photo: "",
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save this place.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main dir={ar ? "rtl" : "ltr"} className="site">
      <header>
        <a className="brand" href="#map">
          <span>ر</span>
          <b>
            {ar ? "دروب الوحي" : "Paths of Revelation"}
            <small>
              {ar ? "خريطة السيرة النبوية" : "A map of prophetic heritage"}
            </small>
          </b>
        </a>
        <nav>
          <button onClick={() => { setFavoriteError(""); setOpenFavoriteListId(null); account ? setListsOpen(true) : setAuthOpen(true); }}>
            {ar ? "قوائمي المفضلة" : "My favorite lists"} <em>{favoritePlaceCount}</em>
          </button>
          {account?.role === "admin" && (
            <button onClick={() => setAdmin(true)}>
              {ar ? "إدارة المحتوى" : "Content admin"}
            </button>
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
          <p>{ar ? "مكة المكرمة · المدينة المنورة" : "MAKKAH · MADINAH"}</p>
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
              ? "خريطة حيّة، وقصص موثقة، وخطط زيارة تشاركها مع من تحب."
              : "A living map, sourced stories, and visit plans to share."}
          </small>
        </div>
        <aside>
          ◌ {ar ? "تصفّح بأدب ومعرفة" : "Explore with care and knowledge"}
        </aside>
      </section>
      <section id="map" className="workspace">
        <aside className="explorer">
          <div className="explorer-heading">
            <div>
              <p>{ar ? "استكشف الخريطة" : "EXPLORE THE MAP"}</p>
              <h2>{ar ? "الأماكن المقدسة" : "Sacred places"}</h2>
            </div>
            <span>{visible.length}</span>
          </div>
          <div className="filters">
            <button
              className={city === "all" ? "active" : ""}
              onClick={() => setCity("all")}
            >
              {ar ? "الكل" : "All"}
            </button>
            <button
              className={city === "Makkah" ? "active" : ""}
              onClick={() => setCity("Makkah")}
            >
              {ar ? "مكة" : "Makkah"}
            </button>
            <button
              className={city === "Madinah" ? "active" : ""}
              onClick={() => setCity("Madinah")}
            >
              {ar ? "المدينة" : "Madinah"}
            </button>
          </div>
          <div className="place-list">
            {visible.map((p) => (
              <button
                className={selected.id === p.id ? "selected" : ""}
                onClick={() => selectFromList(p)}
                key={p.id}
              >
                <img src={p.photo} alt="" />
                <span>
                  <b>{text(p, "title")}</b>
                  <small>
                    {text(p, "type")} · {text(p, "era")}
                  </small>
                </span>
                <i>↗</i>
              </button>
            ))}
          </div>
          <footer>
            {ar
              ? "© OpenStreetMap · جميع المواقع مرتبطة بإحداثياتها"
              : "© OpenStreetMap · all places use GPS coordinates"}
          </footer>
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
          <img src={selected.photo} alt={text(selected, "title")} />
          <div>
            <p>
              {selected.city === "Makkah"
                ? ar
                  ? "مكة المكرمة"
                  : "MAKKAH"
                : ar
                  ? "المدينة المنورة"
                  : "MADINAH"}{" "}
              · {text(selected, "type")}
            </p>
            <section>
              <h2>{text(selected, "title")}</h2>
              <button aria-label={ar ? "إضافة إلى قائمة مفضلة" : "Add to a favorite list"} onClick={() => openFavoritePicker(selected)}>
                {favoriteLists.some((list) => list.placeIds.includes(selected.id)) ? "♥" : "♡"}
              </button>
            </section>
            <p className="description">{text(selected, "description")}</p>
            <aside>
              <b>{ar ? "المصدر" : "Source"}</b>
              <small>{selected.source}</small>
            </aside>
            <nav>
              <a
                target="_blank"
                href={
                  "https://www.openstreetmap.org/?mlat=" +
                  selected.lat +
                  "&mlon=" +
                  selected.lng +
                  "#map=15/" +
                  selected.lat +
                  "/" +
                  selected.lng
                }
              >
                {ar ? "الاتجاهات" : "Directions"} ↗
              </a>
              <button onClick={() => openFavoritePicker(selected)}>
                {ar ? "أضف إلى المفضلة" : "Add to favorites"} +
              </button>
            </nav>
          </div>
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
              <div className="favorite-place-items">
                {allPlaces.filter((place) => openFavoriteList.placeIds.includes(place.id)).map((place) => <button key={place.id} onClick={() => { selectFromList(place); setListsOpen(false); setOpenFavoriteListId(null); }}><img src={place.photo} alt="" /><span><b>{text(place, "title")}</b><small>{place.city}</small></span><i>↗</i></button>)}
              </div>
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
              {favoriteLists.map((list) => <div key={list.id}><b>{list.title}</b><button disabled={favoriteBusy || list.placeIds.includes(pendingFavoritePlace.id)} onClick={() => addPlaceToFavoriteList(list.id)}>{list.placeIds.includes(pendingFavoritePlace.id) ? (ar ? "محفوظ" : "Saved") : (ar ? "إضافة" : "Add")}</button></div>)}
            </div>
            <form className="form" onSubmit={createFavoriteList}>
              <label className="full">{ar ? "اسم القائمة الجديدة" : "New list name"}<input required maxLength={80} value={favoriteListName} onChange={(e) => setFavoriteListName(e.target.value)} placeholder={ar ? "مثال: زيارتي القادمة" : "For example: Next visit"} /></label>
              {favoriteError && <p className="form-error">{favoriteError}</p>}
              <button disabled={favoriteBusy} className="solid wide">{ar ? "إنشاء وإضافة المكان" : "Create and add place"}</button>
            </form>
          </section>
        </div>
      )}
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
                GPS
                <input
                  required
                  value={form.coordinates}
                  onChange={(e) => updateForm("coordinates", e.target.value)}
                  placeholder="21.4225, 39.8262"
                />
              </label>
              <label>
                {ar ? "المدينة" : "City"}
                <select
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                >
                  <option value="Makkah">
                    {ar ? "مكة المكرمة" : "Makkah"}
                  </option>
                  <option value="Madinah">
                    {ar ? "المدينة المنورة" : "Madinah"}
                  </option>
                </select>
              </label>
              <label>
                {ar ? "الفئة" : "Category"}
                <select
                  value={form.category}
                  onChange={(e) => updateForm("category", e.target.value)}
                >
                  <option value="mosque">{ar ? "مسجد" : "Mosque"}</option>
                  <option value="revelation">
                    {ar ? "موضع وحي" : "Revelation site"}
                  </option>
                  <option value="mountain">
                    {ar ? "جبل أو معلم طبيعي" : "Mountain / landmark"}
                  </option>
                  <option value="historic_site">
                    {ar ? "موقع تاريخي" : "Historic site"}
                  </option>
                  <option value="route">{ar ? "طريق أو مسار" : "Route"}</option>
                  <option value="residence">
                    {ar ? "منزل أو إقامة" : "Residence"}
                  </option>
                  <option value="cemetery">{ar ? "مقبرة" : "Cemetery"}</option>
                </select>
              </label>
              <label>
                {ar ? "رابط الصورة" : "Photo URL"}
                <input
                  value={form.photo}
                  onChange={(e) => updateForm("photo", e.target.value)}
                  placeholder="https://..."
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
