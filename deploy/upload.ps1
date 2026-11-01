# SFTP upload of the hosted app to the Kanzlei webspace (Tobias 2026-11-01).
# First run (or -Einrichten): a dialog asks server, port, user, password, target folder and the site
# address; the server's host key is shown once and pinned. Everything lands in deploy/.local/
# (gitignored); the password only DPAPI-encrypted, readable by this Windows account on this PC.
# Which files go where is decided and checked by deploy/uploadPlan.ts (data: deploy/upload.json).
#
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1              # build, check, upload
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Probelauf   # check + connection test
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Einrichten  # change the access data
[CmdletBinding()]
param(
  [string]$Ziel = 'oeffentlich',
  [switch]$Einrichten,
  [switch]$Probelauf,
  [switch]$OhneBuild
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$localDir = Join-Path $PSScriptRoot '.local'
$configPath = Join-Path $localDir 'sftp.json'
$passwordPath = Join-Path $localDir 'sftp-passwort.dpapi'
$logPath = Join-Path $localDir 'upload-protokoll.txt'
$title = 'Fragebogen – Upload'

function Show-Message([string]$text, [string]$buttons = 'OK', [string]$icon = 'Information') {
  return [System.Windows.Forms.MessageBox]::Show($text, $title, $buttons, $icon)
}

# Native tools write progress to stderr; under 'Stop' Windows PowerShell 5.1 would turn that into an
# exception. Run them with 'Continue' and judge them by their exit code.
function Invoke-Native([scriptblock]$block) {
  $old = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { & $block } finally { $ErrorActionPreference = $old }
}

function Find-Psftp {
  $cmd = Get-Command psftp.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $default = 'C:\Program Files\PuTTY\psftp.exe'
  if (Test-Path $default) { return $default }
  throw 'PuTTY (psftp.exe) wurde nicht gefunden. Bitte PuTTY installieren (https://www.chiark.greenend.org.uk/~sgtatham/putty/).'
}

function Read-Settings {
  if (-not (Test-Path $configPath)) { return $null }
  return Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json
}

function Show-SetupDialog($current) {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Fragebogen – Zugang zum Webspace (SFTP)'
  $form.StartPosition = 'CenterScreen'
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $form.ClientSize = New-Object System.Drawing.Size(560, 400)

  $intro = New-Object System.Windows.Forms.Label
  $intro.Location = New-Object System.Drawing.Point(16, 12)
  $intro.Size = New-Object System.Drawing.Size(528, 60)
  $intro.Text = 'Die Angaben stehen im IONOS-Kundenbereich beim SFTP-Zugang Ihres Hosting-Pakets. ' +
    'Sie werden nur auf diesem PC gespeichert, das Passwort verschlüsselt (nur Ihr Windows-Konto kann es lesen).'
  $form.Controls.Add($intro)

  $rows = @(
    @{ Key = 'server'; Label = 'Server'; Value = '' },
    @{ Key = 'port'; Label = 'Port'; Value = '22' },
    @{ Key = 'benutzer'; Label = 'Benutzer'; Value = '' },
    @{ Key = 'passwort'; Label = 'Passwort'; Value = ''; Secret = $true },
    @{ Key = 'ordner'; Label = 'Zielordner'; Value = '' },
    @{ Key = 'adresse'; Label = 'Adresse der Seite'; Value = '' }
  )
  $boxes = @{}
  $y = 80
  foreach ($row in $rows) {
    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(16, ($y + 3))
    $label.Size = New-Object System.Drawing.Size(150, 24)
    $label.Text = $row.Label
    $form.Controls.Add($label)
    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point(170, $y)
    $box.Size = New-Object System.Drawing.Size(374, 26)
    if ($row.Secret) { $box.UseSystemPasswordChar = $true }
    if ($current -and $row.Key -ne 'passwort' -and $current.($row.Key)) { $box.Text = [string]$current.($row.Key) }
    elseif (-not $row.Secret) { $box.Text = $row.Value }
    $form.Controls.Add($box)
    $boxes[$row.Key] = $box
    $y += 40
  }

  $hint = New-Object System.Windows.Forms.Label
  $hint.Location = New-Object System.Drawing.Point(16, $y)
  $hint.Size = New-Object System.Drawing.Size(528, 44)
  $hint.ForeColor = [System.Drawing.Color]::DimGray
  $hint.Text = 'Zielordner: der Ordner der Subdomain, z. B. /fragebogen. Adresse: https://… – damit prüft das ' +
    'Werkzeug nach dem Upload, ob die Seite genau die hochgeladene Datei ausliefert.'
  if ($current) { $hint.Text += ' Passwort leer lassen = bisheriges behalten.' }
  $form.Controls.Add($hint)

  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'Speichern'
  $ok.Location = New-Object System.Drawing.Point(330, 352)
  $ok.Size = New-Object System.Drawing.Size(100, 32)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok
  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = 'Abbrechen'
  $cancel.Location = New-Object System.Drawing.Point(444, 352)
  $cancel.Size = New-Object System.Drawing.Size(100, 32)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)
  $form.CancelButton = $cancel

  if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { return $null }
  $result = @{}
  foreach ($key in $boxes.Keys) { $result[$key] = $boxes[$key].Text.Trim() }
  $form.Dispose()
  return $result
}

