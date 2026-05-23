"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    }
  }

  return (
    <main className="login-shell">
      <section className="card-base login-panel">
        <div className="brand">
          <span className="brand-mark">K</span>
          <span>卡的日记</span>
        </div>
        <h1 className="page-title">欢迎回来</h1>
        <p className="muted">进入你的私人写作空间。</p>
        <form className="form" onSubmit={submit}>
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="用户名" />
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码" type="password" />
          {error ? <div className="error">{error}</div> : null}
          <button className="button" type="submit">登录</button>
        </form>
      </section>
    </main>
  );
}
