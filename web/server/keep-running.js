/*
 * Keep the Printoka dev server running on its own, outside any Claude / preview session (user, 2026-09-30).
 * Starts web/server/server.js and starts it again a few seconds after it stops for any reason
 * (a crash, a restart after a code change). Output goes to web/server/server.log.
 *
 * Start (hidden, keeps running after the session goes idle):
 *   powershell -Command "Start-Process node -ArgumentList 'web/server/keep-running.js' -WindowStyle Hidden -WorkingDirectory '<repo folder>'"
 * Restart the server after changing server code: stop the running server.js process — this wrapper starts it again:
 *   powershell -File web/server/restart-server.ps1
 * Stop everything: stop the node process running keep-running.js (see web/server/stop-server.ps1).
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SERVER = path.join(__dirname, 'server.js');
const LOG = path.join(__dirname, 'server.log');
const log = s => fs.appendFileSync(LOG, '[' + new Date().toISOString() + '] ' + s + '\n');

function start() {
  const out = fs.openSync(LOG, 'a');
  const child = spawn(process.execPath, [SERVER], { cwd: path.join(__dirname, '..', '..'), stdio: ['ignore', out, out], windowsHide: true });
  log('server started (pid ' + child.pid + ')');
  child.on('exit', (code, sig) => {
    log('server stopped (code ' + code + (sig ? ', ' + sig : '') + ') - starting again in 3 s');
    setTimeout(start, 3000);
  });
}
fs.writeFileSync(path.join(__dirname, 'keep-running.pid'), String(process.pid));
log('keep-running started (pid ' + process.pid + ')');
start();
