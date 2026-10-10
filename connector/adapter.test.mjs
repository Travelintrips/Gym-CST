import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeX904Attendance,submitX904Event} from './adapter.js';

test('normalize X904 events and preserve device-scoped idempotency',()=>{
 const a=normalizeX904Attendance({userId:42,recordId:'1234',mode:'checkin'},{deviceId:'X904-A'});
 assert.deepEqual(a,{code:'42',eventId:'X904-A:1234',mode:'checkin'});
 assert.equal(normalizeX904Attendance({userId:42,recordId:'1234',mode:'checkout'},{deviceId:'X904-B'}).eventId,'X904-B:1234');
});
test('reject unsafe / incomplete machine events',()=>{
 assert.throws(()=>normalizeX904Attendance({userId:42,mode:'checkin'},{deviceId:'X904-A'}));
 assert.throws(()=>normalizeX904Attendance({userId:42,recordId:'1',mode:'unknown'},{deviceId:'X904-A'}));
 assert.throws(()=>normalizeX904Attendance({userId:42,recordId:'1',mode:'checkin'},{deviceId:'bad device'}));
});
test('submit authorized event, never sends biometric values',async()=>{
 const calls=[];
 const data=normalizeX904Attendance({userId:42,recordId:'2',mode:'checkin',fingerprint:'secret'},{deviceId:'X904-A'});
 await submitX904Event(data,{apiUrl:'https://gym.dev.test',apiKey:'fake-key',fetcher:async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({ok:true})}}});
 assert.equal(calls.length,1);
 assert.equal(calls[0].opts.headers['x-device-key'],'fake-key');
 assert.equal(JSON.parse(calls[0].opts.body).fingerprint,undefined);
 assert.equal(JSON.parse(calls[0].opts.body).eventId,'X904-A:2');
});
