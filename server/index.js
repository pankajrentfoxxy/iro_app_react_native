/**
 * Dummy IRO auth API — no database. OTP and sessions live in memory only.
 * Run: npm run api:dummy
 *
 * OTP is printed to this terminal so you can paste it in the app.
 */
const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT) || 4000;
const app = express();

app.use(cors());
app.use(express.json());

/** @type {Map<string, { otp: string, expiresAt: number }>} */
const otpByPhone = new Map();
/** @type {Map<string, object>} */
const userByToken = new Map();

function randomOtp() {
  // return String(Math.floor(100000 + Math.random() * 900000));
  return '123456';
}

function makeToken() {
  return `dummy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

app.post('/api/auth/otp/request', (req, res) => {
  const phone = req.body?.phone;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ message: 'phone required' });
  }
  const otp = randomOtp();
  otpByPhone.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
  console.log(`\n[dummy-api] OTP for ${phone} → ${otp}\n`);
  return res.json({ ok: true, message: 'OTP issued (see server console)' });
});

app.post('/api/auth/otp/verify', (req, res) => {
  const { phone, otp } = req.body || {};
  const row = phone ? otpByPhone.get(phone) : null;

  if (!row || row.expiresAt < Date.now()) {
    return res.status(400).json({ message: 'OTP expired or not requested' });
  }
  if (String(row.otp) !== String(otp ?? '')) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  otpByPhone.delete(phone);

  const token = makeToken();
  const last6 = phone.replace(/\D/g, '').slice(-6);
  const user = {
    id: `user-${last6}`,
    name: 'Reformer',
    phone,
    reformerId: `IRO-${last6}`,
    role: 'reformer',
  };
  userByToken.set(token, user);

  return res.json({ token, user });
});

app.get('/api/auth/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.slice(7);
  const user = userByToken.get(token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  return res.json({ user });
});

app.post('/api/auth/register', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.slice(7);
  const prev = userByToken.get(token);
  if (!prev) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const b = req.body || {};
  const user = {
    ...prev,
    name: b.name || prev.name,
    state: b.state,
    district: b.district,
    role: 'reformer',
  };
  userByToken.set(token, user);
  return res.json({ user, token });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dummy IRO API → http://localhost:${PORT}/api`);
  console.log(`Android emulator → set EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:${PORT}/api`);
});
