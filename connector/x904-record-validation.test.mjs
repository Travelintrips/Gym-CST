import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateX904Records} from './x904-record-validation.js';
test('X904 mapper blocks unknown status values and private fields',()=>{
 const result=validateX904Records([
  {recordId:'101',userId:'M100',status:0,fingerprint:'private',password:'private'},
  {recordId:'102',userId:'M200',status:1},
  {recordId:'103',userId:'M300',status:7},
  {userId:'M400',status:0}
 ],{directionMap:{'0':'checkin','1':'checkout'}});
 assert.deepEqual(result.accepted,[{recordId:'101',userId:'M100',mode:'checkin'},{recordId:'102',userId:'M200',mode:'checkout'}]);
 assert.deepEqual(result.rejected,[{index:2,reason:'unknown_direction'},{index:3,reason:'missing_stable_record_id'}]);
});
test('no unapproved implicit directions',()=>{
 const result=validateX904Records([{recordId:'1',userId:'M1',mode:'checkin'}]);
 assert.equal(result.accepted.length,0);assert.equal(result.rejected[0].reason,'unknown_direction');
});
