import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createConnector} from './runner.js';

test('offline cycle retains attendance and replays after API recovery',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-sync-'));
 try{
 let connected=false;
 let source=[{recordId:'77',userId:'M001',mode:'checkin'}];
 const sent=[];
 const runner=createConnector({queueFile:join(dir,'pending.json'),deviceId:'X904A',apiUrl:'https://gym.example',apiKey:'test',
  readEvents:async()=>{const out=source;source=[];return out},
  submit:async(event)=>{if(!connected)throw Error('offline');sent.push(event);return {ok:true}}
 });
 const first=await runner.cycle();assert.equal(first.pending,1);assert.equal(first.captured,1);
 connected=true;
 const second=await runner.cycle();assert.equal(second.pending,0);assert.equal(second.sent,1);
 assert.equal(sent[0].eventId,'X904A:77');
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('unknown machine directions are quarantined, never guessed',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'gym-unknown-'));
 try{
 const errors=[];
 const runner=createConnector({queueFile:join(dir,'pending.json'),deviceId:'X904A',apiUrl:'https://gym.example',apiKey:'test',
  readEvents:async()=>[{recordId:'99',userId:'M001',mode:'unknown'}],
  submit:async()=>{throw Error('must not submit')},onError:e=>errors.push(e)
 });
 const result=await runner.cycle();
 assert.equal(result.quarantined,1);assert.equal(result.pending,0);assert.equal(errors.length,1);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
