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

### 3. Add a Database (Recommended for Production)

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

## Notes

- Deployments are fast since we're using the official pre-built Docker image
- The wrapper only adds PORT mapping, so it builds in seconds
- For production, consider using Railway's persistent volumes for data storage
- Monitor resource usage in the Railway dashboard
