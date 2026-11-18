# Local Computer + Cloud Tunnel Deployment Guide
## Running the Database Learning Platform on a Local Computer / Homelab via Docker & Cloudflare Tunnel

This guide explains how to run the production Docker stack on your **local computer (Windows desktop/laptop or Linux workstation)** and securely expose it to students and instructors worldwide via a **Cloud Tunnel** — with **no public IP, no router port forwarding, and automatic SSL/TLS encryption**.

---

## 1. Architecture: How It Works

```mermaid
flowchart LR
    Students["Students & Instructors<br/>(Internet)"]
    Cloudflare["Cloudflare Global Edge<br/>- Free HTTPS / SSL termination<br/>- DDoS & Bot Mitigation<br/>- Hides your home IP"]
    
    subgraph LocalMachine["Your Local Computer / Docker Desktop"]
        Tunnel["cloudflared Container<br/>(Outbound encrypted tunnel)"]
        Web["Next.js Web Container<br/>(web:3000)"]
        AppDB[("PostgreSQL App DB<br/>(app_db)")]
        SandboxDB[("PostgreSQL Sandbox DB<br/>(sandbox_db)")]
    end

    Students -->|https://analytics.yourdomain.com| Cloudflare
    Tunnel <-.->|Outbound Encrypted QUIC/TLS Tunnel| Cloudflare
    Tunnel -->|http://web:3000| Web
    Web --> AppDB
    Web --> SandboxDB
```

### Why Cloudflare Tunnel for Local Hosting?
* **Zero Router Configuration**: You do **not** need to open port 80 or 443 on your home Wi-Fi router.
* **CGNAT Friendly**: Works even if your ISP uses Carrier-Grade NAT (CGNAT) where traditional port forwarding is impossible.
* **Security & IP Privacy**: Your home or office public IP address is never revealed to the internet.
* **Built-in Free SSL**: Cloudflare terminates HTTPS automatically at the edge with legitimate certificates trusted by all browsers.

---

## 2. Quickstart: 5-Step Setup

### Step 1: Create a Free Cloudflare Account & Add a Domain
1. Register a domain (e.g. at Namecheap, Cloudflare Registrar, etc.) or use an existing domain.
2. In your Cloudflare Dashboard, add your domain and ensure its nameservers point to Cloudflare.

### Step 2: Create a Cloudflare Tunnel
1. Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. In the left sidebar, navigate to **Networks** -> **Tunnels**.
3. Click **Add a tunnel** -> Select **Cloudflared** -> Click **Next**.
4. Name your tunnel (e.g., `db-platform-local`) and click **Save tunnel**.
5. Under **Install and run a connector**, look at the commands shown. Copy the **Tunnel Token** (the long string following `--token`, starting with `eyJhIj...`).

### Step 3: Configure the Public Hostname in Cloudflare
In the same tunnel setup screen under the **Public Hostnames** tab:
* **Subdomain**: e.g. `analytics` (or leave blank for root domain)
* **Domain**: `yourdomain.com` (select your domain from dropdown)
* **Path**: leave empty
* **Service Type**: `HTTP`
* **URL**: `web:3000` *(matches the Docker service name and internal port)*
* Click **Save hostname**.

### Step 4: Configure `.env.production`
Copy `.env.production.example` to `.env.production` and paste your tunnel token:
```env
# In .env.production
APP_DOMAIN=analytics.yourdomain.com
JWT_SECRET=replace_with_a_secure_random_64_char_hex_secret_key_in_production
POSTGRES_APP_PASSWORD=strong_app_db_pw_123
POSTGRES_SANDBOX_PASSWORD=strong_sandbox_db_pw_123
STUDENT_SANDBOX_PASSWORD=strong_student_sandbox_pw_123

# Paste your Cloudflare Tunnel Token here:
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
```

### Step 5: Launch the Tunnel Stack
Run the following Docker Compose command:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml --env-file .env.production up -d --build
```

> [!TIP]
> Notice that `docker-compose.tunnel.yml` automatically starts the `cloudflared` container and safely deactivates the local `caddy` service, because Cloudflare edge terminates HTTPS and routes traffic straight into `web:3000`.

Open your browser and navigate to `https://analytics.yourdomain.com` — your platform is live!

---

## 3. Crucial Local Computer & Host Optimization Checklist

Running a production service on a desktop or laptop requires specific OS and hardware settings to prevent downtime:

### 1. Prevent Computer Sleep & Hibernation (P0 Essential)
If your computer goes to sleep or hibernates, the tunnel and web server will disconnect immediately.

* **Windows 10 / 11**:
  - Open **Settings** -> **System** -> **Power & battery**.
  - Under **Screen and sleep**:
    - "When plugged in, turn off my screen after": Any value (e.g., 10 minutes is fine).
    - "When plugged in, put my device to sleep after": **Never**.
