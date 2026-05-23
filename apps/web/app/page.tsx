"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch, ContentItem } from "@/lib/api";

type Module = {
  key: string;
  name: string;
  description: string;
};

export default function HomePage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);
  const [latest, setLatest] = useState<ContentItem[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<Module[]>("/api/modules"),
      apiFetch<ContentItem[]>("/api/diary").catch(() => []),
      apiFetch<ContentItem[]>("/api/essays").catch(() => [])
    ])
      .then(([moduleList, diary, essays]) => {
        setModules(moduleList);
        setLatest([...diary.slice(0, 2), ...essays.slice(0, 2)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4));
      })
      .catch(() => router.push("/login"));
  }, [router]);

  return (
    <AppShell>
      <section className="card-base section-panel">
        <div className="hero-kicker">PRIVATE JOURNAL</div>
        <h1 className="page-title">卡的日记</h1>
        <p className="muted">日记只按日期安放，随笔保留标题和更完整的想法。</p>
      </section>

      <section className="post-list-container">
        {modules.map((module) => (
          <article className="card-base post-card" key={module.key}>
            <div className="post-card-body">
              <h2 className="post-title">{module.name}</h2>
              <div className="post-meta">
                <span>Private</span>
                <span>{module.key === "diary" ? "按日期归档" : "标题与日期"}</span>
              </div>
              <p className="post-excerpt">{module.description}</p>
              <div className="chip-list">
                <span className="chip">Markdown</span>
                <span className="chip">Git 同步</span>
              </div>
            </div>
            <Link href={`/${module.key}`} className="post-enter" aria-label={`进入${module.name}`}>›</Link>
          </article>
        ))}
      </section>

      {latest.length > 0 ? (
        <section className="card-base section-panel">
          <h2 className="panel-title">最近</h2>
          <div className="post-list-container">
            {latest.map((item) => (
              <Link className="chip" href={item.module === "diary" ? `/diary/${item.slug}` : `/essays/${item.slug}`} key={`${item.module}-${item.slug}`}>
                {item.module === "diary" ? item.date : `${item.date} · ${item.title}`}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
