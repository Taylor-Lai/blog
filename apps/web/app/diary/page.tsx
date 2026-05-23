"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { InlineUpload } from "@/components/InlineUpload";
import { apiFetch, ContentItem } from "@/lib/api";

export default function DiaryPage() {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);

  function loadItems() {
    apiFetch<ContentItem[]>("/api/diary")
      .then(setItems)
      .catch(() => router.push("/login"));
  }

  useEffect(() => {
    loadItems();
  }, [router]);

  return (
    <AppShell compact title="日记">
      <section className="card-base section-panel">
        <div className="section-header">
          <div>
            <div className="hero-kicker">DIARY</div>
            <h1 className="page-title">日记</h1>
            <p className="muted">没有标题，只用日期记录当天。</p>
          </div>
          <InlineUpload
            module="diary"
            label="上传日记"
            hint="文件名使用 YYYY-MM-DD.md，内容会按年份和月份归档。"
            onUploaded={loadItems}
          />
        </div>
      </section>

      <section className="post-list-container">
        {items.map((item) => (
          <article className="card-base post-card" key={item.slug}>
            <div className="post-card-body">
              <h2 className="post-title">{item.date}</h2>
              <div className="post-meta">
                <span>日记</span>
                <span>{item.path}</span>
              </div>
              <p className="post-excerpt">{item.summary || "打开这一日。"}</p>
              <div className="chip-list">
                {item.tags.map((tag) => <span className="tag" key={tag}># {tag}</span>)}
              </div>
            </div>
            <Link href={`/diary/${item.slug}`} className="post-enter" aria-label={item.date}>›</Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
