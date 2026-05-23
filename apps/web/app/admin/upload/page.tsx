"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [module, setModule] = useState("diary");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!file) {
      setError("请选择 Markdown 文件");
      return;
    }

    const body = new FormData();
    body.append("module", module);
    body.append("file", file);

    try {
      const result = await apiFetch<{ path: string; commit: string | null }>("/api/admin/upload", {
        method: "POST",
        body
      });
      setMessage(result.commit ? `上传成功，commit: ${result.commit}` : `上传成功：${result.path}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes("authenticated")) {
        router.push("/login");
      } else {
        setError(err instanceof Error ? err.message : "上传失败");
      }
    }
  }

  return (
    <AppShell>
      <div className="hero-kicker">UPLOAD</div>
      <h1 className="page-title">上传 Markdown</h1>
      <p className="muted">上传后会按日期自动放入年份和月份目录；若文件名或 slug 冲突，会直接拒绝。</p>
      <form className="form" onSubmit={submit}>
        <select value={module} onChange={(event) => setModule(event.target.value)}>
          <option value="diary">日记</option>
          <option value="essays">随笔</option>
        </select>
        <input accept=".md" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        {message ? <p>{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <button className="button" type="submit">上传</button>
      </form>
    </AppShell>
  );
}
