import {validateX904Records} from './x904-record-validation.js';
import {createConnector} from './runner.js';

// Offline or audited-source bridge. No network listener, hardware driver,
// automatic authorization, or implicit mapping of unknown status codes.
// A future device adapter must be separately audited before passing its read function.
export function createValidatedX904Pipeline({readRawRecords,directionMap,queueFile,deviceId,apiUrl,apiKey,submit,onRejected=()=>{}}) {
  if (typeof readRawRecords!=='function') throw new Error('Validated read function required');
  if (!directionMap || Object.getPrototypeOf(directionMap)!==Object.prototype || !Object.keys(directionMap).length)
    throw new Error('Explicit verified direction map required');
  for (const [key,value] of Object.entries(directionMap)) {
    if (!/^[A-Za-z0-9_-]{1,30}$/.test(key) || !['checkin','checkout'].includes(value))
      throw new Error('Invalid direction map');
  }
  const runner=createConnector({
    queueFile,deviceId,apiUrl,apiKey,submit,
    readEvents:async()=>{
      const {accepted,rejected}=validateX904Records(await readRawRecords(),{directionMap});
      for(const item of rejected)onRejected(item);
      return accepted;
    }
  });
  return Object.freeze({cycle:()=>runner.cycle(),pending:()=>runner.pending()});
}
