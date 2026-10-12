// Offline ADMS protocol classifier. No network, no X904 connection, no credentials.
// Never ACK unknown tables or enrollment/biometric payloads as successfully imported.
export function classifyAdmsRequest({method,path,table,bodyBytes=0}={}) {
  if (!['GET','POST'].includes(method)) return {accept:false,reason:'method'};
  if (!Number.isSafeInteger(bodyBytes)||bodyBytes<0||bodyBytes>32768) return {accept:false,reason:'size'};
  if (path==='/iclock/getrequest'&&method==='GET')return {accept:true,category:'poll',outboundCommands:false};
  if (path==='/iclock/cdata'&&method==='GET')return {accept:true,category:'handshake'};
  if (path==='/iclock/cdata'&&method==='POST'&&String(table).toUpperCase()==='ATTLOG')return {accept:true,category:'attendance-staging-only'};
  return {accept:false,reason:'unsupported-payload'};
}
export function parseStagingAttendance(body) {
  if(typeof body!=='string'||body.length>32768)throw Error('invalid staging payload');
  // Actual X904 wire format must be captured and reviewed before live parsing.
  // Never infer IN/OUT or create check-in records from an unvalidated field order.
  return {accepted:false,needsFirmwareFixture:true,recordCountHint:body.split(/\\r?\\n/).filter(Boolean).length};
}
