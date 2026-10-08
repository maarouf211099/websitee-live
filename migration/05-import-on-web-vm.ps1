# Mersal -> Azure | Step 5: restore the sites on the Azure web VM (run as Administrator ON THE NEW VM)
# Expects the export from step 4 downloaded to C:\Temp\mersal-export
param(
  [string]$Src = "C:\Temp\mersal-export",
  [Parameter(Mandatory)] [string]$NewDbHost,        # private IP of vm-mersal-db, e.g. 10.20.2.4
  [Parameter(Mandatory)] [string]$NewWebPublicIp    # replaces 35.188.232.237 in configs (SignalR etc.)
)
$ErrorActionPreference = "Stop"
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"

robocopy "$Src\Data" C:\Data /E /COPY:DAT /R:1 /W:1 /MT:16 /NP /LOG:C:\Temp\robocopy-import.log

# Replace the stock site/pool, then import the old definitions
& $appcmd delete site "Default Web Site" 2>$null
[xml]$pools = Get-Content "$Src\iis\apppools.xml"
foreach ($p in $pools.appcmd.APPPOOL) {
  & $appcmd delete apppool $p.'APPPOOL.NAME' 2>$null | Out-Null
}
Get-Content "$Src\iis\apppools.xml" -Raw | & $appcmd add apppool /in
# Old bindings may be tied to the GCP server's own IPs - bind to all addresses instead
(Get-Content "$Src\iis\sites.xml" -Raw) -replace 'bindingInformation="[0-9.]+:', 'bindingInformation="*:' | & $appcmd add site /in

# Point every config at the new DB and new public IP. Passwords are NOT changed here -
# put the NEW (rotated) sa/app password in by hand afterwards (see plan, step 8).
$files = Get-ChildItem C:\Data -Recurse -Include Web.config, *.dll.config -ErrorAction SilentlyContinue
foreach ($f in $files) {
  $c = [IO.File]::ReadAllText($f.FullName)
  # "Data Source=35.188.232.237" is a DB address, every other 35.188.232.237 is the web server
  $n = $c -replace '10\.128\.0\.14', $NewDbHost -replace 'Data Source=35\.188\.232\.237', "Data Source=$NewDbHost" -replace '35\.188\.232\.237', $NewWebPublicIp
  if ($n -ne $c) { Copy-Item $f.FullName "$($f.FullName).pre-azure" ; [IO.File]::WriteAllText($f.FullName, $n, (New-Object Text.UTF8Encoding($true))); "updated $($f.FullName)" }
}
iisreset
& $appcmd list site
& $appcmd list app
