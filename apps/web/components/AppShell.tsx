"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">J</span>
          <span>卡的日记</span>
        </Link>
        <nav className="nav">
          <Link href="/">首页</Link>
          <Link href="/diary">日记</Link>
          <Link href="/essays">随笔</Link>
          <Link href="/search">搜索</Link>
        </nav>
        <div className="nav-actions">
          <button className="pill secondary" onClick={logout}>退出</button>
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
