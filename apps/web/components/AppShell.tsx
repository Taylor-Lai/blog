"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  compact?: boolean;
};

const links = [
  { href: "/", label: "首页" },
  { href: "/diary", label: "日记" },
  { href: "/essays", label: "随笔" },
  { href: "/search", label: "搜索" }
];

export function AppShell({ children, title = "卡的日记", subtitle = "You are on your own kid. You always have been.", compact = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [today, setToday] = useState<{ day: number; label: string } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    const savedTheme = window.localStorage.getItem("blog-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
    const now = new Date();
    setToday({
      day: now.getDate(),
      label: now.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })
    });
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("blog-theme", next);
      return next;
    });
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
  }

  return (
    <div className={`mizuki-shell wallpaper-transparent enable-card-border theme-${theme} ${compact ? "is-compact" : ""}`}>
      <div className="top-gradient-highlight" />
      <header id="navbar" className={scrolled || compact ? "scrolled" : ""} data-transparent-mode="semifull">
        <div className="navbar-inner">
          <Link href="/" className="navbar-title" aria-label="回到首页">
            <span className="navbar-mark">K</span>
            <span>卡的日记</span>
          </Link>
          <nav className="navbar-links" aria-label="主导航">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link className={active ? "active" : ""} href={link.href} key={link.href}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="navbar-actions">
            <button className="icon-btn" aria-label={theme === "dark" ? "切换到白天模式" : "切换到黑夜模式"} type="button" onClick={toggleTheme}>
              {theme === "dark" ? "☀" : "◐"}
            </button>
            <button className="icon-btn" aria-label="退出登录" type="button" onClick={logout}>↗</button>
          </div>
        </div>
      </header>

      {!compact ? <Banner title={title} subtitle={subtitle} /> : null}

      <div className={`main-stage ${compact ? "no-banner-layout" : ""}`}>
        <div id="main-grid" className="main-grid" data-layout-mode="list">
          <aside id="sidebar" className="sidebar-column">
            <ProfileCard />
            <WidgetCard title="公告">
              <p>把日记留给今天，把随笔留给更长的想法。</p>
            </WidgetCard>
            <WidgetCard title="分类">
              <div className="chip-list">
                <Link className="chip" href="/diary">日记</Link>
                <Link className="chip" href="/essays">随笔</Link>
              </div>
            </WidgetCard>
          </aside>

          <main id="swup-container" className="content-column">
            <div id="content-wrapper" className="onload-animation">
              {children}
            </div>
          </main>

          <aside id="right-sidebar" className="right-sidebar-column">
            <WidgetCard title="今日">
              <div className="mini-calendar">
                <strong>{today?.day ?? "--"}</strong>
                <span>{today?.label ?? "加载中"}</span>
              </div>
            </WidgetCard>
            <WidgetCard title="标签">
              <div className="chip-list">
                <span className="chip">生活</span>
                <span className="chip">想法</span>
                <span className="chip">私人</span>
              </div>
            </WidgetCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Banner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section id="banner-wrapper" className="banner-wrapper">
      <div id="banner-carousel" className="banner-carousel">
        <img className="banner-image banner-image-a" src="/assets/banner/test.jpg" alt="" />
        <img className="banner-image banner-image-b" src="/assets/banner/desktop-2.webp" alt="" />
        <img className="banner-image banner-image-c" src="/assets/banner/desktop-3.webp" alt="" />
        <img className="banner-image banner-image-d" src="/assets/banner/desktop-4.webp" alt="" />
      </div>
      <div className="banner-text-overlay">
        <div>
          <h1 className="banner-title">{title}</h1>
          <h2 className="banner-subtitle">{subtitle}</h2>
        </div>
      </div>
      <div className="waves" id="header-waves">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 150 32" preserveAspectRatio="none">
          <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v48h-352z" />
          </defs>
          <g className="parallax">
            <use href="#gentle-wave" x="48" y="0" />
            <use href="#gentle-wave" x="48" y="3" />
            <use href="#gentle-wave" x="48" y="5" />
            <use href="#gentle-wave" x="48" y="7" />
          </g>
        </svg>
      </div>
    </section>
  );
}

function ProfileCard() {
  return (
    <section className="card-base profile-card">
      <Link href="/diary" className="profile-avatar" aria-label="查看日记">
        <img src="/assets/profile/avatar.webp" alt="" />
      </Link>
      <h2>Ka</h2>
      <div className="profile-rule" />
      <p>普通日常的收藏处</p>
      <div className="profile-actions">
        <Link className="btn-regular" href="/diary">日记</Link>
        <Link className="btn-regular" href="/essays">随笔</Link>
      </div>
    </section>
  );
}

function WidgetCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-base widget-card">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}
