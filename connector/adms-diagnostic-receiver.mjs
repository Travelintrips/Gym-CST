import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {classifyAdmsRequest,parseStagingAttendance} from './adms-protocol.mjs';

// Experimental ADMS diagnostic receiver. Isolated loopback, synthetic tests only.
// Never deploy exposed to an actual X904 until its protocol, authentication,
// response/ACK semantics, TLS reverse proxy, and vendor firmware are verified.
export function createAdmsDiagnosticServer({token=process.env.GYM_ADMS_DIAGNOSTIC_TOKEN||'',host='127.0.0.1',port=0}={}) {
 if(!['127.0.0.1','::1'].includes(host))throw Error('Diagnostic ADMS receiver must be bound to loopback only');
 if(token.length<32)throw Error('GYM_ADMS_DIAGNOSTIC_TOKEN must be at least 32 characters');
 const server=http.createServer(async(req,res)=>{
  const reply=(status,body)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body))};
  const auth=String(req.headers['x-gym-diagnostic-token']||'');
  if(auth.length!==token.length||!timingSafeEqual(Buffer.from(auth),Buffer.from(token)))return reply(401,{ok:false,error:'unauthorized'});
  const url=new URL(req.url,'http://localhost');
  const contentLengthRaw=req.headers['content-length'];
  const contentLength=contentLengthRaw===undefined?0:Number(contentLengthRaw);
  if(contentLengthRaw!==undefined&&(!Number.isSafeInteger(contentLength)||contentLength<0))return reply(400,{ok:false,error:'invalid_content_length'});
  const verdict=classifyAdmsRequest({method:req.method,path:url.pathname,table:url.searchParams.get('table'),bodyBytes:contentLength});
  if(!verdict.accept)return reply(422,{ok:false,error:'unsupported_adms_request'});
  if(verdict.category!=='attendance-staging-only')return reply(200,{ok:true,mode:'diagnostic-only',commands:[]});
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>32768)return reply(413,{ok:false,error:'payload_too_large'});chunks.push(chunk)}
  const raw=Buffer.concat(chunks).toString('utf8');
  // Deliberately do not ACK a physical attendance upload, persist raw data,
  // parse identities, or push anything to Sport Center.
  const staged=parseStagingAttendance(raw);
  return reply(422,{ok:false,error:'attendance_format_unverified',needsFirmwareFixture:staged.needsFirmwareFixture});
 });
 return {server,listen:()=>new Promise(resolve=>server.listen(port,host,()=>resolve(server.address())))};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 console.error('Diagnostic receiver is library-only; use tests. Physical ADMS activation is not authorized.');
 process.exitCode=2;
}
