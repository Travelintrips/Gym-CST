import http from 'node:http';
import {inspectAdmsRequest,makeCandidateAdmsHandshake} from './adms-wire-candidate.mjs';

// Offline firmware emulation lab only. Never connect to physical X904.
// Return text/plain to exercise proposed iClock wire responses, not JSON.
export function createAdmsWireLab({host='127.0.0.1',port=0,allowedSerial='TEST_1234'}={}) {
 if(host!=='127.0.0.1')throw Error('wire lab must remain loopback');
 if(!/^[A-Za-z0-9_-]{4,64}$/.test(allowedSerial))throw Error('invalid lab serial');
 const server=http.createServer(async(req,res)=>{
  const reply=(status,text)=>{res.writeHead(status,{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(text)};
  let details;
  try{details=inspectAdmsRequest(req.url,req.method)}catch{return reply(400,'INVALID REQUEST\n')}
  if(!details.ok||details.sn!==allowedSerial)return reply(403,'UNKNOWN DEVICE\n');
  if(details.type==='candidate-handshake')return reply(200,makeCandidateAdmsHandshake(details.sn));
  if(details.type==='candidate-poll')return reply(200,'OK\n'); // Candidate only, no device commands.
  if(details.type==='candidate-attlog'){
   // No attendance ACK and no writes until vendor format and durable storage verified.
   req.resume();
   return reply(503,'ATTENDANCE STAGING NOT READY\n');
  }
  return reply(404,'NOT FOUND\n');
 });
 return {server,listen:()=>new Promise(resolve=>server.listen(port,host,()=>resolve(server.address())))};
}
