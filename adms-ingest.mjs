import {createHash, timingSafeEqual} from 'node:crypto';

/**
 * Restricted X904 attendance intake. This is NOT a door controller.
 * A trusted private ingress proxy must authenticate the physical device and
 * inject X-Gym-Ingress-Key after stripping that header from client requests.
 * Never expose this route directly to the internet.
 */
const MAX_BODY = 64 * 1024;
const MAX_RECORDS = 500;
const text = (res, status, body) => {
  res.writeHead(status, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  res.end(body);
};
const secureEquals = (a, b) => {
  const aBuf = Buffer.from(a), bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bBuf);
};
export function parseAttlog(payload, serial) {
  if (typeof payload !== 'string' || Buffer.byteLength(payload) > MAX_BODY) throw new Error('ATTLOG payload too large');
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(serial)) throw new Error('Invalid device serial');
  const rows = payload.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (rows.length > MAX_RECORDS) throw new Error('Too many attendance events');
  return rows.map(line => {
    // ZK-style ATTLOG: PIN timestamp status verify [workcode ...].
    // Some devices send tab-delimited values; whitespace is safe here.
    const parts = line.split(/\s+/);
    if (parts.length < 4 || parts.length > 8) throw new Error('Unrecognized ATTLOG record');
    const [pin, day, clock, status, verify] = parts;
    if (!/^[A-Za-z0-9_-]{1,50}$/.test(pin)) throw new Error('Invalid user PIN');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}:\d{2}$/.test(clock)) throw new Error('Invalid attendance timestamp');
    const when = new Date(day + 'T' + clock + '+07:00');
    if (Number.isNaN(when.getTime()) || new Date(when.getTime() + 7 * 3600000).toISOString().slice(0,10) !== day) throw new Error('Invalid attendance date');
    if (!/^\d{1,3}$/.test(status) || !/^\d{1,3}$/.test(verify)) throw new Error('Invalid status or verification type');
    const id = createHash('sha256').update([serial, line].join('\n')).digest('hex');
    return {id, serial, pin, deviceTime: day + ' ' + clock, status: Number(status), verify: Number(verify)};
  });
}
export async function handleAdms(req, res, url, db) {
  if (url.pathname !== '/iclock/cdata') return false;
  // Off unless configured explicitly. It must not respond to untrusted probes.
  if (process.env.GYM_ADMS_ENABLED !== 'true') { text(res, 404, 'Not found'); return true; }
  const secret = process.env.GYM_ADMS_INGRESS_KEY || '';
  const expectedSerial = process.env.GYM_ADMS_SERIAL || '';
  const supplied = String(req.headers['x-gym-ingress-key'] || '');
  const serial = url.searchParams.get('SN') || '';
  if (secret.length < 32 || !expectedSerial || !secureEquals(secret, supplied) || !secureEquals(expectedSerial, serial)) {
    text(res, 403, 'Forbidden'); return true;
  }
  if (req.method === 'GET') {
    // Do not send remote access commands, change door permissions, or sync biometric templates.
    text(res, 200, 'GET OPTION FROM: ' + serial + '\nStamp=0\nOpStamp=0\nErrorDelay=60\nDelay=30\nTransTimes=00:00;23:59\nTransInterval=1\nTransFlag=1111000000\nRealtime=1\nEncrypt=0\n');
    return true;
  }
  if (req.method !== 'POST' || url.searchParams.get('table') !== 'ATTLOG') {
    text(res, 403, 'Unsupported command or table'); return true;
  }
  try {
    let payload = '';
    for await (const chunk of req) {
      payload += chunk.toString('utf8');
      if (Buffer.byteLength(payload) > MAX_BODY) {text(res, 413, 'Payload too large'); return true;}
    }
    const events = parseAttlog(payload, serial);
    db.exec(`CREATE TABLE IF NOT EXISTS adms_attendance (
      event_id TEXT PRIMARY KEY,
      device_serial TEXT NOT NULL,
      user_pin TEXT NOT NULL,
      device_time TEXT NOT NULL,
      attendance_status INTEGER NOT NULL,
      verification_type INTEGER NOT NULL,
      received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      matched_member_id INTEGER,
      CHECK (matched_member_id IS NULL)
    )`);
    const insert = db.prepare('INSERT OR IGNORE INTO adms_attendance(event_id,device_serial,user_pin,device_time,attendance_status,verification_type) VALUES(?,?,?,?,?,?)');
    let inserted = 0;
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const e of events) inserted += Number(insert.run(e.id, e.serial, e.pin, e.deviceTime, e.status, e.verify).changes);
      db.exec('COMMIT');
    } catch (e) {db.exec('ROLLBACK');throw e;}
    console.log('[adms] attendance received', {count: events.length, inserted}); // no PINs, PII or raw payload logged
    text(res, 200, 'OK: ' + events.length);
  } catch (e) {
    console.error('[adms] rejected attendance batch:', e instanceof Error ? e.message : 'invalid payload');
    text(res, 400, 'Invalid attendance batch');
  }
  return true;
}
