// Diagnostic-only X904 protocol probe. Never reads biometric templates or attendance logs.
// Does not enroll, modify device settings, clear logs, or install remote access.
import ZKLib from 'node-zklib';

function explain(error) {
  if (error instanceof Error) {
    return {name:error.name,message:error.message || '(empty message)',code:error.code ?? null,cause:error.cause ? String(error.cause) : null};
  }
  if (error && typeof error === 'object') {
    const details={};
    for (const key of ['name','message','code','errno','type','status']) {
      if (error[key] !== undefined) details[key]=String(error[key]);
    }
    return Object.keys(details).length ? details : {kind:'non-standard object',keys:Object.keys(error).slice(0,12)};
  }
  return {kind:typeof error,value:String(error)};
}

const ip='192.168.100.185';
const port=4370;
const zk=new ZKLib(ip,port,10000,4000);
let opened=false;
try {
  console.log('X904 diagnostic: attempting session with allowlisted device '+ip+':'+port);
  await zk.createSocket();
  opened=true;
  console.log('X904 diagnostic: protocol session established');
  const info=await zk.getInfo();
  console.log(JSON.stringify({protocolInfoReceived:true,deviceInfo:info},null,2));
} catch (error) {
  console.error('X904 diagnostic failed:',JSON.stringify(explain(error)));
  console.error('Transport reachability alone does not confirm X904 protocol compatibility.');
  process.exitCode=1;
} finally {
  if(opened) {
    try {await zk.disconnect();console.log('X904 diagnostic: session closed');}
    catch(error){console.error('X904 disconnect warning:',JSON.stringify(explain(error)));process.exitCode=1}
  }
}
