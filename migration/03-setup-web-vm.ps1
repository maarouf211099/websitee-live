# Mersal → Azure | Step 3: prepare the new web VM (run as Administrator ON THE AZURE WEB VM)
$ErrorActionPreference = "Stop"

# IIS + ASP.NET 4.x + WebSockets (SignalR) + management tools
Install-WindowsFeature Web-Server, Web-Asp-Net45, Web-Net-Ext45, Web-ISAPI-Ext, Web-ISAPI-Filter,
  Web-WebSockets, Web-Http-Redirect, Web-Stat-Compression, Web-Dyn-Compression, Web-Mgmt-Console,
  Web-Mgmt-Service, NET-Framework-45-ASPNET, NET-WCF-HTTP-Activation45 -IncludeManagementTools | Out-Null

$tmp = "C:\Temp\installers"; New-Item -ItemType Directory $tmp -Force | Out-Null
$dl = @{
  "urlrewrite.msi" = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
  "webdeploy.msi"  = "https://download.microsoft.com/download/b/d/8/bd882ec4-12e0-481a-9b32-0fae8e3c0b78/webdeploy_amd64_en-US.msi"
}
foreach ($f in $dl.Keys) {
  Invoke-WebRequest $dl[$f] -OutFile "$tmp\$f" -UseBasicParsing
  Start-Process msiexec.exe -ArgumentList "/i `"$tmp\$f`" /qn ADDLOCAL=ALL" -Wait
}

# Folders that mirror the old server layout, so IIS physical paths stay the same
New-Item -ItemType Directory C:\Data, C:\Backup, C:\Temp -Force | Out-Null

# Until DNS moves, the apps on this VM call each other through https://mersal-ngo.org/...
# Point that name at this VM itself, otherwise they would silently call the OLD server and its DB.
$hosts = "$env:windir\System32\drivers\etc\hosts"
foreach ($h in "mersal-ngo.org", "www.mersal-ngo.org") {
  if (-not (Select-String $hosts -Pattern "\s$([regex]::Escape($h))$" -Quiet)) { Add-Content $hosts "127.0.0.1`t$h" }
}
Write-Host "Web VM ready. Remove the hosts entries only if you ever need to reach the old server by name." -ForegroundColor Green
