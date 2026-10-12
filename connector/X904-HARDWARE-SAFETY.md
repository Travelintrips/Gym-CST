# X904 hardware read safety gate (2026-10-11)

## Observed on Almano
- X904 address: 192.168.100.185:4370.
- Windows TCP test passed; `node-zklib` opened and disconnected a TCP session.
- `getInfo()` failed with `ERR_OUT_OF_RANGE` when reading offset 24; packet shorter/different than assumed.
- `getTime()` is not available in the **installed** library version, even though newer upstream docs mention it.
- Enumerating API methods succeeded; `getAttendances()` and `getRealTimeLogs()` exist, but have NOT been executed against the machine.

## Upstream source review
The upstream `caobo171/node-zklib` source (`zklibtcp.js`, `getAttendances`) calls `freeData()` **before and after** `readWithBuffer(REQUEST_DATA.GET_ATTENDANCE_LOGS)`. The `freeData` method sends `CMD_FREE_DATA`, which releases the device's transfer buffer. It is not `clearAttendanceLog()`, but does change protocol/device transfer state, and X904 compatibility has not been proven.

Consequently, **DO NOT run `zk.getAttendances()` on X904** until the exact installed npm package version and source are inspected and the specific device behavior is assessed. Never run `clearAttendanceLog()`, `disableDevice()`, `enableDevice()`, enrollment, raw arbitrary `executeCmd`, or `getUsers()` (which may contain passwords/card IDs). Do not upload attendance records or device identifiers to public GitHub or a chat screenshot.

## Next gate
1. On Almano, inspect installed package metadata **without opening a device connection**:
   `node -p "require('node-zklib/package.json').version"`
2. Compare its installed `node_modules/node-zklib/zklibtcp.js` read path against the audited upstream source.
3. Determine X904 firmware protocol, exact log record layouts and pagination. Confirm whether the library issues any device-disable or log-clear calls.
4. Build a local redacted test that reports only counts and protocol errors. Do not expose member identifiers, timestamps or biometric data in stdout.
5. Authorize one physical read test only after the safety review, preferably during low-traffic hours.
6. Keep Windows Almano without Desktop Commander, services, firewall changes or Hostinger integration.

Source reviewed: https://github.com/caobo171/node-zklib/blob/master/zklibtcp.js
