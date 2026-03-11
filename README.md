# Gumroad Webhook Handler

Receives Gumroad sale notifications and automatically:
1. Sends Telegram notification (via OpenClaw)
2. Logs to CSV for tracking
3. Zero ongoing costs (free hosting tier)

---

## Features

- ✅ Real-time sale notifications to Telegram
- ✅ Automatic CSV logging (Date, Product, Amount, Email, License)
- ✅ Works with OpenClaw gateway (no external Telegram bot needed)
- ✅ Test endpoint for validation
- ✅ Health check endpoint
- ✅ Runs on free hosting tiers (Railway, Vercel, Fly.io)

---

## Setup

### 1. Install Dependencies

```bash
cd C:\Users\dammt\projects\webhook-handler
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Edit `.env`:

```env
OPENCLAW_GATEWAY=http://your-gateway-url:3100
OPENCLAW_TOKEN=your_actual_token
TELEGRAM_CHAT_ID=8591172166
```

To get your OpenClaw token, run:
```bash
openclaw config get
```

Look for `gateway.authToken` in the output.

### 3. Run Locally (Test)

```bash
npm start
```

Server starts on `http://localhost:3000`

### 4. Test the Webhook

```bash
curl -X POST http://localhost:3000/test
```

You should receive a Telegram notification with test sale data.

---

## Deployment Options

### Option A: Railway (Recommended)

**Why:** Easiest setup, generous free tier, auto-deploys from GitHub

**Steps:**
1. Create Railway account: railway.app
2. New Project → Deploy from GitHub
3. Select `webhook-handler` repo
4. Add environment variables (from `.env`)
5. Deploy

**Free tier:** 500 hours/month + $5 credit (enough for this)

**Your webhook URL:** `https://your-app.railway.app/webhook/gumroad`

---

### Option B: Vercel

**Why:** Great for serverless, instant deploys

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in project directory
3. Add environment variables in Vercel dashboard
4. Deploy

**Free tier:** Unlimited serverless invocations

**Note:** Vercel is serverless, so CSV logging might not persist. Use Railway for CSV support.

---

### Option C: Fly.io

**Why:** Full control, always-on server

**Steps:**
1. Install Fly CLI: `https://fly.io/docs/hands-on/install-flyctl/`
2. Run: `fly launch` in project directory
3. Add secrets: `fly secrets set OPENCLAW_TOKEN=xxx`
4. Deploy: `fly deploy`

**Free tier:** 3 shared VMs (enough for this)

---

## Connect to Gumroad

Once deployed:

1. **Get your webhook URL** from hosting provider (e.g., `https://your-app.railway.app/webhook/gumroad`)

2. **Configure Gumroad:**
   - Go to Gumroad → Settings → Advanced → Webhooks
   - Add new webhook: `https://your-app.railway.app/webhook/gumroad`
   - Select event: `sale.successful`
   - Save

3. **Test with real purchase:**
   - Make a test purchase (you can refund later)
   - Check Telegram for notification
   - Verify CSV log entry

---

## Endpoints

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "status": "running",
  "service": "gumroad-webhook-handler",
  "version": "1.0.0",
  "timestamp": "2026-03-10T22:46:00.000Z"
}
```

### `POST /webhook/gumroad`
Gumroad webhook receiver.

**Expects:** Gumroad sale notification payload

**Actions:**
1. Sends Telegram notification
2. Logs to CSV (`sales-log.csv`)
3. Returns 200 OK

### `POST /test`
Manual test endpoint (simulates a sale).

**Usage:**
```bash
curl -X POST http://localhost:3000/test
```

---

## CSV Log Format

`sales-log.csv`:

```csv
Date,Time,Product,Amount,Email,LicenseKey,SaleID
2026-03-10,20:46:15,"Link Cleaner Pro",5.00,"customer@example.com","KEY-12345","abc123"
```

You can import this into Google Sheets, Excel, or the autonomous-income ledger.

---

## Monitoring

**Check logs:**
- Railway: Dashboard → Logs
- Vercel: Dashboard → Deployments → View Logs
- Fly.io: `fly logs`

**Check webhook deliveries:**
- Gumroad → Settings → Webhooks → View Recent Deliveries

---

## Troubleshooting

**No Telegram notification:**
- Check `OPENCLAW_TOKEN` is correct
- Verify gateway is running: `openclaw status`
- Check gateway is accessible (not localhost if deployed remotely)

**CSV not logging:**
- Vercel: Serverless doesn't support file writes (use Railway/Fly.io instead)
- Check file permissions

**Webhook not received:**
- Check Gumroad webhook URL is correct
- Verify server is running (health check at `/`)
- Check hosting provider logs for errors

---

## Costs

**Hosting:** $0/month (free tier)  
**OpenClaw:** Already running (no extra cost)  
**Gumroad:** No webhook fees

**Total:** $0/month forever

---

## Next Steps

1. ✅ Deploy to Railway (easiest option)
2. ✅ Configure Gumroad webhook URL
3. ✅ Test with a purchase
4. ✅ Verify Telegram notification + CSV log
5. ✅ Celebrate automation! 🎉

---

**Created:** 2026-03-10 22:46 PM  
**Status:** Ready to deploy
