import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
const data=mkdtempSync(join(tmpdir(),'gym-smoke-'));
const password=randomBytes(24).toString('hex');
const port=32198;
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url).pathname,env:{...process.env,DATA_DIR:data,PORT:String(port),ADMIN_PASSWORD:password,GYM_DEVICE_API_KEY:'test-device-key'},stdio:'pipe'});
const base='http://127.0.0.1:'+port;
async function request(path,body,token){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return [r.status,await r.json()]}
try{let ready=false;for(let i=0;i<40;i++){try{const r=await request('/healthz');if(r[0]===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}if(!ready)throw Error('Server not ready');const login=await request('/api/login',{username:'admin',password});if(login[0]!==200)throw Error('Login failed');const token=login[1].token;const member=await request('/api/members',{name:'Test Member',code:'TEST001'},token);if(member[0]!==201)throw Error('Member create failed');const checkin=await request('/api/checkin',{code:'TEST001'},token);if(checkin[0]!==201)throw Error('Checkin failed');const duplicate=await request('/api/checkin',{code:'TEST001'},token);if(duplicate[0]!==409)throw Error('Duplicate checkin not blocked');const dashboard=await request('/api/dashboard',null,token);if(dashboard[1].inside!==1)throw Error('Dashboard count wrong');const checkout=await request('/api/checkout',{code:'TEST001'},token);if(checkout[0]!==200)throw Error('Checkout failed');const after=await request('/api/dashboard',null,token);if(after[1].inside!==0)throw Error('Checkout count wrong');const machineMember=await request('/api/members',{name:'Device Tester',code:'X904T001'},token);if(machineMember[0]!==201)throw Error('X904 member create failed');
 const event=async (id,mode)=>{const r=await fetch(base+'/api/device-event',{method:'POST',headers:{'content-type':'application/json','x-device-key':'test-device-key'},body:JSON.stringify({eventId:id,code:'X904T001',mode})});return [r.status,await r.json()]};
 const first=await event('device-1-event-1','checkin');if(first[0]!==201)throw Error('X904 checkin failed');
 const repeat=await event('device-1-event-1','checkin');if(repeat[0]!==200||!repeat[1].duplicate)throw Error('X904 duplicate event not deduplicated');
 const double=await event('device-1-event-2','checkin');if(double[0]!==409)throw Error('Second open X904 visit not blocked');
 const finished=await event('device-1-event-3','checkout');if(finished[0]!==201)throw Error('X904 checkout failed');
 const notifications=await request('/api/notifications',null,token);
 if(notifications[0]!==200||!Array.isArray(notifications[1].recent)||notifications[1].recent.length!==2)throw Error('Queue visibility incorrect');
 const unauth=await request('/api/notifications');
 if(unauth[0]!==401)throw Error('Notifications endpoint exposed publicly');
 const invalid=await fetch(base+'/api/device-event',{method:'POST',headers:{'content-type':'application/json','x-device-key':'incorrect'},body:JSON.stringify({eventId:'device-1-unauth',code:'X904T001',mode:'checkin'})});
 if(invalid.status!==403)throw Error('Device API unauthorized request permitted');

 console.log('PASS health login members manual attendance and X904 idempotent events')}catch(e){console.error('FAIL',e.message);process.exitCode=1}finally{child.kill();rmSync(data,{recursive:true,force:true})}