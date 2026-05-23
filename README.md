# 卡的日记

一个私人模块化博客，用来记录日记和随笔。前端采用 Next.js，后端采用 FastAPI，文章正文以 Markdown 文件保存，数据库只负责索引、搜索和账号相关数据。

## 技术栈

- 前端：Next.js + TypeScript
- 后端：FastAPI
- 数据库：PostgreSQL
- 内容：Markdown 文件
- 部署：Docker Compose + Nginx
- 版本同步：Git 自动提交和推送

## 本地运行

在项目根目录运行：

```powershell
docker compose up -d
```

打开：

```text
http://localhost:3000
```

其他入口：

```text
Nginx: http://localhost:8080
API:   http://localhost:8000
Docs:  http://localhost:8000/docs
```

默认账号：

```text
用户名：admin
密码：admin123
```

如果只改了前端，重新构建并启动：

```powershell
docker compose build web
docker compose up -d web nginx
```

## 内容目录

文章正文不入库，而是按模块、年份、月份保存为 Markdown：

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

日记没有标题，只需要日期。文件名使用 `YYYY-MM-DD.md`。

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

随笔需要日期、标题和 slug。文件名建议使用 `YYYY-MM-DD-slug.md`。

```md
---
title: "第一篇随笔"
date: "2026-05-23"
tags: ["随笔", "开始"]
summary: "给这个私人博客留下一篇样例随笔。"
slug: "first-note"
---

这里是随笔正文。
```

访问路径：

```text
/essays/first-note
```

## 上传文章

登录网站后，在「日记」和「随笔」页面内上传 Markdown 文件。没有单独的上传模块。

上传成功后，后端会：

- 校验 Markdown 文件名和 front matter
- 按年份和月份放入 `content/` 对应目录
- 重建文章索引
- 如果启用了 Git 自动推送，自动执行 `git add`、`git commit`、`git push`

也可以直接在本地编辑 `content/` 下的 Markdown 文件，再通过 Git 推送。

## Git 自动推送

`.env` 中可配置：

```text
GIT_AUTO_PUSH=true
GIT_REMOTE=origin
GIT_BRANCH=main
GIT_AUTHOR_NAME=Ka Blog
GIT_AUTHOR_EMAIL=blog@example.com
SSH_DIR=C:\Users\33795\.ssh
```

Docker 会把 SSH 目录挂载到 API 容器内，后端上传文章后可以直接推送到远程仓库。

## 前端风格

当前前端参考 Mizuki 的布局语言实现：

- 大幅日系动画风格 banner
- 半透明导航栏
- 左右侧边栏卡片
- 中间文章列表卡片
- 日夜模式切换
- 首页 banner 多图淡入淡出轮播

首页卡片右侧只保留进入箭头，不展示缩略图。

## 部署

云服务器上推荐继续使用 Docker Compose 启动服务，再用 Nginx 做反向代理。项目内已有基础配置：

```text
nginx/default.conf
docker-compose.yml
```

正式部署前请修改 `.env` 中的默认密码和 `BLOG_SECRET_KEY`。
