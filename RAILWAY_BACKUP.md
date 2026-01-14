# Railway 数据备份指南 / Railway Data Backup Guide

本指南说明如何从 Railway 上下载 n8n 的持久化数据到本地。

This guide explains how to download/backup n8n persistent data from Railway to your local machine.

## 方法 1: 使用 Railway CLI（推荐 - 完整备份）

### 步骤：

1. **安装 Railway CLI**:
   ```bash
   npm install -g @railway/cli
   # 或使用 Homebrew (macOS)
   brew install railway
   ```

2. **登录 Railway**:
   ```bash
   railway login
   ```

3. **连接到您的项目**:
   ```bash
   railway link
   # 选择您的项目和服务
   ```

4. **直接打包并下载数据**:
   ```bash
   # 打包整个 .n8n 目录并下载到本地
   railway run sh -c "cd /home/node && tar -czf - .n8n" > n8n-backup-$(date +%Y%m%d).tar.gz
   ```

   这会将整个 `/home/node/.n8n` 目录打包并保存到当前目录。

## 方法 2: 使用 n8n 内置导出功能（推荐用于迁移）

n8n 提供了内置的数据导出命令，可以导出工作流、凭证等：

### 导出工作流 (Export Workflows)

```bash
railway run n8n export:workflow --all --output=/tmp/workflows.json
railway run cat /tmp/workflows.json > workflows-backup.json
```

### 导出凭证 (Export Credentials)

```bash
railway run n8n export:credentials --all --output=/tmp/credentials.json
railway run cat /tmp/credentials.json > credentials-backup.json
```

### 导出所有实体（包括执行历史）(Export All Entities)

```bash
railway run n8n export:entities --outputDir=/tmp/export --includeExecutionHistoryDataTables=true
railway run sh -c "cd /tmp && tar -czf export.tar.gz export/"
railway run cat /tmp/export.tar.gz > n8n-export-backup.tar.gz
```

## 方法 3: 进入容器手动操作

如果需要更精细的控制：

```bash
# 进入容器
railway run bash

# 在容器内打包
cd /home/node
tar -czf /tmp/n8n-backup.tar.gz .n8n/
exit

# 下载打包文件
railway run cat /tmp/n8n-backup.tar.gz > n8n-backup.tar.gz
```

## 恢复数据到本地

如果您想在本地恢复数据：

1. **解压备份文件**:
   ```bash
   mkdir -p ~/.n8n-backup
   tar -xzf n8n-backup.tar.gz -C ~/.n8n-backup
   ```

2. **启动本地 n8n 并挂载数据**:
   ```bash
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n-backup/.n8n:/home/node/.n8n \
     -e N8N_ENCRYPTION_KEY="your-encryption-key" \
     docker.n8n.io/n8nio/n8n
   ```

   **重要**: 确保使用相同的 `N8N_ENCRYPTION_KEY`，否则无法解密凭证！

## 定期备份脚本

创建一个备份脚本 `backup-n8n.sh`:

```bash
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="n8n-backup-${BACKUP_DATE}.tar.gz"

echo "Starting backup..."
railway run sh -c "cd /home/node && tar -czf - .n8n" > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ]; then
    echo "✅ Backup completed: ${BACKUP_FILE}"
    echo "File size: $(du -h ${BACKUP_FILE} | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi
```

使用方法：
```bash
chmod +x backup-n8n.sh
./backup-n8n.sh
```

## 定期备份建议

建议设置定期自动备份：

1. **使用 n8n 的定时工作流** - 创建一个工作流定期导出数据到云存储
2. **使用 Railway 的 Cron Jobs** - 设置定时任务执行备份脚本
3. **使用外部备份服务** - 将数据同步到云存储（如 S3、Google Drive、Dropbox）

## 注意事项

- 备份文件可能很大，确保有足够的磁盘空间
- 定期备份，建议至少每周一次
- 备份后验证文件完整性
- 将备份文件存储在安全的地方
- 如果使用加密，确保备份加密密钥
