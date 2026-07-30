# 部署说明

PriceAI 当前推荐部署为一套自托管服务：

- Next.js 前端
- Fastify 后端
- PostgreSQL 数据库
- Nginx 或宝塔反向代理到你的域名

## 本地验证

```bash
npm install
npm run selfhost:up
npm run dev
```

确认：

```bash
curl http://localhost:4100/health
curl http://localhost:3000/api/health
```

## 生产变量

前端至少需要：

- `SELF_HOSTED_API_BASE_URL`
- `PRICEAI_FORWARD_SECRET`
- `ADMIN_SESSION_SECRET`

后端至少需要：

- `DATABASE_URL`
- `APP_SECRET`
- `PRICEAI_FORWARD_SECRET`
- `ADMIN_PASSWORD_HASH_B64`
- `CORS_ORIGINS`

`PRICEAI_FORWARD_SECRET` 前后端必须一致。

## Docker Compose

本仓库提供 `docker-compose.selfhost.yml`，本地可直接启动：

```bash
docker compose -f docker-compose.selfhost.yml up -d --build
```

停止：

```bash
docker compose -f docker-compose.selfhost.yml down
```

查看后端日志：

```bash
npm run selfhost:logs
```

## 管理后台

后台入口固定为：

```text
/admin
```

后台通过 Next.js 代理访问 `/api/selfhost/admin/*`，再转发到自托管 Fastify 后端。
