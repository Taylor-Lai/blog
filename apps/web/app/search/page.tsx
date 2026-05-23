"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch, ContentItem } from "@/lib/api";

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      setItems(await apiFetch<ContentItem[]>(`/api/search?q=${encodeURIComponent(q)}`));
    } catch (err) {
      if (err instanceof Error && err.message.includes("authenticated")) {
        router.push("/login");
      } else {
        setError(err instanceof Error ? err.message : "搜索失败");
      }
    }
  }

  return (
    <AppShell compact title="搜索">
      <section className="card-base section-panel search-panel">
        <div className="hero-kicker">SEARCH</div>
        <h1 className="page-title">找回某个片刻</h1>
        <p className="muted">搜索标题、摘要和正文，至少输入两个字符。</p>
        <form className="form" onSubmit={submit}>
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="输入至少两个字符" />
          <button className="button" type="submit">搜索</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="post-list-container">
        {items.map((item) => (
          <article className="card-base post-card" key={`${item.module}-${item.slug}`}>
            <div className="post-card-body">
              <Link className="post-title" href={item.module === "diary" ? `/diary/${item.slug}` : `/essays/${item.slug}`}>
                {item.title || item.date}
              </Link>
              <div className="post-meta">
                <span>{item.module === "diary" ? "日记" : "随笔"}</span>
                <span>{item.date}</span>
              </div>
              {item.summary ? <p className="post-excerpt">{item.summary}</p> : null}
            </div>
            <Link className="post-enter" href={item.module === "diary" ? `/diary/${item.slug}` : `/essays/${item.slug}`}>›</Link>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
