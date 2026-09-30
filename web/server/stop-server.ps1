# Stop the always-on Printoka dev server started by keep-running.js (the wrapper first, so it does not restart it).
$pidFile = Join-Path $PSScriptRoot 'keep-running.pid'
if (Test-Path $pidFile) {
  $wrapper = Get-Content $pidFile
  Stop-Process -Id $wrapper -Force -ErrorAction SilentlyContinue
  Remove-Item $pidFile -Force
}
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'web[\\/]server[\\/](server|keep-running)\.js' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Output 'Printoka server stopped.'
