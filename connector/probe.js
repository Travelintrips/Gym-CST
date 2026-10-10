// Read-only protocol probe. No enroll, delete, clear or biometric template operations.
import ZKLib from 'node-zklib';
const ip=process.env.X904_IP||'192.168.100.185';
const port=Number(process.env.X904_PORT||4370);
const zk=new ZKLib(ip,port,10000,4000);
try {
  await zk.createSocket();
  const info=await zk.getInfo();
  console.log(JSON.stringify({connected:true,deviceInfo:info},null,2));
} catch(err){console.error('Device protocol probe failed:',err.message);process.exitCode=1}
finally{try{await zk.disconnect()}catch{}}