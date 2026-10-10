import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createEventQueue} from './queue.js';
import {submitX904Event} from './adapter.js';

test('offline events survive restart and are deduplicated',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-x904-'));
 try {
  const file=join(dir,'pending.json');
  let q=createEventQueue(file);
  assert.equal(q.add({eventId:'X904:1',code:'1',mode:'checkin'}),true);
  assert.equal(q.add({eventId:'X904:1',code:'1',mode:'checkin'}),false);
  q=createEventQueue(file);
  assert.equal(q.count(),1);
  assert.deepEqual(await q.flush(async()=>{throw Error('offline')}),{sent:0,pending:1});
  q=createEventQueue(file);
  let messages=0;
  assert.deepEqual(await q.flush(async()=>{messages++}),{sent:1,pending:0});
  assert.equal(messages,1);
 }finally{rmSync(dir,{force:true,recursive:true})}
});
test('remote insecure API URL is rejected',async()=>{
 await assert.rejects(submitX904Event({eventId:'x',code:'1',mode:'checkin'},{
  apiUrl:'http://192.168.100.50:3109',apiKey:'test',fetcher:async()=>{throw Error('should never be called')}
 }),/HTTPS/);
});

test('malformed events are never stored',()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-invalid-'));
 try {
  const q=createEventQueue(join(dir,'pending.json'));
  assert.throws(()=>q.add({eventId:'test-1',code:'M001',mode:'unknown'}),/Invalid event/);
  assert.throws(()=>q.add({eventId:'',code:'M001',mode:'checkin'}),/Invalid event/);
  assert.equal(q.count(),0);
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('acknowledged events remain deduplicated after restart and repoll',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-repoll-'));
 try{
 const file=join(dir,'pending.json');
 const event={eventId:'X904:201',code:'M201',mode:'checkout'};
 let queue=createEventQueue(file);
 assert.equal(queue.add(event),true);
 let sends=0;
 await queue.flush(async()=>{sends++});
 queue=createEventQueue(file);
 assert.equal(queue.add(event),false);
 assert.equal(queue.count(),0);
 assert.equal(sends,1);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('migrates original array queue without losing events',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-migrate-'));
 try{
 const file=join(dir,'pending.json');
 const {writeFileSync}=await import('node:fs');
 writeFileSync(file,JSON.stringify([{eventId:'X904:3',code:'3',mode:'checkin'}]));
 const q=createEventQueue(file);
 assert.equal(q.count(),1);
 assert.deepEqual(await q.flush(async()=>{}),{sent:1,pending:0});
 assert.equal(createEventQueue(file).add({eventId:'X904:3',code:'3',mode:'checkin'}),false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('crash-like lost acknowledgement retries with same stable event ID',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-lost-ack-'));
 try{
  const file=join(dir,'pending.json');
  const event={eventId:'X904:501',code:'M501',mode:'checkin'};
  let queue=createEventQueue(file);
  assert.equal(queue.add(event),true);
  const attempts=[];
  // Simulate server processing the request but losing the acknowledgement.
  const first=await queue.flush(async item=>{attempts.push(item.eventId);throw Error('connection lost after server commit')});
  assert.deepEqual(first,{sent:0,pending:1});
  queue=createEventQueue(file);
  const second=await queue.flush(async item=>{attempts.push(item.eventId);return {ok:true,duplicate:true}});
  assert.deepEqual(second,{sent:1,pending:0});
  assert.deepEqual(attempts,['X904:501','X904:501']);
  assert.equal(createEventQueue(file).add(event),false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
