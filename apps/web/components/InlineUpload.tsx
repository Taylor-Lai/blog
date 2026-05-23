"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type InlineUploadProps = {
  module: "diary" | "essays";
  label: string;
  hint: string;
  onUploaded?: () => void;
};

export function InlineUpload({ module, label, hint, onUploaded }: InlineUploadProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      setMessage(result.commit ? `上传成功，commit: ${result.commit}` : "上传成功，内容已刷新");
      setFile(null);
      onUploaded?.();
    } catch (err) {
      if (err instanceof Error && err.message.includes("authenticated")) {
        router.push("/login");
      } else {
        setError(err instanceof Error ? err.message : "上传失败");
      }
    }
  }

  return (
    <section className="upload-inline">
      <button className="pill" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "收起上传" : label}
      </button>
      {open ? (
        <form className="upload-panel" onSubmit={submit}>
          <p className="muted">{hint}</p>
          <input accept=".md" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {message ? <p>{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
          <button className="button" type="submit">确认上传</button>
        </form>
      ) : null}
    </section>
  );
}
