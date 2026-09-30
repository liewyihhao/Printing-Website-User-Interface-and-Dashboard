# Restart the always-on Printoka server so it loads new server code: stop server.js only; keep-running.js starts it again.
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -like '*web*server*server.js*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; Write-Output ('stopped server.js pid ' + $_.ProcessId) }
Start-Sleep -Seconds 5
try { Write-Output ('health: HTTP ' + (Invoke-WebRequest -UseBasicParsing http://localhost:4611/api/health).StatusCode) } catch { Write-Output 'server not up yet' }
