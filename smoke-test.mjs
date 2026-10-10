import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
const data=mkdtempSync(join(tmpdir(),'gym-smoke-'));
const password=randomBytes(24).toString('hex');
const port=32198;
const child=spawn(process.execPath,['server.js'],{cwd:new URL('.',import.meta.url).pathname,env:{...process.env,DATA_DIR:data,PORT:String(port),ADMIN_PASSWORD:password},stdio:'pipe'});
const base='http://127.0.0.1:'+port;
async function request(path,body,token){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return [r.status,await r.json()]}
try{let ready=false;for(let i=0;i<40;i++){try{const r=await request('/healthz');if(r[0]===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}if(!ready)throw Error('Server not ready');const login=await request('/api/login',{username:'admin',password});if(login[0]!==200)throw Error('Login failed');const token=login[1].token;const member=await request('/api/members',{name:'Test Member',code:'TEST001'},token);if(member[0]!==201)throw Error('Member create failed');const checkin=await request('/api/checkin',{code:'TEST001'},token);if(checkin[0]!==201)throw Error('Checkin failed');const duplicate=await request('/api/checkin',{code:'TEST001'},token);if(duplicate[0]!==409)throw Error('Duplicate checkin not blocked');const dashboard=await request('/api/dashboard',null,token);if(dashboard[1].inside!==1)throw Error('Dashboard count wrong');const checkout=await request('/api/checkout',{code:'TEST001'},token);if(checkout[0]!==200)throw Error('Checkout failed');const after=await request('/api/dashboard',null,token);if(after[1].inside!==0)throw Error('Checkout count wrong');console.log('PASS health login member checkin duplicate dashboard checkout')}catch(e){console.error('FAIL',e.message);process.exitCode=1}finally{child.kill();rmSync(data,{recursive:true,force:true})}