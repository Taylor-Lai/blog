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
    <AppShell>
      <div className="hero-kicker">SEARCH</div>
      <h1 className="page-title">找回某个片刻</h1>
      <p className="muted">搜索标题、摘要和正文，至少输入两个字符。</p>
      <form className="form" onSubmit={submit}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="输入至少两个字符" />
        <button className="button" type="submit">搜索</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      <div className="list">
        {items.map((item) => (
          <Link className="list-item" href={item.module === "diary" ? `/diary/${item.slug}` : `/essays/${item.slug}`} key={`${item.module}-${item.slug}`}>
            <span className="muted">{item.module === "diary" ? "日记" : "随笔"} · {item.date}</span>
            <h2>{item.title || item.date}</h2>
            {item.summary ? <p>{item.summary}</p> : null}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
