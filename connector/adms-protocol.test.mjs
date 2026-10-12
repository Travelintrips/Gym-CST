import assert from 'node:assert/strict';
import {classifyAdmsRequest,parseStagingAttendance} from './adms-protocol.mjs';
assert.equal(classifyAdmsRequest({method:'GET',path:'/iclock/cdata'}).category,'handshake');
assert.equal(classifyAdmsRequest({method:'GET',path:'/iclock/getrequest'}).outboundCommands,false);
assert.equal(classifyAdmsRequest({method:'POST',path:'/iclock/cdata',table:'ATTLOG',bodyBytes:100}).category,'attendance-staging-only');
for(const table of ['USER','OPERLOG','BIODATA','BIOPHOTO','PHOTO']) assert.equal(classifyAdmsRequest({method:'POST',path:'/iclock/cdata',table}).accept,false);
assert.equal(classifyAdmsRequest({method:'POST',path:'/iclock/cdata',table:'ATTLOG',bodyBytes:100000}).accept,false);
assert.equal(parseStagingAttendance('1\\t2026-10-12 12:00:00\\t0').accepted,false);
console.log('PASS offline ADMS classification: no device commands; no biometric import; no attendance writes');
