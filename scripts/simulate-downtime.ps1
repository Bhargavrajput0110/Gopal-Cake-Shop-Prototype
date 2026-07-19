Start-Process "npx" -ArgumentList "tsx scripts/rc1-recovery.ts" -NoNewWindow
Start-Sleep -Seconds 4
Write-Host "Killing Next.js server..."
Stop-Process -Name "node" -Force
Start-Sleep -Seconds 2
Write-Host "Restarting Next.js server..."
Start-Process "npm" -ArgumentList "run dev" -NoNewWindow
Start-Sleep -Seconds 8
