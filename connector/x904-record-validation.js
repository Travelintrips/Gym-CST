// Offline validation of X904 attendance records. No device access.
// An operator must verify record identifiers and direction mapping from actual hardware.
export function validateX904Records(records,{directionMap={}}={}) {
  if(!Array.isArray(records))throw new Error('Expected records array');
  const accepted=[],rejected=[];
  for(let index=0;index<records.length;index++){
    const record=records[index];
    if(!record||typeof record!=='object'||Array.isArray(record)){rejected.push({index,reason:'invalid_record'});continue}
    const id=record.recordId??record.eventId;
    const user=record.userId;
    const rawDirection=String(record.status??record.mode??'');
    const direction=directionMap[rawDirection];
    if(id===undefined||id===null||!/^[A-Za-z0-9_.:-]{1,100}$/.test(String(id))){rejected.push({index,reason:'missing_stable_record_id'});continue}
    if(user===undefined||user===null||!/^[A-Za-z0-9_-]{1,50}$/.test(String(user))){rejected.push({index,reason:'invalid_member_id'});continue}
    if(!['checkin','checkout'].includes(direction)){rejected.push({index,reason:'unknown_direction'});continue}
    accepted.push({recordId:String(id),userId:String(user),mode:direction});
  }
  return {accepted,rejected};
}
