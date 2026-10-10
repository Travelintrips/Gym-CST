import {createEventQueue} from './queue.js';
import {normalizeX904Attendance,submitX904Event} from './adapter.js';

/**
 * A protocol-independent collector. Only explicitly supplied, read-only
 * device events may be accepted. No remote-control surface is opened.
 */
export function createConnector({queueFile,deviceId,apiUrl,apiKey,readEvents,onError=()=>{},queueFactory=createEventQueue,submit=submitX904Event}) {
  if(typeof readEvents!=='function')throw Error('Read-only event source is required');
  if(!/^[A-Za-z0-9_-]{2,60}$/.test(deviceId||''))throw Error('Invalid device ID');
  const queue=queueFactory(queueFile);
  let running=false;
  async function cycle() {
    if(running)return {busy:true};
    running=true;
    try {
      // First replay previously saved events; failures retain the local queue.
      const before=await queue.flush(event=>submit(event,{apiUrl,apiKey}));
      const raw=await readEvents();
      if(!Array.isArray(raw))throw Error('Event source must return an array');
      let captured=0,quarantined=0;
      for(const event of raw) {
        try {
          const normalized=normalizeX904Attendance(event,{deviceId});
          if(queue.add(normalized))captured++;
        }catch(e){quarantined++;onError({reason:String(e.message),eventId:String(event?.recordId??event?.eventId??'unknown')})}
      }
      const after=await queue.flush(event=>submit(event,{apiUrl,apiKey}));
      return {captured,quarantined,sent:before.sent+after.sent,pending:queue.count()};
    }finally{running=false}
  }
  return {cycle,pending:()=>queue.count()};
}
