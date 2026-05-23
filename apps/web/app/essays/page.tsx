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
    <AppShell compact title="随笔">
      <section className="card-base section-panel">
        <div className="section-header">
          <div>
            <div className="hero-kicker">ESSAYS</div>
            <h1 className="page-title">随笔</h1>
            <p className="muted">有日期，也有标题，适合更完整地整理一段想法。</p>
          </div>
          <InlineUpload
            module="essays"
            label="上传随笔"
            hint="文件名建议 YYYY-MM-DD-slug.md，front matter 里包含 title、date、slug。"
            onUploaded={loadItems}
          />
        </div>
      </section>

      <section className="post-list-container">
        {items.map((item) => (
          <article className="card-base post-card" key={item.slug}>
            <div className="post-card-body">
              <Link className="post-title" href={`/essays/${item.slug}`}>{item.title}</Link>
              <div className="post-meta">
                <span>随笔</span>
                <span>{item.date}</span>
              </div>
              <p className="post-excerpt">{item.summary || "一段被认真放好的想法。"}</p>
              <div className="chip-list">
                {item.tags.map((tag) => <span className="tag" key={tag}># {tag}</span>)}
              </div>
            </div>
            <Link href={`/essays/${item.slug}`} className="post-cover" aria-label={item.title || item.date} />
            <Link href={`/essays/${item.slug}`} className="post-enter" aria-label={item.title || item.date}>›</Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
