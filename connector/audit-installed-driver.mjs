// Offline-only safety audit for installed node-zklib (does not connect to X904).
// Fail closed if the installed attendance method differs from the reviewed shape.
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
const require=createRequire(import.meta.url);
try{
 const metaPath=require.resolve('node-zklib/package.json');
 const meta=JSON.parse(readFileSync(metaPath,'utf8'));
 const tcpPath=join(dirname(metaPath),'zklibtcp.js');
 const src=readFileSync(tcpPath,'utf8');
 const start=src.indexOf('async getAttendances(');
 const end=src.indexOf('\n  async ',start+10);
 if(start<0||end<0)throw Error('Cannot isolate installed attendance method');
 const method=src.slice(start,end);
 const forbidden=['clearAttendanceLog','disableDevice','enableDevice','CMD_CLEAR_ATTLOG','CMD_DISABLEDEVICE','CMD_ENABLEDEVICE'];
 const found=forbidden.filter(x=>method.includes(x));
 const expected=['readWithBuffer','GET_ATTENDANCE_LOGS','freeData'];
 const missing=expected.filter(x=>!method.includes(x));
 console.log(JSON.stringify({package:'node-zklib',version:meta.version,methodFound:true,forbiddenCalls:found,missingExpectedCalls:missing,usesFreeData:method.includes('freeData'),hardwareAccess:false},null,2));
 if(found.length||missing.length)process.exitCode=2;
} catch(error){console.error('Offline audit failed:',error.message);process.exitCode=1}
