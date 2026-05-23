"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch, ContentDetail } from "@/lib/api";

export default function EssayDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<ContentDetail | null>(null);

  useEffect(() => {
    apiFetch<ContentDetail>(`/api/essays/${params.slug}`)
      .then(setItem)
      .catch(() => router.push("/login"));
  }, [params.slug, router]);

  return (
    <AppShell>
      <article className="article">
        <h1>{item?.title || "随笔"}</h1>
        {item ? <p className="muted">{item.date}</p> : null}
        {item ? <div dangerouslySetInnerHTML={{ __html: item.body_html }} /> : <p className="muted">加载中...</p>}
      </article>
    </AppShell>
  );
}
