import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReadOnlyCollector} from './read-only-collector.js';
test('X904 read gate remains closed without explicit approval',()=>{
 assert.throws(()=>createReadOnlyCollector({sourceId:'X904A',readAttendance:async()=>[]}),/not approved/);
});
test('read-only interface strips biometric and private fields',async()=>{
 const reader=createReadOnlyCollector({approved:true,sourceId:'X904A',readAttendance:async()=>[{recordId:'1',userId:'M1',mode:'checkin',fingerprint:'secret',password:'secret'}]});
 assert.deepEqual(await reader.read(),[{recordId:'1',userId:'M1',mode:'checkin'}]);
 assert.deepEqual(Object.keys(reader),['read']);
});
