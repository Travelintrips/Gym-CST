// Read-only protocol probe. No enroll, delete, clear or biometric template operations.
import ZKLib from 'node-zklib';
const ip=process.env.X904_IP||'192.168.100.185';
const port=Number(process.env.X904_PORT||4370);
const zk=new ZKLib(ip,port,10000,4000);
try {
  await zk.createSocket();
  // Preflight a read-only command: some X904 firmware responds with ACK_UNAUTH (2005).
  const { COMMANDS } = await import('node-zklib/constants.js').then(m=>m.default);
  const raw=await zk.zklibTcp.executeCmd(COMMANDS.CMD_GET_FREE_SIZES,'');
  if (Buffer.isBuffer(raw) && raw.length>=2 && raw.readUInt16LE(0)===2005) {
    console.error('X904 rejected local read: CMD_ACK_UNAUTH (2005). Verify the device communication password/SDK authorization; do not brute-force.');
    process.exitCode=2;
  } else if (!Buffer.isBuffer(raw) || raw.length<76) {
    console.error('X904 returned an unsupported getInfo response length. No device settings were changed.');
    process.exitCode=3;
  } else {
  const info={userCounts:raw.readUIntLE(24,4),logCounts:raw.readUIntLE(40,4),logCapacity:raw.readUIntLE(72,4)};
  console.log(JSON.stringify({connected:true,deviceInfo:info},null,2));
  }
} catch(err){console.error('Device protocol probe failed:',err.message);process.exitCode=1}
finally{try{await zk.disconnect()}catch{}}