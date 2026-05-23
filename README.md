# 私人模块化博客

这是一个给个人使用的私密博客系统，用来记录日记和随笔。

## 技术栈

- 前端：Next.js + TypeScript
- 后端：FastAPI
- 数据库：PostgreSQL
- 内容：Markdown 文件
- 部署：Docker Compose + Nginx

## 内容目录

文章正文不存进数据库，而是按模块、年份、月份保存为 Markdown 文件：

```text
content/
  diary/
    2026/
      05/
        2026-05-23.md
  essays/
    2026/
      05/
        2026-05-23-first-note.md
```

## 日记格式

日记没有标题，一天最多一篇。文件名必须是 `YYYY-MM-DD.md`。

示例：

```md
---
date: "2026-05-23"
tags: ["生活"]
---

今天开始搭建自己的私人博客。
```

访问路径：

```text
/diary/2026-05-23
```

## 随笔格式

随笔需要日期、标题和 slug。文件名建议是 `YYYY-MM-DD-slug.md`。

示例：

```md
---
title: "第一篇随笔"
date: "2026-05-23"
tags: ["随笔", "开始"]
summary: "给这个私人博客留下一篇样例随笔。"
slug: "first-note"
---

这里是随笔正文。以后可以在这里写更长的想法、项目记录或者生活观察。
```

访问路径：

```text
/essays/first-note
```

## 本地启动

复制环境变量文件：

```powershell
Copy-Item .env.example .env
```

启动完整服务：

```powershell
docker compose up --build
```

打开：

```text
http://localhost:3000
```

API 健康检查：

```text
http://localhost:8000/api/healthz
```

默认演示账号：

```text
用户名：admin
密码：admin123
```

正式部署前请务必修改 `.env` 里的密码和 `BLOG_SECRET_KEY`。

## 上传文章

支持两种方式：

1. 本地写 Markdown，然后通过 Git 推送到服务器。
2. 登录网站，在上传页上传 Markdown 文件。

网页上传成功后，后端会把文件放入对应的年份和月份目录。如果开启了 Git 自动推送，还会自动执行 `git add`、`git commit`、`git push`。

## 部署说明

云服务器上推荐使用 Docker Compose 启动服务，再用 Nginx 做反向代理。项目里提供了一个基础配置：

```text
nginx/default.conf
```

如果要开启网页上传后的自动 Git 推送，需要在 `.env` 中配置：

```text
GIT_AUTO_PUSH=true
GIT_REMOTE=origin
GIT_BRANCH=main
GIT_AUTHOR_NAME=Blog Bot
GIT_AUTHOR_EMAIL=blog@example.com
```

服务器还需要配置可以推送到远程仓库的 Git 凭据。

在 Docker 中，项目会挂载到 `/repo`，内容目录是 `/repo/content`。初始化 Git 仓库后，网页上传的 Markdown 文件就能被 Git 正常追踪。
