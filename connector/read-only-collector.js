// Fail-closed safety gate for X904 collector selection.
// Only a separately audited read-only collector may be invoked.
// Never expose the general node-zklib object to a polling runtime.
export function createReadOnlyCollector({readAttendance,sourceId,approved=false}) {
  if (!approved) throw new Error('X904 physical read not approved');
  if (!/^[A-Za-z0-9_-]{2,60}$/.test(sourceId||'')) throw new Error('Invalid device identifier');
  if (typeof readAttendance !== 'function') throw new Error('Audited reader is required');
  return Object.freeze({
    async read() {
      const result=await readAttendance();
      if(!Array.isArray(result)) throw new Error('Reader must return an array');
      return result.map(record=>{
        if(!record || typeof record!=='object')throw new Error('Invalid attendance record');
        return Object.freeze({
          recordId: String(record.recordId??''),
          userId: String(record.userId??''),
          mode: String(record.mode??'')
        });
      });
    }
  });
}
