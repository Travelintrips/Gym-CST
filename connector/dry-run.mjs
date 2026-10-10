import {createConnector} from './runner.js';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Offline-only demonstration: no socket, hardware, API, or WA access.
const dir=mkdtempSync(join(tmpdir(),'gym-x904-dry-run-'));
try{
 const captured=[];
 const connector=createConnector({
   queueFile:join(dir,'events.json'),deviceId:'X904_TEST',
   readEvents:async()=>[{recordId:'demo-1',userId:'MEMBER-DEMO',mode:'checkin'}],
   apiUrl:'https://example.invalid',apiKey:'DRY_RUN_ONLY',
   submit:async event=>{captured.push(event);return {ok:true}}
 });
 const report=await connector.cycle();
 if(report.captured!==1||report.sent!==1||captured[0]?.eventId!=='X904_TEST:demo-1')throw Error('Dry-run failed');
 process.stdout.write('PASS: offline connector dry-run (no device or network access)\n');
}finally{rmSync(dir,{recursive:true,force:true})}
