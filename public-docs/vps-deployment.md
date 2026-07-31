# VPS 部署说明

这一路线不使用 Cloudflare Workers、OpenNext、R2 或 Durable Object。生产结构是：

```text
Nginx / 宝塔反向代理
  -> Next.js web 容器 :3000
    -> Fastify api 容器 :4100
      -> PostgreSQL
```

## 服务器要求

- Docker 和 Docker Compose
- 反向代理到 `127.0.0.1:3000`
- 生产域名开启 HTTPS

如果不使用 Docker，本机 Node.js 必须是 `24.x`。

## 环境变量

复制 `.env.1panel.example` 为 `.env`，至少替换这些值：

```bash
POSTGRES_PASSWORD=replace-with-a-strong-db-password
APP_SECRET=replace-with-a-long-random-secret-at-least-32-chars
PRICEAI_FORWARD_SECRET=replace-with-a-long-random-forward-secret
ADMIN_PASSWORD=replace-with-a-strong-admin-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-session-secret
CRON_SECRET=replace-with-a-long-random-cron-secret
API_TRANSIT_CREDENTIAL_ENCRYPTION_KEY=replace-with-at-least-32-chars
CORS_ORIGINS=https://your-domain.example
```

生成后端后台密码哈希：

```bash
cd server
node scripts/hash-password.mjs "your-admin-password"
```

把输出的 `ADMIN_PASSWORD_HASH_B64` 写入根目录 `.env`。

图片、Logo、赞助图等对象文件默认存到 Docker volume `priceai-web-storage`。非 Docker 部署时可设置：

```bash
PRICEAI_STORAGE_DIR=/var/lib/priceai/storage
```

## 启动

```bash
npm run vps:up
```

检查健康状态：

```bash
curl http://127.0.0.1:3000/api/health
```

如果返回 `ok: true`，再把 Nginx / 宝塔反向代理到：

```text
http://127.0.0.1:3000
```

## 常用命令

```bash
npm run vps:logs
npm run vps:down
npm run vps:up
```

更新代码后重新构建：

```bash
git pull
npm run vps:up
```
