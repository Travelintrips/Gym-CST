// Diagnostic-only X904 protocol probe. Reads device clock only; no attendance records or biometric templates.
// Does not enroll, modify device settings, clear logs, or install remote access.
import ZKLib from 'node-zklib';

export function classifyX904Error(error) {
  const nested=error?.err??error;
  if(nested?.code==='ERR_OUT_OF_RANGE' || nested?.name==='RangeError')return 'DEVICE_RESPONSE_PARSE_ERROR: node-zklib received a packet shorter or differently formatted than expected. Stop device probes until protocol compatibility is verified.';
  if(nested?.code==='ETIMEDOUT')return 'NETWORK_TIMEOUT: X904 did not respond before timeout.';
  return 'UNKNOWN_DEVICE_ERROR: inspect the structured diagnostic; do not change device configuration.';
}

function explain(error) {
  if (error instanceof Error) {
    return {name:error.name,message:error.message || '(empty message)',code:error.code ?? null,cause:error.cause ? String(error.cause) : null};
  }
  if (error && typeof error === 'object') {
    const details={};
    for (const key of ['name','message','code','errno','type','status','command']) {
      if (error[key] !== undefined) details[key]=String(error[key]);
    }
    if (error.err !== undefined) {
      const nested=error.err;
      details.err=nested instanceof Error
        ? {name:nested.name,message:nested.message,code:nested.code??null}
        : (typeof nested==='string'||typeof nested==='number') ? String(nested)
        : (nested && typeof nested==='object')
          ? Object.fromEntries(['name','message','code','errno'].filter(k=>nested[k]!==undefined).map(k=>[k,String(nested[k])]))
          : String(nested);
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
  // Read device time only. getInfo() assumes a long fixed-size status payload
  // and raises ERR_OUT_OF_RANGE on the shorter response seen on this X904.
  const deviceTime=await zk.getTime();
  if (!(deviceTime instanceof Date) || Number.isNaN(deviceTime.getTime())) throw new Error('Invalid device clock response');
  console.log(JSON.stringify({protocolTimeRead:true,deviceTime:deviceTime.toISOString()},null,2));
} catch (error) {
  console.error('X904 diagnostic failed:',JSON.stringify(explain(error)));
  console.error('X904 diagnosis:',classifyX904Error(error));
  console.error('Transport reachability alone does not confirm X904 protocol compatibility.');
  process.exitCode=1;
} finally {
  if(opened) {
    try {await zk.disconnect();console.log('X904 diagnostic: session closed');}
    catch(error){console.error('X904 disconnect warning:',JSON.stringify(explain(error)));process.exitCode=1}
  }
}
