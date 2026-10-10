import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createGymWaOutbox} from './wa-outbox.js';

test('notification outbox sends one X904 visit, formats WIB, and deduplicates',async()=>{
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE members(id INTEGER PRIMARY KEY,name TEXT);CREATE TABLE visits(id INTEGER PRIMARY KEY,member_id INTEGER,checkin TEXT)");
  db.prepare("INSERT INTO members VALUES(?,?)").run(1,'Budi Test');
  db.prepare("INSERT INTO visits VALUES(?,?,?)").run(7,1,'2026-10-10 01:15:00');
  const calls=[];
  const outbox=createGymWaOutbox(db,{enabled:true,url:'https://wa.example',token:'test-token',groupId:'120363123456789012@g.us',fetcher:async (url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({messageId:'test-id'})}}});
  outbox.enqueue(7);outbox.enqueue(7);
  const result=await outbox.dispatch();
  assert.equal(result.accepted,1);
  assert.equal(calls.length,1);
  const payload=JSON.parse(calls[0].opts.body);
  assert.equal(payload.to,'120363123456789012@g.us');
  assert.match(payload.text,/Budi Test/);
  assert.match(payload.text,/08[.:]15/);
  assert.equal((await outbox.dispatch()).accepted,0);
  assert.equal(db.prepare("SELECT count(*) AS n FROM wa_outbox").get().n,1);
  db.close();
});
test('failed gateway delivery remains pending with retry',async()=>{
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE members(id INTEGER PRIMARY KEY,name TEXT);CREATE TABLE visits(id INTEGER PRIMARY KEY,member_id INTEGER,checkin TEXT)");
  db.prepare("INSERT INTO members VALUES(?,?)").run(1,'A');
  db.prepare("INSERT INTO visits VALUES(?,?,?)").run(1,1,'2026-10-10 01:15:00');
  const outbox=createGymWaOutbox(db,{enabled:true,url:'https://wa.example',token:'token',groupId:'120363123456789012@g.us',fetcher:async()=>({ok:false,status:500,json:async()=>({})})});
  outbox.enqueue(1);
  const result=await outbox.dispatch();
  assert.equal(result.accepted,0);
  const state=db.prepare("SELECT status,attempts FROM wa_outbox WHERE visit_id=1").get();
  assert.equal(state.status,'pending');
  assert.equal(state.attempts,1);
  db.close();
});

test('concurrent dispatch does not submit the same group message twice',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE members(id INTEGER PRIMARY KEY,name TEXT);CREATE TABLE visits(id INTEGER PRIMARY KEY,member_id INTEGER,checkin TEXT)");
 db.prepare("INSERT INTO members VALUES(?,?)").run(1,'Test Concurrent');
 db.prepare("INSERT INTO visits VALUES(?,?,?)").run(11,1,'2026-10-10 01:15:00');
 let submitted=0;
 const outbox=createGymWaOutbox(db,{enabled:true,url:'https://wa.example',token:'token',groupId:'120363123456789012@g.us',fetcher:async()=>{
   submitted++;
   await new Promise(resolve=>setTimeout(resolve,30));
   return {ok:true,json:async()=>({messageId:'id'})};
 }});
 outbox.enqueue(11);
 await Promise.all([outbox.dispatch(),outbox.dispatch()]);
 assert.equal(submitted,1);
 assert.equal(db.prepare('SELECT status FROM wa_outbox WHERE visit_id=11').get().status,'accepted');
 db.close();
});
