# Railway Deployment Guide for n8n

This guide explains how to deploy n8n on Railway.

## Overview

The repository has been configured for Railway deployment with:
- `Dockerfile.railway` - Simple wrapper around the official n8n Docker image that maps Railway's `PORT` to `N8N_PORT`
- `railway.json` - Railway configuration file

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Railway CLI installed (optional, for local testing)

## Deployment Steps

### 1. Connect Your Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository

### 2. Configure Environment Variables

Railway will automatically set the `PORT` environment variable. The entrypoint script will map it to `N8N_PORT`.

**Required Environment Variables:**

- `N8N_ENCRYPTION_KEY` - **REQUIRED** - A random 32-character string used for encrypting credentials
  ```bash
  # Generate with: openssl rand -hex 16
  ```

**Optional but Recommended:**

- `N8N_HOST` - The hostname where n8n can be reached (Railway will provide this)
- `N8N_PROTOCOL` - Set to `https` if using Railway's HTTPS
- `DB_TYPE` - Database type (`sqlite`, `postgresdb`, `mysqldb`, `mariadb`)
- `DB_POSTGRESDB_HOST` - PostgreSQL host (if using Railway PostgreSQL service)
- `DB_POSTGRESDB_DATABASE` - PostgreSQL database name
- `DB_POSTGRESDB_USER` - PostgreSQL username
- `DB_POSTGRESDB_PASSWORD` - PostgreSQL password
- `DB_POSTGRESDB_PORT` - PostgreSQL port

**For Production:**

- `N8N_BASIC_AUTH_ACTIVE` - Set to `true` to enable basic auth
- `N8N_BASIC_AUTH_USER` - Basic auth username
- `N8N_BASIC_AUTH_PASSWORD` - Basic auth password
- `N8N_USER_MANAGEMENT_DISABLED` - Set to `false` to enable user management

### 3. Configure Data Persistence (CRITICAL!)

**⚠️ IMPORTANT: Data Persistence is Essential**

n8n stores all your important data in `/home/node/.n8n` directory, including:
- **Workflows** (工作流)
- **Credentials** (API keys, passwords, etc.)
- **Encryption Key** (加密密钥 - 如果丢失，所有凭证将无法解密！)
- **Database** (SQLite database if not using PostgreSQL)
- **Configuration files** (配置文件)
- **Binary data** (二进制数据，默认存储在 `/home/node/.n8n/binaryData`)

**Without persistent storage, all your data will be lost when:**
- Docker container is updated/redeployed
- Railway service is restarted
- Container crashes

**Railway Persistent Volumes:**

1. In Railway dashboard, go to your n8n service
2. Click on "Settings" → "Volumes"
3. Click "Add Volume"
4. Configure the volume:
   - **Mount Path**: `/home/node/.n8n`
   - **Size**: At least 1GB (recommended: 5GB+ for production)
5. Click "Add"

This ensures your data persists across deployments and updates.

**Alternative: Use PostgreSQL for Database**

Even with PostgreSQL, you still need to persist `/home/node/.n8n` because it contains:
- Encryption key (required to decrypt credentials)
- Configuration files
- Binary data (if using filesystem mode)

For production deployments, it's recommended to use PostgreSQL:

1. In Railway dashboard, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL service
3. Reference the database connection variables in your n8n service:
   - `DB_TYPE=postgresdb`
   - `DB_POSTGRESDB_HOST=${{Postgres.PGHOST}}`
   - `DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}`
   - `DB_POSTGRESDB_USER=${{Postgres.PGUSER}}`
   - `DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}`
   - `DB_POSTGRESDB_PORT=${{Postgres.PGPORT}}`

**Note:** Even with PostgreSQL, you still need the `/home/node/.n8n` volume mounted!

### 4. Deploy

Railway will automatically:
1. Detect the `Dockerfile.railway` file
2. Pull the official n8n Docker image and apply the PORT mapping wrapper (fast!)
3. Deploy the service
4. Assign a public URL

### 5. Access Your Deployment

Once deployed, Railway will provide a public URL. Access n8n at:
```
https://your-app-name.up.railway.app
```

## Configuration Details

### Port Configuration

Railway provides a `PORT` environment variable dynamically. The `docker-entrypoint.sh` script automatically maps this to `N8N_PORT` if `N8N_PORT` is not explicitly set:

```bash
if [ -n "$PORT" ] && [ -z "$N8N_PORT" ]; then
  export N8N_PORT="$PORT"
fi
```

### Build Process

The `Dockerfile.railway` is a simple wrapper that:
1. Uses the official `docker.n8n.io/n8nio/n8n:latest` image
2. Adds a small entrypoint script that maps Railway's `PORT` environment variable to `N8N_PORT`
3. This ensures n8n listens on the port Railway assigns

### Resource Requirements

- **Minimum**: 512MB RAM, 1 vCPU
- **Recommended**: 1GB+ RAM, 2 vCPUs for production workloads
- **Disk**: At least 1GB for the application and data

## Troubleshooting

### Build Fails

- Ensure you have sufficient build resources allocated
- Check Railway logs for specific error messages
- The build process requires significant memory (~2GB+ recommended)

### Port Issues

- Railway automatically handles port configuration
- If you see port binding errors, check that `PORT` environment variable is set (Railway sets this automatically)

### Database Connection Issues

- Verify database environment variables are correctly referenced
- Check that the PostgreSQL service is running
- Ensure database credentials are correct

### Application Won't Start

- Check the logs in Railway dashboard
- Verify `N8N_ENCRYPTION_KEY` is set
- Ensure all required environment variables are configured

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [n8n Documentation](https://docs.n8n.io)
- [n8n Environment Variables](https://docs.n8n.io/hosting/configuration/environment-variables/)

## Data Persistence (数据持久化)

### Why Data Persistence is Critical

n8n stores critical data in `/home/node/.n8n`:
- **Workflows** - All your automation workflows
- **Credentials** - API keys, passwords, tokens (encrypted)
- **Encryption Key** - Used to encrypt/decrypt credentials
- **Database** - SQLite database (if not using PostgreSQL)
- **Binary Data** - Files uploaded/processed by workflows (stored in `/home/node/.n8n/binaryData`)

### What Happens Without Persistence?

If you don't mount a persistent volume:
- ❌ All workflows will be lost on container restart/update
- ❌ All API keys and credentials will be lost
- ❌ Encryption key will be regenerated, making old credentials unrecoverable
- ❌ All execution history will be lost
- ❌ Binary files will be lost

### Railway Volume Configuration

**Required Volume Mount:**
```
Mount Path: /home/node/.n8n
Size: Minimum 1GB (5GB+ recommended for production)
```

**Optional: Custom Binary Data Path**

If you want to store binary data separately, you can:
1. Set environment variable: `N8N_BINARY_DATA_STORAGE_PATH=/home/node/n8ndata`
2. Mount an additional volume at `/home/node/n8ndata`

However, the main `/home/node/.n8n` volume is still required for other data.

### Reference: Docker Volume Mounts

If deploying with Docker directly (not Railway), you would use:
```bash
docker volume create n8n_data
docker run -v n8n_data:/home/node/.n8n ...
```

On Railway, this is handled automatically when you add a volume in the dashboard.

## Notes

- Deployments are fast since we're using the official pre-built Docker image
- The wrapper only adds PORT mapping, so it builds in seconds
- **CRITICAL**: Always configure persistent volumes before deploying to production
- Monitor resource usage in the Railway dashboard
- Regularly backup your `/home/node/.n8n` volume