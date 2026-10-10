import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

// Small durable queue; a single connector process owns this directory.
export function createEventQueue(filename) {
  const path=resolve(filename);
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  let items=[];
  try {items=JSON.parse(readFileSync(path,'utf8'));if(!Array.isArray(items)||items.length>10000||items.some(x=>!x||typeof x.eventId!=='string'||!x.eventId||typeof x.code!=='string'||!['checkin','checkout'].includes(x.mode)))throw Error('Invalid queue')}catch(e){if(e.code!=='ENOENT')throw e}
  function save() {
    const temp=path+'.tmp';
    writeFileSync(temp,JSON.stringify(items),{mode:0o600});
    renameSync(temp,path);
  }
  return {
    add(event) {
      if(!event||typeof event.eventId!=='string'||!event.eventId||!['checkin','checkout'].includes(event.mode)||typeof event.code!=='string')throw Error('Invalid event');
      if(items.some(x=>x.eventId===event.eventId))return false;
      if(items.length>=10000)throw Error('Connector queue capacity exceeded');
      items.push(event);save();return true;
    },
    async flush(send) {
      let sent=0;
      for(const event of [...items]){
        try {await send(event)}catch {break}
        items=items.filter(x=>x.eventId!==event.eventId);save();sent++;
      }
      return {sent,pending:items.length};
    },
    count:()=>items.length
  };
}
