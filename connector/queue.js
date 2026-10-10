import {readFileSync,writeFileSync,renameSync,mkdirSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

// Single-process durable queue. Delivery remains at-least-once: API-side
// idempotency on eventId is required if a crash occurs after acknowledgement.
export function createEventQueue(filename) {
  const path=resolve(filename);
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  let items=[],acknowledged=[];
  try {
    const parsed=JSON.parse(readFileSync(path,'utf8'));
    if(Array.isArray(parsed)) items=parsed; // migration from v1 queue
    else if(parsed && parsed.version===2 && Array.isArray(parsed.pending) && Array.isArray(parsed.acknowledged)) {
      items=parsed.pending;acknowledged=parsed.acknowledged;
    } else throw Error('Invalid queue format');
  }catch(e){if(e.code!=='ENOENT')throw e}
  const valid=e=>e && typeof e.eventId==='string' && e.eventId.length>0 &&
    typeof e.code==='string' && ['checkin','checkout'].includes(e.mode);
  if(items.length>10000 || items.some(e=>!valid(e)) ||
     acknowledged.length>10000 || acknowledged.some(id=>typeof id!=='string'||!id) ||
     new Set(items.map(e=>e.eventId)).size!==items.length)throw Error('Invalid queue');
  const ackSet=new Set(acknowledged);
  function save() {
    const temp=path+'.tmp';
    const fd=openSync(temp,'w',0o600);
    try {writeFileSync(fd,JSON.stringify({version:2,pending:items,acknowledged}));fsyncSync(fd)}
    finally {closeSync(fd)}
    renameSync(temp,path);
  }
  return {
    add(event) {
      if(!valid(event))throw Error('Invalid event');
      if(ackSet.has(event.eventId)||items.some(e=>e.eventId===event.eventId))return false;
      if(items.length>=10000)throw Error('Connector queue capacity exceeded');
      items.push(event);
      try {save()} catch(error){items.pop();throw error}
      return true;
    },
    async flush(send) {
      let sent=0;
      for(const event of [...items]) {
        try {await send(event)}catch {break}
        // A remote acknowledgement is authoritative. Keep the most recent IDs
        // to suppress re-poll duplicates after restart.
        const previousAck=[...acknowledged];
        const previousItems=items;
        if(!ackSet.has(event.eventId)) {
          acknowledged.push(event.eventId);ackSet.add(event.eventId);
          if(acknowledged.length>10000)ackSet.delete(acknowledged.shift());
        }
        items=items.filter(e=>e.eventId!==event.eventId);
        try {save()}catch(error){items=previousItems;acknowledged=previousAck;ackSet.clear();for(const id of acknowledged)ackSet.add(id);throw error}
        sent++;
      }
      return {sent,pending:items.length};
    },
    count:()=>items.length
  };
}
