---
description: How to setup PVR auto-downloading via Linux Cron
---

To enable automatic checks for new episodes of your subscribed anime, you need to set up a Linux cron job on your VPS.

### 1. Open Crontab Editor

Run the following command on your VPS:

```bash
crontab -e
```

### 2. Add the PVR Job

Paste the following line at the end of the file. This will run the PVR check every 30 minutes:

```bash
*/30 * * * * curl -X POST http://localhost:3000/api/pvr/run >> ~/pvr-cron.log 2>&1
```

> [!TIP]
>
> - `*/30` means every 30 minutes. You can change it to `0 * * * *` for every hour.
> - The portion `>> ~/pvr-cron.log 2>&1` saves the output to a log file so you can check if it's working.

### 3. Verify

You can check if the cron is running by looking at the log file:

```bash
tail -f ~/pvr-cron.log
```

If you prefer to trigger it manually once to test:

```bash
curl -X POST http://localhost:3000/api/pvr/run
```
