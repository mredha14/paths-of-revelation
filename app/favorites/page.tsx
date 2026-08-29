"use client";

import { useEffect, useState } from "react";
import SharedList from "./[token]/shared-list";

export default function SharedFavoriteListPage() {
  const [shareToken, setShareToken] = useState("");
  useEffect(() => { setShareToken(new URLSearchParams(window.location.search).get("list") ?? ""); }, []);
  if (!shareToken) return <main className="site" dir="rtl"><section className="shared-empty"><h1>القائمة غير متاحة</h1><p>لم يتم العثور على رابط قائمة مفضلة صالح.</p><a href="/">العودة إلى الخريطة</a></section></main>;
  return <SharedList shareToken={shareToken} />;
}
