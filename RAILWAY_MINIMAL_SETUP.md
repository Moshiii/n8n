# Railway 最小化部署指南

如果您只想部署 n8n 而不需要整个源码仓库，可以创建一个最小化的仓库。

## 最小化仓库结构

只需要以下文件：

```
railway-n8n/
├── Dockerfile.railway
├── railway.json
└── README.md (可选)
```

## 文件内容

### Dockerfile.railway
```dockerfile
# Simple wrapper to use official n8n image with Railway PORT support
FROM docker.n8n.io/n8nio/n8n:latest

# Create a wrapper script to map Railway's PORT to N8N_PORT
RUN echo '#!/bin/sh\n\
if [ -n "$PORT" ] && [ -z "$N8N_PORT" ]; then\n\
  export N8N_PORT="$PORT"\n\
fi\n\
exec tini -- /docker-entrypoint.sh "$@"' > /railway-entrypoint.sh && \
    chmod +x /railway-entrypoint.sh

ENTRYPOINT ["/railway-entrypoint.sh"]
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.railway"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 部署步骤

1. 创建新仓库（GitHub/GitLab）
2. 只添加上述两个文件
3. 在 Railway 中连接这个仓库
4. 配置环境变量和持久化卷
5. 部署完成！

## 或者：完全不需要仓库

如果您不想创建任何仓库，可以在 Railway Dashboard 中：

### 步骤 1: 创建服务

1. **新建服务** → **Deploy from Docker Hub**
2. **镜像名称**: `docker.n8n.io/n8nio/n8n:latest`

### 步骤 2: 配置环境变量

在服务的 "Variables" 标签页中添加：

**必需的环境变量：**
- `N8N_PORT=$PORT` (Railway 会自动替换 `$PORT` 为实际端口)
- `N8N_ENCRYPTION_KEY=your-encryption-key-here`
  ```bash
  # 生成加密密钥（32字符）
  openssl rand -hex 16
  ```

**可选但推荐的环境变量：**
- `N8N_HOST=${{RAILWAY_PUBLIC_DOMAIN}}` (Railway 会自动替换)
- `N8N_PROTOCOL=https`
- `GENERIC_TIMEZONE=Asia/Shanghai` (根据您的时区调整)
- `TZ=Asia/Shanghai`

**生产环境推荐：**
- `N8N_BASIC_AUTH_ACTIVE=true`
- `N8N_BASIC_AUTH_USER=your-username`
- `N8N_BASIC_AUTH_PASSWORD=your-password`

### 步骤 3: 配置持久化卷（⚠️ 非常重要！）

**为什么需要持久化卷？**

n8n 的所有重要数据都存储在 `/home/node/.n8n` 目录：
- 工作流（Workflows）
- 凭证（API keys、密码等）
- 加密密钥（如果丢失，所有凭证将无法解密！）
- SQLite 数据库（如果未使用 PostgreSQL）
- 配置文件
- 二进制数据

**配置步骤：**

1. 在服务页面，点击 **"Settings"** 标签页
2. 找到 **"Volumes"** 部分
3. 点击 **"Add Volume"** 按钮
4. 配置卷：
   - **Mount Path**: `/home/node/.n8n`
   - **Size**: 
     - 最小：`1 GB`（测试/开发）
     - 推荐：`5 GB`（生产环境）
     - 如果工作流很多或使用二进制数据：`10 GB+`
5. 点击 **"Add"** 保存

**⚠️ 重要提示：**
- 如果不配置持久化卷，所有数据会在容器重启/更新时丢失
- 即使使用 PostgreSQL 数据库，也需要挂载 `/home/node/.n8n` 卷（包含加密密钥）

### 步骤 4: 配置数据库（可选但推荐用于生产）

如果需要使用 PostgreSQL：

1. 在 Railway 项目中，点击 **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway 会自动创建 PostgreSQL 服务
3. 回到 n8n 服务，在环境变量中添加：
   - `DB_TYPE=postgresdb`
   - `DB_POSTGRESDB_HOST=${{Postgres.PGHOST}}`
   - `DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}`
   - `DB_POSTGRESDB_USER=${{Postgres.PGUSER}}`
   - `DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}`
   - `DB_POSTGRESDB_PORT=${{Postgres.PGPORT}}`

**注意**：即使使用 PostgreSQL，仍然需要 `/home/node/.n8n` 持久化卷！

### 步骤 5: 部署

1. 检查所有配置是否正确
2. Railway 会自动开始部署
3. 等待部署完成（通常几分钟）
4. 访问 Railway 提供的公共 URL

### 步骤 6: 访问您的 n8n 实例

部署完成后：
- Railway 会提供一个公共 URL，格式类似：`https://your-app-name.up.railway.app`
- 首次访问会要求您创建管理员账户
- 如果设置了 `N8N_BASIC_AUTH_ACTIVE=true`，需要先通过基本认证

### 配置检查清单

部署前请确认：
- ✅ 已设置 `N8N_ENCRYPTION_KEY`
- ✅ 已设置 `N8N_PORT=$PORT`
- ✅ 已配置持久化卷 `/home/node/.n8n`（至少 1GB）
- ✅ 已设置时区（可选但推荐）
- ✅ 已配置基本认证（生产环境推荐）
- ✅ 已配置 PostgreSQL（生产环境推荐）

这样完全不需要任何代码仓库！
