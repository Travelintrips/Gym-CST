// Candidate ZK-compatible ADMS HTTP response encoder for OFFLINE testing only.
// Unverified candidate. Never send this response to live X904 until reviewed.
// Do not advertise synthetic ATTLOGStamp or STAMP cursors: these might skip historical logs.
export function makeCandidateAdmsHandshake(sn) {
 if(typeof sn!=='string'||!/^[A-Za-z0-9_-]{4,64}$/.test(sn))throw Error('invalid device serial');
 return ['GET OPTION FROM: '+sn,'ErrorDelay=60','Delay=30','TransTimes=00:00;23:59','TransInterval=1','TransFlag=TransData AttLog','TimeZone=7','Realtime=1','Encrypt=None'].join('\n')+'\n';
}
export function inspectAdmsRequest(url,method) {
 const u=new URL(url,'https://test.invalid');
 const sn=u.searchParams.get('SN')||'';
 if(!/^[A-Za-z0-9_-]{4,64}$/.test(sn))return {ok:false,error:'invalid_serial'};
 if(method==='GET'&&u.pathname==='/iclock/cdata'&&u.searchParams.get('options')==='all')return {ok:true,type:'candidate-handshake',sn};
 if(method==='GET'&&u.pathname==='/iclock/getrequest')return {ok:true,type:'candidate-poll',sn};
 if(method==='POST'&&u.pathname==='/iclock/cdata'&&u.searchParams.get('table')==='ATTLOG')return {ok:true,type:'candidate-attlog',sn};
 return {ok:false,error:'unsupported_request'};
}
