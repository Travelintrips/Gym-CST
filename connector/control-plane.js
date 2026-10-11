import {randomBytes,timingSafeEqual} from 'node:crypto';
import {authorizeX904} from './admin-policy.js';

// Owner control-plane for a future audited X904 device adapter.
// NO socket, biometric export, general shell, or arbitrary command access.
const READS=new Set(['device.status','attendance.view','users.view','device.settings.view']);
const WRITES=new Set(['attendance.sync','users.enroll','users.delete','device.settings.write']);
const FORBIDDEN=new Set(['attendance.delete','device.reset','device.disable','biometric.read','biometric.write','device.command']);
export function createX904ControlPlane({deviceId,adapter,audit=()=>{},physicalVerified=false,enableWrites=false}) {
 if(!/^[A-Za-z0-9_-]{2,60}$/.test(deviceId||''))throw Error('Invalid device ID');
 if(!adapter||typeof adapter!=='object')throw Error('Audited adapter required');
 const pending=new Map();
 async function perform({role,action,operatorId,reason='',approvalToken=null,payload={}}) {
   const entry={deviceId,role,action,operatorId:String(operatorId||'').slice(0,90),reason:String(reason).slice(0,180)};
   const supported=READS.has(action)||WRITES.has(action);
   if(!supported||FORBIDDEN.has(action)||!physicalVerified){audit({...entry,outcome:'denied'});throw Error('Hardware action not available or verified')}
   const isWrite=WRITES.has(action);
   if(role!=='owner'&&!(role==='operator'&&action==='attendance.sync')){audit({...entry,outcome:'denied'});throw Error('Insufficient role')}
   if(isWrite&&!enableWrites){audit({...entry,outcome:'denied'});throw Error('Device writes disabled')}
   if(typeof adapter[action]!=='function'){audit({...entry,outcome:'denied'});throw Error('Audited handler unavailable')}
   if(isWrite){
     const request=pending.get(approvalToken);
     pending.delete(approvalToken);
     if(!request||request.action!==action||request.operatorId!==entry.operatorId||request.expires<Date.now()){
       audit({...entry,outcome:'approval_required'});throw Error('Fresh owner approval required');
     }
   }
   // Read approval does not authorize arbitrary commands or access to biometrics.
   authorizeX904({role:role==='operator'?'operator':'owner',action:isWrite?'device.status':action,deviceId,approved:true});
   try{
     const result=await adapter[action](payload);
     audit({...entry,outcome:'completed'});
     return result;
   }catch(error){audit({...entry,outcome:'failed'});throw error}
 }
 function requestApproval({role,action,operatorId,reason}) {
   if(!physicalVerified||!enableWrites||role!=='owner'||!WRITES.has(action)||typeof adapter[action]!=='function')throw Error('Device write unavailable');
   if(!operatorId||!String(reason||'').trim())throw Error('Operator and justification required');
   const token=randomBytes(24).toString('hex');
   pending.set(token,{action,operatorId:String(operatorId).slice(0,90),expires:Date.now()+60000});
   audit({deviceId,action,operatorId:String(operatorId).slice(0,90),outcome:'approval_issued'});
   return token;
 }
 return Object.freeze({perform,requestApproval});
}
