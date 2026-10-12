import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createValidatedX904Pipeline} from './validated-pipeline.js';

test('explicit mapping accepts known events, quarantines others, strips sensitive fields',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'x904-pipe-')); const sent=[],rejected=[];
 try {
  const pipeline=createValidatedX904Pipeline({
   deviceId:'X904A',queueFile:join(dir,'pending.json'),apiUrl:'https://gym.example',apiKey:'test',
   directionMap:{'verified-in':'checkin'},
   readRawRecords:async()=>[
    {recordId:'123',userId:'M1',status:'verified-in',fingerprint:'private',password:'private'},
    {recordId:'124',userId:'M2',status:'unverified'}
   ],
   submit:async event=>{sent.push(event);return {ok:true}},
   onRejected:item=>rejected.push(item)
  });
  const result=await pipeline.cycle();
  assert.equal(result.captured,1);assert.equal(result.sent,1);assert.equal(result.pending,0);
  assert.deepEqual(sent,[{code:'M1',eventId:'X904A:123',mode:'checkin'}]);
  assert.deepEqual(rejected,[{index:1,reason:'unknown_direction'}]);
 } finally {rmSync(dir,{force:true,recursive:true})}
});
test('no unapproved or absent status mappings',()=>{
 assert.throws(()=>createValidatedX904Pipeline({readRawRecords:async()=>[],directionMap:{}}),/Explicit verified/);
 assert.throws(()=>createValidatedX904Pipeline({readRawRecords:async()=>[],directionMap:{'0':'arrive'}}),/Invalid direction/);
});