function Test-SetupInput($entry, [bool]$hasPassword) {
  $problems = @()
  if (-not $entry.server) { $problems += 'Server fehlt.' }
  $port = 0
  if (-not [int]::TryParse($entry.port, [ref]$port) -or $port -lt 1 -or $port -gt 65535) { $problems += 'Port muss eine Zahl von 1 bis 65535 sein.' }
  if (-not $entry.benutzer) { $problems += 'Benutzer fehlt.' }
  if (-not $entry.passwort -and -not $hasPassword) { $problems += 'Passwort fehlt.' }
  if ($entry.ordner -match '["\r\n]') { $problems += 'Der Zielordner darf keine Anführungszeichen enthalten.' }
  if ($entry.adresse -and $entry.adresse -notmatch '^https://[^\s"]+$') { $problems += 'Die Adresse muss mit https:// beginnen.' }
  return $problems
}

function Get-HostKeys([string]$server, [int]$port) {
  $scanFile = Join-Path $localDir 'hostkeys.tmp'
  try {
    $scan = Invoke-Native { & ssh-keyscan.exe -p $port -T 15 $server 2>$null }
    if (-not $scan) { throw "Der Server $server (Port $port) antwortet nicht." }
    Set-Content -Path $scanFile -Value $scan -Encoding ascii
    $keys = @()
    foreach ($line in (Invoke-Native { & ssh-keygen.exe -lf $scanFile 2>$null })) {
      # "256 SHA256:abc… host (ED25519)"
      if ($line -match '^\d+\s+(SHA256:\S+)\s.*\((\S+)\)\s*$') {
        $keys += [pscustomobject]@{ Typ = $Matches[2]; Fingerabdruck = $Matches[1] }
      }
    }
    if ($keys.Count -eq 0) { throw 'Der Schlüssel des Servers ließ sich nicht lesen.' }
    return $keys
  } finally {
    Remove-Item -Force $scanFile -ErrorAction SilentlyContinue
  }
}

function Invoke-Setup($current) {
  $hasPassword = Test-Path $passwordPath
  while ($true) {
    $entry = Show-SetupDialog $current
    if (-not $entry) { return $null }
    $problems = Test-SetupInput $entry $hasPassword
    if ($problems.Count -eq 0) { break }
    Show-Message ($problems -join "`n") 'OK' 'Warning' | Out-Null
    $current = [pscustomobject]$entry
  }
  $keys = Get-HostKeys $entry.server ([int]$entry.port)
  $list = ($keys | ForEach-Object { "$($_.Typ)   $($_.Fingerabdruck)" }) -join "`n"
  $answer = Show-Message ("Der Server hat sich mit diesem Schlüssel gemeldet:`n`n$list`n`n" +
    'Vergleichen Sie ihn, wenn möglich, mit der Angabe von IONOS. Mit „Ja“ wird er gemerkt; meldet ' +
    'sich der Server später mit einem anderen Schlüssel, bricht der Upload ab.') 'YesNo' 'Question'
  if ($answer -ne 'Yes') { return $null }

  New-Item -ItemType Directory -Force $localDir | Out-Null
  $settings = [ordered]@{
    server = $entry.server
    port = [int]$entry.port
    benutzer = $entry.benutzer
    ordner = $entry.ordner
    adresse = $entry.adresse.TrimEnd('/')
    hostkeys = @($keys | ForEach-Object { $_.Fingerabdruck })
    eingerichtet = (Get-Date -Format 's')
  }
  $settings | ConvertTo-Json | Set-Content -Encoding UTF8 $configPath
  if ($entry.passwort) {
    $secure = ConvertTo-SecureString $entry.passwort -AsPlainText -Force
    ConvertFrom-SecureString $secure | Set-Content -Encoding ascii $passwordPath
  }
  return Read-Settings
}

# Runs psftp with the decrypted password in a short-lived file (never on a command line).
function Invoke-Psftp($settings, [string]$batch) {
  $psftp = Find-Psftp
  $batchFile = Join-Path $localDir 'batch.tmp'
  $passwordFile = Join-Path $localDir 'pw.tmp'
  $bstr = [IntPtr]::Zero
  $utf8 = New-Object System.Text.UTF8Encoding $false
  try {
    $secure = Get-Content $passwordPath | ConvertTo-SecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    [IO.File]::WriteAllText($passwordFile, [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr), $utf8)
    [IO.File]::WriteAllText($batchFile, $batch, $utf8)
    $psftpArgs = @('-batch', '-P', [string]$settings.port, '-l', $settings.benutzer, '-pwfile', $passwordFile, '-b', $batchFile)
    foreach ($key in $settings.hostkeys) { $psftpArgs += @('-hostkey', $key) }
    $psftpArgs += $settings.server
    $output = Invoke-Native { & $psftp @psftpArgs 2>&1 | ForEach-Object { "$_" } }
    return [pscustomobject]@{ Ok = ($LASTEXITCODE -eq 0); Output = ($output -join "`n") }
  } finally {
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    Remove-Item -Force $passwordFile, $batchFile -ErrorAction SilentlyContinue
  }
}

