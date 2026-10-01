# Mersal → Azure | Step 1: inventory of the current server (INSTANCE-9)
# READ-ONLY. Run as Administrator on INSTANCE-9:  .\01-inventory.ps1
# Output: C:\Temp\mersal-inventory\  (send the folder back — it contains no passwords,
#         connection strings are masked)
$ErrorActionPreference = "Continue"
$out = "C:\Temp\mersal-inventory"
New-Item -ItemType Directory $out -Force | Out-Null
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"

"== OS / .NET ==" | Out-File "$out\system.txt"
Get-ComputerInfo -Property OsName, OsVersion, CsTotalPhysicalMemory, CsNumberOfLogicalProcessors |
  Format-List | Out-File "$out\system.txt" -Append
$rel = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" -ErrorAction SilentlyContinue).Release
".NET 4 release key: $rel  (528040+ = 4.8)" | Out-File "$out\system.txt" -Append
Get-WindowsFeature | Where-Object Installed | Select-Object Name |
  Out-File "$out\windows-features.txt"

"== IIS ==" | Out-Null
& $appcmd list site    | Out-File "$out\iis-sites.txt"
& $appcmd list app     | Out-File "$out\iis-apps.txt"
& $appcmd list apppool | Out-File "$out\iis-apppools.txt"
& $appcmd list vdir    | Out-File "$out\iis-vdirs.txt"
& $appcmd list site    /config /xml | Out-File "$out\iis-sites.xml"    -Encoding UTF8
& $appcmd list apppool /config /xml | Out-File "$out\iis-apppools.xml" -Encoding UTF8
Get-ChildItem "$env:ProgramFiles\IIS" -ErrorAction SilentlyContinue | Select-Object Name |
  Out-File "$out\iis-modules.txt"     # URL Rewrite, ARR, etc.
netsh http show sslcert | Out-File "$out\ssl-bindings.txt"
Get-ChildItem Cert:\LocalMachine\My | Select-Object Subject, NotAfter, Thumbprint, HasPrivateKey |
  Format-Table -AutoSize | Out-File "$out\certificates.txt"

# Every physical path used by IIS, and its real size.
# robocopy /L /XJ only lists (copies nothing) and skips junctions, so the
# self-nesting folders cannot loop forever.
$paths = (& $appcmd list vdir /text:physicalPath) | ForEach-Object { [Environment]::ExpandEnvironmentVariables($_) } | Sort-Object -Unique
"Path`tSizeGB`tFiles" | Out-File "$out\folder-sizes.tsv"
foreach ($p in $paths + @("C:\Data")) {
  if (-not (Test-Path $p)) { continue }
  $r = robocopy $p NUL /L /E /XJ /NFL /NDL /NJH /BYTES /R:0 /W:0 2>$null
  $bytes = (($r | Select-String "Bytes :") -split "\s+")[3]
  $files = (($r | Select-String "Files :") -split "\s+")[3]
  "$p`t$([math]::Round([double]$bytes/1GB,2))`t$files" | Out-File "$out\folder-sizes.tsv" -Append
}
Get-ChildItem C:\Data -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  $_.FullName + "`t" + $_.Attributes } | Out-File "$out\data-top-level.txt"
# Junctions/symlinks (the 405 GB "infinite nesting" is usually one of these)
Get-ChildItem C:\Data, C:\Users -Recurse -Depth 4 -Attributes ReparsePoint -ErrorAction SilentlyContinue |
  Select-Object FullName, LinkType, Target | Format-Table -AutoSize -Wrap | Out-File "$out\reparse-points.txt"

# Config keys that point to hosts/IPs (values masked when they look like secrets)
Get-ChildItem C:\Data -Recurse -Include Web.config, *.dll.config -Depth 3 -ErrorAction SilentlyContinue | ForEach-Object {
  "### " + $_.FullName
  (Get-Content $_.FullName -Raw) -replace '(?i)(password|pwd|secret)\s*=\s*[^;"]*', '$1=***' -replace '(?i)(Password|Secret[A-Z]*)" value="[^"]*"', '$1" value="***"' |
    Select-String -Pattern 'connectionString|BaseUrl|Url"|URL"|35\.188|10\.128|smtp|host=' -AllMatches | ForEach-Object { $_.Line.Trim() }
} | Out-File "$out\config-endpoints.txt"

# Scheduled tasks and Windows services that are not Microsoft's
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike "\Microsoft\*" } |
  Select-Object TaskName, TaskPath, State, @{n="Action";e={$_.Actions.Execute + " " + $_.Actions.Arguments}} |
  Format-Table -AutoSize -Wrap | Out-File "$out\scheduled-tasks.txt"
Get-CimInstance Win32_Service | Where-Object { $_.PathName -notmatch 'Windows\\|Microsoft' } |
  Select-Object Name, State, StartMode, PathName | Format-Table -AutoSize -Wrap | Out-File "$out\services.txt"

# Databases on the SQL server (Windows auth if allowed, else set $env:SQLCMDPASSWORD and -U sa)
$q = "SET NOCOUNT ON; SELECT d.name, d.compatibility_level, d.recovery_model_desc, CAST(SUM(f.size)*8/1024.0/1024 AS decimal(10,2)) AS SizeGB FROM sys.databases d JOIN sys.master_files f ON f.database_id=d.database_id GROUP BY d.name,d.compatibility_level,d.recovery_model_desc ORDER BY SizeGB DESC; SELECT @@VERSION;"
if (Get-Command sqlcmd -ErrorAction SilentlyContinue) {
  sqlcmd -S 10.128.0.14 -E -Q $q -W 2>&1 | Out-File "$out\databases.txt"
} else { "sqlcmd not found — run the query in SSMS and save as databases.txt:`n$q" | Out-File "$out\databases.txt" }

Write-Host "Inventory written to $out" -ForegroundColor Green
