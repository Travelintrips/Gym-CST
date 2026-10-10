// Pure adapter boundary: no connection to a physical device here.
// The connector must authenticate to Gym API via X-Device-Key (not exposed in browser).
export function normalizeX904Attendance(event,{deviceId,timezone='Asia/Jakarta'}={}) {
  if (!event || typeof event!=='object' || Array.isArray(event)) throw new Error('Invalid X904 event');
  if (!deviceId || !/^[a-zA-Z0-9_-]{2,60}$/.test(deviceId)) throw new Error('Invalid device ID');
  const code=String(event.userId??event.uid??event.code??'').trim();
  const rawId=String(event.eventId??event.recordId??'').trim();
  const rawKind=String(event.mode??event.type??'').trim().toLowerCase();
  if (!code || code.length>50) throw new Error('Missing member code');
  if (!rawId || rawId.length>100 || !/^[A-Za-z0-9_.:-]+$/.test(rawId)) throw new Error('Missing stable event ID');
  if (!['checkin','checkout'].includes(rawKind)) throw new Error('Unknown event direction');
  if (timezone!=='Asia/Jakarta') throw new Error('Unsupported timezone');
  // Device-scoped record ID avoids collision across multiple machines.
  return {code,eventId:deviceId+':'+rawId,mode:rawKind};
}
export async function submitX904Event(normalized,{apiUrl,apiKey,fetcher=fetch}={}) {
  if (!apiUrl || !apiKey) throw new Error('Ingest settings missing');
  const endpoint=new URL(apiUrl);
  if(endpoint.protocol!=='https:' && !(endpoint.protocol==='http:' && ['127.0.0.1','localhost'].includes(endpoint.hostname)))throw new Error('Remote Gym API must use HTTPS');
  const response=await fetcher(apiUrl.replace(/\/$/,'')+'/api/device-event',{
    method:'POST',
    headers:{'content-type':'application/json','x-device-key':apiKey},
    body:JSON.stringify(normalized),
    signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Ingest HTTP '+response.status);
  const acknowledgement=await response.json();
  if(!acknowledgement || acknowledgement.ok!==true)throw new Error('Invalid Gym API acknowledgement');
  return acknowledgement;
}