* **Laptop Lid Setting (If using a laptop)**:
  - Open **Control Panel** -> **Power Options**.
  - Click **Choose what closing the lid does**.
  - Under "When I close the lid" (Plugged in): Select **Do nothing**.
* **Tool Recommendation**: Install **Microsoft PowerToys** from the Microsoft Store and enable the **PowerToys Awake** utility (set to "Keep awake indefinitely").

### 2. Docker Desktop for Windows (WSL 2) Resource Tuning
By default, WSL 2 can consume up to 50% or more of your total host RAM, which can make your local computer sluggish.

To allocate fixed resources for Docker:
1. Open PowerShell and edit your global WSL config:
   ```powershell
   notepad "$env:USERPROFILE\.wslconfig"
   ```
2. Add the following configuration (adjust memory to 50% of your system RAM, e.g., 6GB or 8GB):
   ```ini
   [wsl2]
   memory=6GB
   processors=4
   swap=2GB
   ```
3. Restart WSL in PowerShell:
   ```powershell
   wsl --shutdown
   ```
4. In Docker Desktop Settings:
   - Check: **Start Docker Desktop when you sign in to your computer**.

### 3. Windows Update Automatic Reboots
Windows Update may attempt to restart your computer overnight:
- Open **Settings** -> **Windows Update** -> **Advanced options**.
- Set **Active hours** to cover your class and exam schedules (e.g. 7:00 AM to 11:00 PM).
- Note: All containers in `docker-compose.prod.yml` and `docker-compose.tunnel.yml` have `restart: unless-stopped` or `restart: always`. If your machine does restart, Docker Desktop will automatically boot your databases, web server, and tunnel as soon as you log in.

### 4. Reliable Internet & Wired Connection
- Prefer a wired **Ethernet cable** over Wi-Fi for your local host machine to eliminate Wi-Fi latency jitter during simultaneous student exam submissions.
- Keep the computer plugged into AC power (do not run production on laptop battery power).

---

## 4. Offsite Backup Strategy for Local Hosts

When running on a local computer, hard drive crashes or Windows reinstalls can wipe student data. To safeguard submissions:

### Option A: Sync Backups to OneDrive / Google Drive / Dropbox
The automated backup script can dump database snapshots directly into your cloud-synced local folder.

Create a simple PowerShell scheduled script `docker/backup-local.ps1`:
```powershell
# Path to your cloud sync folder (e.g., OneDrive or Google Drive)
$BACKUP_DIR = "$env:USERPROFILE\OneDrive\DB_Platform_Backups"
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$APP_BACKUP = "$BACKUP_DIR\app_db_$TIMESTAMP.sql.gz"

Write-Host "Backing up app_db to $APP_BACKUP..."
docker exec -t db_platform_postgres_app pg_dump -U postgres -d app_db --clean --if-exists | gzip > $APP_BACKUP

Write-Host "Backup complete. Cloud drive will automatically sync to cloud."
```

### Option B: Remote S3 / Cloudflare R2 Upload
Set `S3_BUCKET` in `.env.production` — the included [docker/backup.sh](file:///c:/Users/stone-laptop/Documents/db_for_business_analytics/docker/backup.sh) script will automatically push daily compressed snapshots to AWS S3 or Cloudflare R2.

---

## 5. Alternative Tunnel Solutions

If you don't have a custom domain or want instant temporary sharing:

| Solution | Command | Best For | Cost |
| :--- | :--- | :--- | :--- |
| **Cloudflare Tunnel** *(Recommended)* | `docker-compose.tunnel.yml` | Permanent university production, custom domain, auto-SSL, DDoS shield | **Free** |
| **ngrok** | `ngrok http 3000` | Quick 1-hour testing / demos with colleagues | Free tier has ephemeral URLs |
| **Tailscale Funnel** | `tailscale funnel 3000` | Exposing to internet via your private Tailscale node | Free |
| **Bore** | `bore local 3000 --to bore.pub` | Lightweight open-source public TCP tunnel | Free |

---

## 6. Verification & Monitoring

Once your local stack and tunnel are running:

1. **Check Tunnel Connection**:
   ```bash
   docker logs -f db_platform_tunnel
   ```
   You should see: `Connection established to Cloudflare edge server... Registered tunnel connection`.

2. **Verify Public Healthcheck**:
   ```bash
   curl https://analytics.yourdomain.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-11-18T...",
     "uptime": 45.2,
     "databases": {
       "app_db": { "status": "connected", "latency_ms": 2.1 },
       "sandbox_db": { "status": "connected", "latency_ms": 1.8 }
     }
   }
   ```

3. **Check Container Status**:
   ```bash
   docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml ps
   ```
