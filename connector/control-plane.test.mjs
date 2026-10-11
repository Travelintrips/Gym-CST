import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createX904ControlPlane} from './control-plane.js';

test('X904 full administration requires hardware verification',async()=>{
 const calls=[];
 const api=createX904ControlPlane({deviceId:'X904A',adapter:{'device.status':async()=>{calls.push('status');return {online:true}}}});
 await assert.rejects(api.perform({role:'owner',action:'device.status',operatorId:'owner'}),/not available/);
 assert.equal(calls.length,0);
});
test('owner read is scoped; destructive and raw commands never execute',async()=>{
 const audit=[],calls=[];
 const adapter={'device.status':async()=>({connected:true}),'device.command':async()=>{calls.push('raw')},'attendance.delete':async()=>{calls.push('delete')}};
 const api=createX904ControlPlane({deviceId:'X904A',adapter,physicalVerified:true,enableWrites:true,audit:e=>audit.push(e)});
 assert.deepEqual(await api.perform({role:'owner',action:'device.status',operatorId:'owner'}),{connected:true});
 await assert.rejects(api.perform({role:'owner',action:'device.command',operatorId:'owner'}));
 await assert.rejects(api.perform({role:'owner',action:'attendance.delete',operatorId:'owner'}));
 await assert.rejects(api.perform({role:'operator',action:'device.status',operatorId:'operator'}),/Insufficient role/);
 assert.deepEqual(calls,[]);
 assert.equal(audit.length,4);
});
test('mutations require explicitly enabled, short-lived, single-use owner approval',async()=>{
 let changes=0;
 const api=createX904ControlPlane({deviceId:'X904A',physicalVerified:true,enableWrites:true,
  adapter:{'users.enroll':async()=>{changes++;return {ok:true}}}});
 await assert.rejects(api.perform({role:'owner',action:'users.enroll',operatorId:'owner'}),/approval/);
 const token=api.requestApproval({role:'owner',action:'users.enroll',operatorId:'owner',reason:'approved enrollment'});
 assert.deepEqual(await api.perform({role:'owner',action:'users.enroll',operatorId:'owner',approvalToken:token}),{ok:true});
 await assert.rejects(api.perform({role:'owner',action:'users.enroll',operatorId:'owner',approvalToken:token}));
 assert.equal(changes,1);
});
