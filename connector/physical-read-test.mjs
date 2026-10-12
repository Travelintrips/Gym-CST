// Controlled physical read; NEVER executed by CI or started automatically.
// Requires explicit local operator acknowledgment, validated installed driver,
// and manual confirmation that CMD_FREE_DATA is permitted by device vendor.
// Does not change attendance records, but releases protocol transfer buffers.
import ZKLib from 'node-zklib';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const require=createRequire(import.meta.url);
const ip='192.168.100.185',port=4370;
if(process.env.X904_READ_TEST_APPROVED!=='YES-I-APPROVE-BUFFER-READ') {
 console.error('Physical read blocked: require explicit approval of CMD_FREE_DATA semantics.');
 process.exit(2);
}
const pkg=require('node-zklib/package.json');
if(pkg.version!=='1.3.0')throw Error('Unreviewed node-zklib version: '+pkg.version);
const src=readFileSync(join(dirname(require.resolve('node-zklib/package.json')),'zklibtcp.js'),'utf8');
const start=src.indexOf('async getAttendances('),end=src.indexOf('\n  async ',start+10);
if(start<0||end<0)throw Error('Unable to audit installed getAttendances source');
const method=src.slice(start,end);
if(!method.includes('GET_ATTENDANCE_LOGS')||!method.includes('freeData')||
  ['clearAttendanceLog','disableDevice','enableDevice','CMD_CLEAR_ATTLOG','CMD_DISABLEDEVICE','CMD_ENABLEDEVICE'].some(x=>method.includes(x)))throw Error('Unsupported attendance read behavior');
const zk=new ZKLib(ip,port,10000,4000);
let connected=false;
try{
 await zk.createSocket(); connected=true;
 const result=await zk.getAttendances();
 if(!result||!Array.isArray(result.data))throw Error('Unsupported X904 attendance response');
 // No member names, IDs, timestamps, or biometrics printed.
 console.log(JSON.stringify({deviceContacted:true,readOnlyAttendanceCount:result.data.length,hasDriverError:Boolean(result.err),dataExported:false}));
 if(result.err)process.exitCode=1;
}catch(error){
 const e=error?.err??error;
 console.error(JSON.stringify({stage:'readAttendance',errorCode:String(e?.code??'unknown'),errorType:String(e?.name??typeof e),message:String(e?.message??'unavailable').slice(0,180)}));
 process.exitCode=1;
}finally{
 if(connected)try{await zk.disconnect()}catch{process.exitCode=1}
}
