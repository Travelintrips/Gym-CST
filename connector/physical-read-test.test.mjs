import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('X904 physical reader is off by default and never opens a socket',()=>{
 const run=spawnSync(process.execPath,['connector/physical-read-test.mjs'],{
  env:{...process.env,X904_READ_TEST_APPROVED:''},encoding:'utf8',timeout:5000
 });
 assert.equal(run.status,2);
 assert.match(run.stderr,/Physical read blocked/);
 assert.doesNotMatch(run.stdout,/deviceContacted/);
});
