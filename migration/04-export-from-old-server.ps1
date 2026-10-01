# Mersal → Azure | Step 4: package the sites from INSTANCE-9 (run as Administrator ON THE OLD SERVER)
# Read-only for the live site: it only reads files/config and writes to C:\Temp\mersal-export.
param(
  [string]$Out = "C:\Temp\mersal-export",
  # Folders that are NOT copied with the code (data goes to Blob / is handled separately)
  [string[]]$ExcludeDirs = @("Logger", "ClientFiles", "ActivityImages", "clientfileslayout", "OneDrive - smarttechsys.com", "aspnet_client")
)
$ErrorActionPreference = "Stop"
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
New-Item -ItemType Directory "$Out\Data", "$Out\iis" -Force | Out-Null

# IIS definitions (re-imported on the new VM with appcmd add ... /in)
& $appcmd list apppool /config /xml | Out-File "$Out\iis\apppools.xml" -Encoding UTF8
& $appcmd list site    /config /xml | Out-File "$Out\iis\sites.xml"    -Encoding UTF8

# Code + configs. /XJ skips junctions (stops the infinite nesting), /XD the data folders.
robocopy C:\Data "$Out\Data" /E /XJ /COPY:DAT /R:1 /W:1 /MT:16 /XD $ExcludeDirs /XF *.bak *.log ConfirmOnlineDonationUIfile.txt /NP /LOG:"$Out\robocopy-code.log"

Write-Host "Export done: $Out  (contains secrets in Web.config files — move it only over the private storage account, never e-mail)." -ForegroundColor Yellow
Write-Host "Upload:  azcopy copy '$Out' 'https://<storage>.blob.core.windows.net/migration/?<SAS>' --recursive" -ForegroundColor Cyan
