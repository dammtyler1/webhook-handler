// Gumroad Webhook Handler
// Receives sale notifications and forwards to Telegram + logs to CSV

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Telegram config (via OpenClaw Gateway)
const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY || 'http://localhost:3100';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '8591172166';

// CSV log path (for local development, use webhook logs)
const LOG_PATH = process.env.LOG_PATH || './sales-log.csv';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'gumroad-webhook-handler',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Gumroad webhook endpoint
app.post('/webhook/gumroad', async (req, res) => {
  try {
    const sale = req.body;
    
    // Extract key info
    const {
      product_name,
      product_permalink,
      price,
      purchaser_email,
      sale_id,
      sale_timestamp,
      license_key,
      quantity
    } = sale;
    
    // Calculate amount (price is in cents for some Gumroad setups, verify)
    const amount = parseFloat(price) / 100; // Adjust if needed
    
    // Build Telegram message
    const message = `💰 **New Sale!**

Product: ${product_name}
Amount: $${amount.toFixed(2)}
Customer: ${purchaser_email}
License: ${license_key || 'N/A'}
Quantity: ${quantity || 1}

Sale ID: ${sale_id}
Time: ${new Date(sale_timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago' })}`;

    // Send to Telegram (via OpenClaw)
    if (OPENCLAW_GATEWAY && OPENCLAW_TOKEN) {
      await sendToTelegram(message);
    } else {
      console.log('Telegram notification skipped (no gateway/token)');
    }
    
    // Log to CSV
    logToCSV({
      date: new Date(sale_timestamp).toISOString().split('T')[0],
      time: new Date(sale_timestamp).toTimeString().split(' ')[0],
      product: product_name,
      amount: amount.toFixed(2),
      email: purchaser_email,
      license_key: license_key || '',
      sale_id
    });
    
    // Log to console
    console.log(`✅ Sale processed: ${product_name} - $${amount.toFixed(2)} - ${purchaser_email}`);
    
    // Acknowledge webhook
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Send notification to Telegram via OpenClaw
async function sendToTelegram(message) {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        channel: 'telegram',
        target: TELEGRAM_CHAT_ID,
        message: message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }
    
    console.log('✅ Telegram notification sent');
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
    // Don't throw - webhook should still succeed even if notification fails
  }
}

// Log sale to CSV
function logToCSV(data) {
  try {
    const { date, time, product, amount, email, license_key, sale_id } = data;
    
    // Create CSV if doesn't exist
    if (!fs.existsSync(LOG_PATH)) {
      const header = 'Date,Time,Product,Amount,Email,LicenseKey,SaleID\n';
      fs.writeFileSync(LOG_PATH, header, 'utf8');
    }
    
    // Append row
    const row = `${date},${time},"${product}",${amount},"${email}","${license_key}","${sale_id}"\n`;
    fs.appendFileSync(LOG_PATH, row, 'utf8');
    
    console.log('✅ Logged to CSV');
  } catch (error) {
    console.error('CSV logging failed:', error.message);
  }
}

// Test endpoint (for manual testing)
app.post('/test', (req, res) => {
  const testSale = {
    product_name: 'Test Product',
    price: 500, // $5.00 in cents
    purchaser_email: 'test@example.com',
    sale_id: 'test-' + Date.now(),
    sale_timestamp: new Date().toISOString(),
    license_key: 'TEST-KEY-12345',
    quantity: 1
  };
  
  req.body = testSale;
  
  // Reuse webhook handler
  app._router.handle(
    { ...req, url: '/webhook/gumroad', method: 'POST' },
    res
  );
});

// Start server - bind to 0.0.0.0 for Railway/cloud hosting
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Webhook handler running on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/gumroad`);
  console.log(`🔒 OpenClaw gateway: ${OPENCLAW_GATEWAY || 'Not configured'}`);
});
