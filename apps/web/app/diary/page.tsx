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
    <AppShell>
      <div className="section-head">
        <div>
          <div className="hero-kicker">DIARY</div>
          <h1 className="page-title">日记</h1>
          <p className="muted">一日一篇，只保留日期和当天的心绪。</p>
        </div>
        <InlineUpload
          module="diary"
          label="上传日记"
          hint="日记文件名必须是 YYYY-MM-DD.md，front matter 里的 date 要与文件名一致。"
          onUploaded={loadItems}
        />
      </div>
      <div className="list">
        {items.map((item) => (
          <Link className="list-item" href={`/diary/${item.slug}`} key={item.slug}>
            <strong>{item.date}</strong>
            <p className="muted">打开这一天</p>
            <div className="tags">
              {item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
