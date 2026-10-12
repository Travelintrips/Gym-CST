import test from 'node:test';import assert from 'node:assert/strict';
import {createAdmsWireLab} from './adms-wire-lab.mjs';
test('iClock wire responses are plain text and avoid fake attendance acknowledgements',async()=>{
 const app=createAdmsWireLab();const addr=await app.listen();
 const root='http://127.0.0.1:'+addr.port;
 try{
  let r=await fetch(root+'/iclock/cdata?SN=TEST_1234&options=all');
  assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^text\/plain/);
  assert.match(await r.text(),/^GET OPTION FROM: TEST_1234/);
  r=await fetch(root+'/iclock/getrequest?SN=TEST_1234');
  assert.equal(r.status,200);assert.equal(await r.text(),'OK\n');
  r=await fetch(root+'/iclock/cdata?SN=TEST_1234&table=ATTLOG',{method:'POST',body:'simulated'});
  assert.equal(r.status,503);assert.match(await r.text(),/NOT READY/);
  r=await fetch(root+'/iclock/cdata?SN=UNTRUSTED&options=all');
  assert.equal(r.status,403);
 }finally{await new Promise(resolve=>app.server.close(resolve))}
});
test('lab refuses public network binding',()=>assert.throws(()=>createAdmsWireLab({host:'0.0.0.0'}),/loopback/));
