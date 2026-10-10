// The WhatsApp API acknowledges queue acceptance, not handset delivery.
export function createGymWaOutbox(db, {url=process.env.GYM_WA_GATEWAY_URL,token=process.env.GYM_WA_GATEWAY_TOKEN,groupId=process.env.GYM_WA_GROUP_ID,deviceId=process.env.GYM_WA_DEVICE_ID,enabled=process.env.GYM_WA_ENABLED==='true',fetcher=fetch}={}) {
  db.exec(`CREATE TABLE IF NOT EXISTS wa_outbox(
    visit_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    next_try TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_error TEXT,
    gateway_message_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  function enqueue(visitId) {
    db.prepare("INSERT OR IGNORE INTO wa_outbox(visit_id) VALUES (?)").run(visitId);
  }
  let dispatching=false;
  async function dispatch() {
    if(dispatching) return {busy:true};
    dispatching=true;
    try {
    if (!enabled || !url || !token || !groupId) return {enabled:false};
    const rows=db.prepare(`SELECT o.visit_id,m.name,v.checkin,o.attempts
      FROM wa_outbox o JOIN visits v ON v.id=o.visit_id
      JOIN members m ON m.id=v.member_id
      WHERE o.status='pending' AND o.next_try<=CURRENT_TIMESTAMP
      ORDER BY o.visit_id LIMIT 10`).all();
    let accepted=0;
    for (const row of rows) {
      const when=new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(row.checkin.replace(' ','T')+'Z'));
      const text='🏋️ Gym CST — Member masuk\nNama: '+row.name+'\nWaktu: '+when+' WIB';
      try {
        const response=await fetcher(url.replace(/\/$/,'')+'/v1/messages',{
          method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token,'idempotency-key':'gym-checkin-'+row.visit_id},
          body:JSON.stringify({type:'text',text,to:groupId,groupId,...(deviceId?{deviceId}:{})}),
          signal:AbortSignal.timeout(10000)
        });
        const result=await response.json().catch(()=>({}));
        if (!response.ok) throw new Error('Gateway HTTP '+response.status);
        db.prepare("UPDATE wa_outbox SET status='accepted',gateway_message_id=?,attempts=attempts+1,last_error=NULL WHERE visit_id=?").run(String(result.messageId||''),row.visit_id);
        accepted++;
      } catch(err) {
        const delay=Math.min(3600,30*Math.pow(2,Math.min(row.attempts,7)));
        db.prepare("UPDATE wa_outbox SET attempts=attempts+1,last_error=?,next_try=datetime('now', '+' || ? || ' seconds') WHERE visit_id=?").run(String(err.message).slice(0,180),delay,row.visit_id);
      }
    }
    return {enabled:true,examined:rows.length,accepted};
    } finally { dispatching=false; }
  }
  return {enqueue,dispatch};
}
