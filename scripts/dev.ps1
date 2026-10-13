# Start DB + API + FE (Windows PowerShell)
$root = "D:\Projects\gf-akuntansi-clone"

Write-Host "1/3 Database..."
docker start indusia-akunting-pg | Out-Null

Write-Host "2/3 API (port 4000)..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c corepack.cmd pnpm --filter @gf/api build && node apps\api\dist\main.js" -WorkingDirectory $root -WindowStyle Minimized

Start-Sleep -Seconds 3
Write-Host "3/3 Web (port 3000)..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c corepack.cmd pnpm --filter @gf/web dev" -WorkingDirectory $root -WindowStyle Minimized

Write-Host "Siap: http://localhost:3000  (API http://localhost:4000/graphql)"
