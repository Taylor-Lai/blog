"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch, ContentDetail } from "@/lib/api";

export default function DiaryDetailPage() {
  const router = useRouter();
  const params = useParams<{ date: string }>();
  const [item, setItem] = useState<ContentDetail | null>(null);

  useEffect(() => {
    apiFetch<ContentDetail>(`/api/diary/${params.date}`)
      .then(setItem)
      .catch(() => router.push("/login"));
  }, [params.date, router]);

  return (
    <AppShell compact title={item?.date || "日记"}>
      <article className="card-base article">
        <div className="hero-kicker">DIARY</div>
        <h1>{item?.date || "日记"}</h1>
        {item ? <div dangerouslySetInnerHTML={{ __html: item.body_html }} /> : <p className="muted">加载中...</p>}
      </article>
    </AppShell>
  );
}
