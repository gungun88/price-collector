# 配置说明

PriceAI 当前采用自托管后端：Next.js 前端连接你自己的 Fastify + PostgreSQL 服务。公开页面不需要用户注册登录，只有后台管理需要管理员密码。

## 本地启动

```bash
npm install
npm run selfhost:up
npm run dev
```

默认访问：

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin
- 后端健康检查：http://localhost:4100/health

## 前端环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

常用变量：

| 变量 | 用途 |
| --- | --- |
| `SELF_HOSTED_API_BASE_URL` | 自托管 Fastify 后端地址，本地默认 `http://localhost:4100` |
| `PRICEAI_FORWARD_SECRET` | 前端转发提交线索到后端时使用的共享密钥 |
| `ADMIN_PASSWORD` | Next.js 旧管理兼容接口的本地管理员密码 |
| `ADMIN_SESSION_SECRET` | 后台会话签名密钥，生产环境必须设置 |
| `ADMIN_SESSION_VERSION` | 后台会话版本，用于强制旧会话失效 |
| `CRON_SECRET` | 定时任务接口鉴权 |
| `NEXT_PUBLIC_TRANSIT_DETECTOR_API_BASE_URL` | 可选，模型检测服务地址 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 可选，Google Analytics 4 Measurement ID |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | 可选，Umami Website ID |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | 可选，Umami 统计脚本地址 |

## 自托管后端

后端配置在 `server/.env.example` 和 `docker-compose.selfhost.yml` 中。生产部署前至少要替换：

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `APP_SECRET`
- `PRICEAI_FORWARD_SECRET`
- `ADMIN_PASSWORD_HASH_B64`
- `CORS_ORIGINS`

生成后台密码哈希：

```bash
cd server
node scripts/hash-password.mjs "你的新后台密码"
```

## 数据库迁移

Docker Compose 启动后会运行 PostgreSQL。需要手动迁移时：

```bash
npm run selfhost:migrate
```

当前已经迁移到自托管 PostgreSQL 的核心功能：

- 中转 API 站点
- 中转 API 报价
- 中转 API 提交线索
- `/admin` 后台管理入口
