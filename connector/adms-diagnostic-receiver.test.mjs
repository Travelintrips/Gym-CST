import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdmsDiagnosticServer} from './adms-diagnostic-receiver.mjs';
test('ADMS diagnostic rejects anonymous and never accepts attendance as imported',async()=>{
 const instance=createAdmsDiagnosticServer({token:'S'.repeat(40)});
 const address=await instance.listen();const base='http://127.0.0.1:'+address.port;
 try {
  const noAuth=await fetch(base+'/iclock/getrequest');assert.equal(noAuth.status,401);
  const headers={'x-gym-diagnostic-token':'S'.repeat(40)};
  let res=await fetch(base+'/iclock/getrequest',{headers});assert.equal(res.status,200);
  assert.deepEqual((await res.json()).commands,[]);
  res=await fetch(base+'/iclock/cdata?table=USER',{method:'POST',headers,body:'test'});assert.equal(res.status,422);
  res=await fetch(base+'/iclock/cdata?table=ATTLOG',{method:'POST',headers,body:'sample'});assert.equal(res.status,422);
  assert.equal((await res.json()).error,'attendance_format_unverified');
  res=await fetch(base+'/iclock/cdata?table=ATTLOG',{method:'POST',headers,body:'x'.repeat(32769)});assert.equal(res.status,422);
  res=await fetch(base+'/iclock/cdata?table=ATTLOG',{method:'POST',headers,body:'z'.repeat(32768)});assert.equal(res.status,422);
  assert.equal((await res.json()).error,'attendance_format_unverified');
 }finally{await new Promise(resolve=>instance.server.close(resolve))}
});
