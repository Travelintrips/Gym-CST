import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAttlog} from './adms-ingest.mjs';

test('parses attendance-only row with stable dedupe ID', () => {
  const input='0001\t2026-10-12 12:34:56\t0\t1\t0\n';
  const a=parseAttlog(input,'X904TEST'), b=parseAttlog(input,'X904TEST');
  assert.equal(a.length,1);
  assert.equal(a[0].pin,'0001');
  assert.equal(a[0].deviceTime,'2026-10-12 12:34:56');
  assert.equal(a[0].id,b[0].id);
  assert.equal(a[0].status,0);
});
test('rejects unsupported biometric content and malformed date', () => {
  assert.throws(()=>parseAttlog('FPDATA\tBASE64','X904TEST'));
  assert.throws(()=>parseAttlog('0001 2026-02-31 12:34:56 0 1','X904TEST'));
});
test('rejects oversized batches and invalid serial', () => {
  assert.throws(()=>parseAttlog('0001 2026-10-12 12:34:56 0 1\n'.repeat(501),'X904TEST'));
  assert.throws(()=>parseAttlog('0001 2026-10-12 12:34:56 0 1','/'));
});
