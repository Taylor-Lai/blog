"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

type Module = {
  key: string;
  name: string;
  description: string;
};

export default function HomePage() {
  const router = useRouter();
  const [modules, setModules] = useState<Module[]>([]);

  useEffect(() => {
    apiFetch<Module[]>("/api/modules")
      .then(setModules)
      .catch(() => router.push("/login"));
  }, [router]);

  return (
    <AppShell>
      <section className="headertop filter-dot">
        <figure id="centerbg" className="centerbg" />
        <div className="focusinfo">
          <div className="header-tou">
            <span>記</span>
          </div>
          <h1 className="center-text">卡的日记</h1>
          <div className="header-info">
            <p>You are on your own kid. You always have been.</p>
          </div>
          <div className="top-social">
            <Link href="/diary">Diary</Link>
            <Link href="/essays">Essays</Link>
            <Link href="/search">Search</Link>
          </div>
        </div>
        <div className="headertop-bar" />
        <div className="scroll-down">⌄</div>
      </section>

      <section className="blank">
        <div className="notice-card">
          <span>Announcement</span>
          <p>把日记留给今天，把随笔留给更长的想法。这里是卡的私人小窝。</p>
        </div>
        <div className="post-list">
          {modules.map((module, index) => (
            <Link className="post-list-thumb" href={`/${module.key}`} key={module.key}>
              <div className="post-thumb-image" data-index={index} />
              <article className="post-thumb-content">
                <div className="post-meta">Private · {String(index + 1).padStart(2, "0")}</div>
                <h2>{module.name}</h2>
                <p>{module.description}</p>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
