"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { InlineUpload } from "@/components/InlineUpload";
import { apiFetch, ContentItem } from "@/lib/api";

export default function EssaysPage() {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);

  function loadItems() {
    apiFetch<ContentItem[]>("/api/essays")
      .then(setItems)
      .catch(() => router.push("/login"));
  }

  useEffect(() => {
    loadItems();
  }, [router]);

  return (
    <AppShell>
      <div className="section-head">
        <div>
          <div className="hero-kicker">ESSAYS</div>
          <h1 className="page-title">随笔</h1>
          <p className="muted">那些比日记更长、也更愿意被整理的想法。</p>
        </div>
        <InlineUpload
          module="essays"
          label="上传随笔"
          hint="随笔文件名建议是 YYYY-MM-DD-slug.md，并且 front matter 里需要 title、date、slug。"
          onUploaded={loadItems}
        />
      </div>
      <div className="list">
        {items.map((item) => (
          <Link className="list-item" href={`/essays/${item.slug}`} key={item.slug}>
            <span className="muted">{item.date}</span>
            <h2>{item.title}</h2>
            {item.summary ? <p>{item.summary}</p> : null}
            <div className="tags">
              {item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