function Get-Sha256([byte[]]$bytes) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try { return ([BitConverter]::ToString($sha.ComputeHash($bytes)) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

function Write-Log([string]$text) {
  Add-Content -Encoding UTF8 -Path $logPath -Value "$(Get-Date -Format 's')  $text"
}

try {
  $settings = Read-Settings
  if ($Einrichten -or -not $settings -or -not (Test-Path $passwordPath)) {
    $settings = Invoke-Setup $settings
    if (-not $settings) { exit 1 }
    if ($Einrichten) {
      Show-Message 'Zugang gespeichert. Mit -Probelauf lässt sich die Verbindung prüfen, ohne etwas hochzuladen.' | Out-Null
      exit 0
    }
  }

  $spec = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'upload.json') | ConvertFrom-Json
  $target = $spec.targets.$Ziel
  # PowerShell reads „ and “ as quote marks: German quotes only inside single-quoted strings.
  if (-not $target) { throw ('Unbekanntes Ziel „' + $Ziel + '“.') }
  if ($target.build -and -not $OhneBuild -and -not $Probelauf) {
    Write-Host "Baue die App (npm run $($target.build)) …"
    Invoke-Native { & npm.cmd --prefix $root run $target.build }
    if ($LASTEXITCODE -ne 0) { throw "Der Build ist fehlgeschlagen (npm run $($target.build))." }
  }

  $planJson = Invoke-Native { & node.exe (Join-Path $PSScriptRoot 'uploadPlan.ts') $Ziel --remote $settings.ordner 2>$null }
  $plan = ($planJson -join "`n") | ConvertFrom-Json
  if (-not $plan.ok) { throw ("Nicht hochgeladen:`n" + ($plan.problems -join "`n")) }

  $commit = (Invoke-Native { & git.exe -C $root rev-parse --short HEAD }) -join ''
  $dirty = [bool](Invoke-Native { & git.exe -C $root status --porcelain })
  $fileList = ($plan.files | ForEach-Object { "  $($_.to)  ($([math]::Round($_.bytes / 1KB)) KB, SHA-256 $($_.sha256.Substring(0, 12))…)" }) -join "`n"

  if ($Probelauf) {
    $cd = ($plan.batch -split "`n") | Where-Object { $_ -like 'cd *' }
    $result = Invoke-Psftp $settings ((@($cd) + 'pwd', 'ls') -join "`n")
    if (-not $result.Ok) { throw "Verbindung fehlgeschlagen:`n$($result.Output)" }
    Write-Host $result.Output
    Show-Message ("Verbindung in Ordnung. Hochgeladen würden nach $($settings.server):$($settings.ordner):`n`n$fileList`n`n" +
      'Der Inhalt des Zielordners steht im Terminal.') | Out-Null
    exit 0
  }

  $warning = if ($dirty) { "`n`nAchtung: Es gibt nicht committete Änderungen – hochgeladen wird der Stand auf der Festplatte." } else { '' }
  $answer = Show-Message ("$($plan.description)`nnach $($settings.server):$($settings.ordner)`nStand $commit$warning`n`n$fileList`n`nJetzt hochladen?") 'YesNo' 'Question'
  if ($answer -ne 'Yes') { exit 1 }

  $result = Invoke-Psftp $settings $plan.batch
  if (-not $result.Ok) {
    Write-Log "FEHLER  Ziel=$Ziel  Stand=$commit  $($result.Output -replace "`n", ' | ')"
    throw "Upload fehlgeschlagen:`n$($result.Output)"
  }

  $checks = @()
  if ($settings.adresse) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    foreach ($file in ($plan.files | Where-Object { $_.verify })) {
      $url = "$($settings.adresse)/$($file.to)?pruefung=$([guid]::NewGuid().ToString('N'))"
      try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'Cache-Control' = 'no-cache' }
        $hosted = Get-Sha256 $response.RawContentStream.ToArray()
        $checks += if ($hosted -eq $file.sha256) { "$($file.to): online identisch" } else { "$($file.to): ABWEICHUNG (online $($hosted.Substring(0, 12))…)" }
      } catch {
        $checks += "$($file.to): Abruf fehlgeschlagen – $($_.Exception.Message)"
      }
    }
  } else {
    $checks += 'Ohne Adresse der Seite keine Prüfung des Ergebnisses (mit -Einrichten nachtragen).'
  }

  Write-Log ("OK  Ziel=$Ziel  Stand=$commit$(if ($dirty) { '+lokal' })  " +
    (($plan.files | ForEach-Object { "$($_.to)=$($_.sha256)" }) -join '  ') + '  ' + ($checks -join '; '))
  $icon = if ($checks -match 'ABWEICHUNG|fehlgeschlagen') { 'Warning' } else { 'Information' }
  Show-Message ("Hochgeladen (Stand $commit):`n`n$fileList`n`n" + ($checks -join "`n")) 'OK' $icon | Out-Null
  exit 0
} catch {
  Show-Message $_.Exception.Message 'OK' 'Error' | Out-Null
  exit 1
}
