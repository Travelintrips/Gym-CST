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
