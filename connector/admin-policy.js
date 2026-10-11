// X904 administration policy boundary; intentionally no physical device commands.
// Full access is not enabled until firmware compatibility, operator roles and UAT.
export const CAPABILITIES=Object.freeze({
  viewer:Object.freeze(['device.status','attendance.view']),
  operator:Object.freeze(['device.status','attendance.view','attendance.sync']),
  owner:Object.freeze(['device.status','attendance.view','attendance.sync','users.view','device.settings.view'])
});
const BLOCKED=new Set(['attendance.delete','users.enroll','users.delete','biometric.read','biometric.write','device.settings.write','device.reset','device.disable','device.command']);
export function authorizeX904({role,action,deviceId,approved=false,reason='',audit=()=>{}}) {
 const allowed=approved===true && /^[A-Za-z0-9_-]{2,60}$/.test(deviceId||'') &&
   Object.hasOwn(CAPABILITIES,role) && CAPABILITIES[role].includes(action) && !BLOCKED.has(action);
 audit({deviceId:String(deviceId??''),role:String(role??''),action:String(action??''),allowed,reason:String(reason??'').slice(0,180)});
 if(!allowed)throw new Error('X904 operation not authorized');
 return Object.freeze({action,deviceId});
}
