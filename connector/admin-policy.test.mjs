import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorizeX904,CAPABILITIES} from './admin-policy.js';
test('physical access denied by default and write capabilities blocked',()=>{
 const logs=[];
 const req={role:'owner',deviceId:'X904A',approved:true,audit:x=>logs.push(x)};
 assert.deepEqual(authorizeX904({...req,action:'device.status'}),{action:'device.status',deviceId:'X904A'});
 for(const action of ['device.reset','attendance.delete','biometric.read','users.enroll','device.settings.write','device.command']){
  assert.throws(()=>authorizeX904({...req,action}),/not authorized/);
 }
 assert.throws(()=>authorizeX904({...req,action:'attendance.view',approved:false}),/not authorized/);
 assert.equal(logs.length,8);
 assert.equal(logs.filter(x=>!x.allowed).length,7);
});
test('operator cannot obtain owner-only read capability',()=>{
 assert.throws(()=>authorizeX904({role:'operator',deviceId:'X904A',approved:true,action:'users.view'}),/not authorized/);
 assert.ok(!CAPABILITIES.owner.includes('biometric.read'));
});
