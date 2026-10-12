import test from 'node:test';import assert from 'node:assert/strict';
import {makeCandidateAdmsHandshake,inspectAdmsRequest} from './adms-wire-candidate.mjs';
test('candidate X904 ADMS wire grammar is explicit and non-commanding',()=>{
 const response=makeCandidateAdmsHandshake('TEST_1234');
 assert.match(response,/^GET OPTION FROM: TEST_1234\n/);
 assert.match(response,/TimeZone=7/);
 assert.doesNotMatch(response,/ATTLOGStamp=|^STAMP=/m);
 assert.doesNotMatch(response,/DATA DELETE|REBOOT|CLEAR|SET TIME|EnrollFP|EnrollFACE/);
 assert.deepEqual(inspectAdmsRequest('/iclock/getrequest?SN=TEST_1234','GET'),{ok:true,type:'candidate-poll',sn:'TEST_1234'});
 assert.equal(inspectAdmsRequest('/iclock/cdata?SN=../../secret&options=all','GET').ok,false);
 assert.equal(inspectAdmsRequest('/iclock/cdata?SN=TEST_1234&table=BIODATA','POST').ok,false);
 assert.throws(()=>makeCandidateAdmsHandshake('bad\nserial'));
});