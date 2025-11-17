require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ reportingInterval: 'weekly' }, null, 2));

const CONTROL_TOKEN = process.env.CONTROL_TOKEN || '';
const PORT = process.env.PORT || 3002;

const app = express();
app.use(cors());
app.use(bodyParser.json());

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {
    return { reportingInterval: 'weekly' };
  }
}

function writeConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

// Simple auth middleware (header X-EMAIL-CONTROL-TOKEN or ?token=)
function auth(req, res, next) {
  if (!CONTROL_TOKEN) return next();
  const header = req.get('x-email-control-token');
  const token = header || req.query.token;
  if (!token || token !== CONTROL_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
}

app.get('/config', (req, res) => {
  res.json(readConfig());
});

/**
 * Endpoint to receive inbound email webhooks.
 * Expects JSON: { subject, body, from }
 * Will parse for lines like: "interval: daily" and update config.reportingInterval
 */
app.post('/incoming-email', auth, (req, res) => {
  const { subject = '', body = '', from = '' } = req.body || {};
  const text = (subject + '\n' + body).toLowerCase();

  const match = text.match(/interval:\s*(every_run|hourly|daily|weekly|biweekly|monthly|disabled)/i);
  if (!match) {
    return res.json({ ok: true, message: 'no command found' });
  }

  const interval = match[1];
  const cfg = readConfig();
  cfg.reportingInterval = interval;
  writeConfig(cfg);

  console.log(`Updated reportingInterval -> ${interval} from ${from}`);
  return res.json({ ok: true, reportingInterval: interval });
});

app.listen(PORT, () => {
  console.log(`Email-control server running on port ${PORT}`);
  console.log(`Config URL: http://localhost:${PORT}/config`);
});
