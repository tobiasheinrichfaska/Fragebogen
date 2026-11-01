# SFTP upload of the hosted app to the Kanzlei webspace (Tobias 2026-11-01).
# First run (or -Einrichten): a dialog asks server, port, user, password, target folder, site address
# and the Kanzlei's IP addresses; the server's host key is shown once and pinned. Everything lands in
# deploy/.local/ (gitignored); the password only DPAPI-encrypted, readable by this Windows account on
# this PC. Which files go where is decided and checked by deploy/uploadPlan.ts (deploy/upload.json).
#
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1                   # public app
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel test        # test folder
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Ziel mehrfachbearbeitung  # Kanzlei build
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Probelauf        # check + connection test
#   powershell -ExecutionPolicy Bypass -File deploy\upload.ps1 -Einrichten       # change the access data
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

# PowerShell reads „ and “ as quote marks: German quotes only inside single-quoted strings.
# Messages come to the front (a hidden topmost owner) and also go to the terminal.
function Show-Message([string]$text, [string]$buttons = 'OK', [string]$icon = 'Information') {
  Write-Host $text
  $owner = New-Object System.Windows.Forms.Form
  $owner.TopMost = $true
  try { return [System.Windows.Forms.MessageBox]::Show($owner, $text, $title, $buttons, $icon) }
  finally { $owner.Dispose() }
}

# "sftp://host:2222/pfad" → host, port and path: only the host name belongs into "Server"; a path
# typed there becomes the target folder when that is empty.
function Split-Server([string]$text) {
  $rest = $text.Trim() -replace '^[a-zA-Z][a-zA-Z0-9+.-]*://', ''
  $path = if ($rest -match '(/.*)$') { $Matches[1].TrimEnd('/') } else { '' }
  $server = $rest -replace '/.*$', ''
  if ($server -match '^([^:]+):(\d{1,5})$') { return @($Matches[1], $Matches[2], $path) }
  return @($server, $null, $path)
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
  $form.TopMost = $true
  $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $form.ClientSize = New-Object System.Drawing.Size(560, 580)

  $intro = New-Object System.Windows.Forms.Label
  $intro.Location = New-Object System.Drawing.Point(16, 12)
  $intro.Size = New-Object System.Drawing.Size(528, 60)
  $intro.Text = 'Die Angaben stehen im IONOS-Kundenbereich beim SFTP-Zugang Ihres Hosting-Pakets. ' +
    'Sie werden nur auf diesem PC gespeichert, das Passwort verschlüsselt (nur Ihr Windows-Konto kann es lesen).'
  $form.Controls.Add($intro)

  $rows = @(
    @{ Key = 'server'; Label = 'Server (nur Name)'; Value = '' },
    @{ Key = 'port'; Label = 'Port'; Value = '22' },
    @{ Key = 'benutzer'; Label = 'Benutzer'; Value = '' },
    @{ Key = 'passwort'; Label = 'Passwort'; Value = ''; Secret = $true },
    @{ Key = 'ordner'; Label = 'Zielordner'; Value = '' },
    @{ Key = 'adresse'; Label = 'Adresse der Seite'; Value = '' },
    @{ Key = 'ips'; Label = 'IP-Adressen der Kanzlei'; Value = '' },
    @{ Key = 'serverpfad'; Label = 'Serverpfad (Tester)'; Value = '' }
  )
  $boxes = @{}
  $y = 80
  foreach ($row in $rows) {
    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(16, ($y + 3))
    $label.Size = New-Object System.Drawing.Size(160, 24)
    $label.Text = $row.Label
    $form.Controls.Add($label)
    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point(180, $y)
    $box.Size = New-Object System.Drawing.Size(364, 26)
    if ($row.Secret) { $box.UseSystemPasswordChar = $true }
    if ($current -and $row.Key -ne 'passwort' -and $current.($row.Key)) { $box.Text = [string]$current.($row.Key) }
    elseif (-not $row.Secret) { $box.Text = $row.Value }
    $form.Controls.Add($box)
    $boxes[$row.Key] = $box
    $y += 40
  }

  $hint = New-Object System.Windows.Forms.Label
  $hint.Location = New-Object System.Drawing.Point(16, $y)
  $hint.Size = New-Object System.Drawing.Size(528, 120)
  $hint.ForeColor = [System.Drawing.Color]::DimGray
  $hint.Text = 'Zielordner: der Ordner der Subdomain, z. B. /fragebogen. Adresse: https://… – damit prüft das ' +
    'Werkzeug nach dem Upload, ob die Seite genau die hochgeladene Datei ausliefert. IP-Adressen: die ' +
    'festen Internet-Adressen der Kanzlei, mit Leerzeichen getrennt; nur von dort sind Kanzlei- und ' +
    'Testordner erreichbar. Serverpfad: der volle Pfad dieses Ordners auf dem Server, nur für die ' +
    'Tester-Anmeldung (IONOS z. B. /kunden/homepages/…/htdocs/fragebogen).'
  if ($current) { $hint.Text += ' Passwort leer lassen = bisheriges behalten.' }
  $form.Controls.Add($hint)

  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'Speichern'
  $ok.Location = New-Object System.Drawing.Point(330, 532)
  $ok.Size = New-Object System.Drawing.Size(100, 32)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok
  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = 'Abbrechen'
  $cancel.Location = New-Object System.Drawing.Point(444, 532)
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

function Split-Ips([string]$text) {
  return @($text -split '[\s,;]+' | Where-Object { $_ })
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
  if ($entry.serverpfad -and $entry.serverpfad -notmatch '^/[A-Za-z0-9._/-]+$') { $problems += 'Der Serverpfad beginnt mit / und enthält nur Buchstaben, Ziffern, . _ - /.' }
  foreach ($ip in (Split-Ips $entry.ips)) {
    if ($ip -notmatch '^[0-9a-fA-F:./]+$') { $problems += ('„' + $ip + '“ ist keine IP-Adresse.') }
  }
  return $problems
}

# The key the server presents to PuTTY — the program that uploads later. plink -batch prints it and
# stops before any login. (Windows' ssh-keyscan 9.5 fails on IONOS: the server picks the key exchange
# sntrup761x25519, which that build offers but cannot do — 2026-11-01. It stays the fallback, e.g.
# when PuTTY already has the key cached and prints nothing.)
function Get-HostKeys([string]$server, [int]$port) {
  $plink = Join-Path (Split-Path -Parent (Find-Psftp)) 'plink.exe'
  $keys = @()
  if (Test-Path $plink) {
    $lines = Invoke-Native { & $plink -batch -ssh -P $port $server exit 2>&1 | ForEach-Object { "$_" } }
    foreach ($line in $lines) {
      # "  ssh-ed25519 255 SHA256:abc…"
      if ($line -match '^\s*((?:ssh|ecdsa|rsa)-\S+)\s+\d+\s+(SHA256:\S+)\s*$') {
        $keys += [pscustomobject]@{ Typ = $Matches[1]; Fingerabdruck = $Matches[2] }
      }
    }
  }
  if ($keys.Count -gt 0) { return $keys }
  $scanFile = Join-Path $localDir 'hostkeys.tmp'
  try {
    $scan = Invoke-Native { & ssh-keyscan.exe -p $port -T 15 $server 2>$null }
    if (-not $scan) { throw "Vom Server $server (Port $port) kam kein Schlüssel. Stimmen Name und Port?" }
    Set-Content -Path $scanFile -Value $scan -Encoding ascii
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
  if ($current -and $current.ips) { $current.ips = (@($current.ips) -join ' ') }
  while ($true) {
    $entry = Show-SetupDialog $current
    if (-not $entry) { Write-Host 'Einrichtung abgebrochen.'; return $null }
    $server, $port, $path = Split-Server $entry.server
    $entry.server = $server
    if ($port) { $entry.port = $port }
    if ($path -and -not $entry.ordner) { $entry.ordner = $path }
    $problems = Test-SetupInput $entry $hasPassword
    if ($problems.Count -eq 0) { break }
    Show-Message ($problems -join "`n") 'OK' 'Warning' | Out-Null
    $current = [pscustomobject]$entry
  }
  New-Item -ItemType Directory -Force $localDir | Out-Null
  $keys = Get-HostKeys $entry.server ([int]$entry.port)
  $list = ($keys | ForEach-Object { "$($_.Typ)   $($_.Fingerabdruck)" }) -join "`n"
  $answer = Show-Message ("Der Server hat sich mit diesem Schlüssel gemeldet:`n`n$list`n`n" +
    'Vergleichen Sie ihn, z. B. in WinSCP (verbunden: Sitzung › Server-/Protokollinformationen › ' +
    'Fingerabdruck des Serverschlüssels, SHA-256). Mit „Ja“ wird er gemerkt; meldet sich der Server ' +
    'später mit einem anderen Schlüssel, bricht der Upload ab.') 'YesNo' 'Question'
  if ($answer -ne 'Yes') { Write-Host 'Schlüssel des Servers nicht bestätigt – nichts gespeichert.'; return $null }

  $settings = [ordered]@{
    server = $entry.server
    port = [int]$entry.port
    benutzer = $entry.benutzer
    ordner = $entry.ordner
    adresse = $entry.adresse.TrimEnd('/')
    ips = Split-Ips $entry.ips
    serverpfad = $entry.serverpfad.TrimEnd('/')
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
# -IgnoreErrors (psftp -be) only for creating folders, which fails when they exist.
function Invoke-Psftp($settings, [string]$batch, [switch]$IgnoreErrors) {
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
    if ($IgnoreErrors) { $psftpArgs += '-be' }
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
  if (-not $target) { throw ('Unbekanntes Ziel „' + $Ziel + '“.') }
  if ($target.build -and -not $OhneBuild -and -not $Probelauf) {
    Write-Host "Baue die App (npm run $($target.build)) …"
    Invoke-Native { & npm.cmd --prefix $root run $target.build }
    if ($LASTEXITCODE -ne 0) { throw "Der Build ist fehlgeschlagen (npm run $($target.build))." }
  }

  $ips = @($settings.ips) -join ','
  function Get-Plan([string[]]$extra = @()) {
    # Name and value as one argument: Windows PowerShell 5.1 drops an empty argument.
    $json = Invoke-Native { & node.exe (Join-Path $PSScriptRoot 'uploadPlan.ts') $Ziel "--remote=$($settings.ordner)" "--ips=$ips" @extra 2>$null }
    $result = ($json -join "`n") | ConvertFrom-Json
    if (-not $result.ok) { throw ("Nicht hochgeladen:`n" + ($result.problems -join "`n")) }
    return $result
  }
  # With a known server path the login is part of the plan already for the question "Jetzt
  # hochladen?" (before, it showed "bis dahin nur eure IPs" and uploaded the login anyway).
  $known = if ($settings.serverpfad -and $target.access -eq 'ipOrLogin') { @("--pfad=$($settings.serverpfad.TrimEnd('/'))/$($target.folder)") } else { @() }
  $plan = Get-Plan $known

  $place = (@($settings.ordner, $plan.folder) | Where-Object { $_ }) -join '/'
  $commit = (Invoke-Native { & git.exe -C $root rev-parse --short HEAD }) -join ''
  $dirty = [bool](Invoke-Native { & git.exe -C $root status --porcelain })
  $fileList = (@($plan.generated | ForEach-Object { "  $($_.to)  (Zugriffsregeln, erzeugt)" }) +
    @($plan.files | ForEach-Object { "  $($_.to)  ($([math]::Round($_.bytes / 1KB)) KB, SHA-256 $($_.sha256.Substring(0, 12))…)" })) -join "`n"
  $notes = if ($plan.notes) { "`n`n" + ($plan.notes -join "`n") } else { '' }

  if ($Probelauf) {
    $cd = ($plan.batch -split "`n") | Select-Object -First 1 | Where-Object { $_ -like 'cd *' -and $settings.ordner }
    $result = Invoke-Psftp $settings ((@($cd) + 'pwd', 'ls') -join "`n")
    if (-not $result.Ok) { throw "Verbindung fehlgeschlagen:`n$($result.Output)" }
    Write-Host $result.Output
    Show-Message ("Verbindung in Ordnung. Hochgeladen würden nach $($settings.server):$place`n`n$fileList$notes`n`n" +
      'Der Inhalt des Zielordners steht im Terminal.') | Out-Null
    exit 0
  }

  $warning = if ($dirty) { "`n`nAchtung: Es gibt nicht committete Änderungen – hochgeladen wird der Stand auf der Festplatte." } else { '' }
  $answer = Show-Message ("$($plan.description)`nnach $($settings.server):$place`nStand $commit$warning`n`n$fileList$notes`n`nJetzt hochladen?") 'YesNo' 'Question'
  if ($answer -ne 'Yes') { exit 1 }

  $checks = @()
  if ($plan.prepare) {
    # Creates the folder and prints its absolute path, which the tester login needs.
    $prepared = Invoke-Psftp $settings $plan.prepare -IgnoreErrors
    if ($plan.access -eq 'ipOrLogin') {
      $found = [regex]::Matches($prepared.Output, '(?m)^Remote directory is (/\S*)\s*$')
      # An SFTP user locked into its folder sees that folder as "/": its paths are not the server's,
      # and a wrong AuthUserFile would answer every request with an error 500. Then the setting
      # "serverpfad" (the real path of that folder, found by a probe on 2026-11-01) is the base.
      if ($prepared.Output -match '(?m)^Remote working directory is /\s*$') {
        if ($settings.serverpfad) {
          $plan = Get-Plan @("--pfad=$($settings.serverpfad.TrimEnd('/'))/$($plan.folder)")
        } else {
          $checks += 'Der SFTP-Zugang sieht nur seinen eigenen Ordner; ohne den Serverpfad (-Einrichten) bleibt der Testordner nur für eure IPs.'
        }
      } elseif ($found.Count -gt 0) { $plan = Get-Plan @("--pfad=$($found[$found.Count - 1].Groups[1].Value)") }
      else { $checks += 'Pfad auf dem Server nicht ermittelt – der Testordner bleibt nur für eure IPs.' }
    }
  }
  $checks += @($plan.notes)
  $result = Invoke-Psftp $settings $plan.batch
  if (-not $result.Ok) {
    Write-Log "FEHLER  Ziel=$Ziel  Stand=$commit  $($result.Output -replace "`n", ' | ')"
    throw "Upload fehlgeschlagen:`n$($result.Output)"
  }

  $fileList = (@($plan.generated | ForEach-Object { "  $($_.to)  (erzeugt)" }) +
    @($plan.files | ForEach-Object { "  $($_.to)  ($([math]::Round($_.bytes / 1KB)) KB)" })) -join "`n"
  if ($settings.adresse) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $base = (@($settings.adresse, $plan.folder) | Where-Object { $_ }) -join '/'
    foreach ($file in ($plan.files | Where-Object { $_.verify })) {
      $url = "$base/$($file.to)?pruefung=$([guid]::NewGuid().ToString('N'))"
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
  Show-Message ("Hochgeladen nach $place (Stand $commit):`n`n$fileList`n`n" + ($checks -join "`n")) 'OK' $icon | Out-Null
  exit 0
} catch {
  Show-Message $_.Exception.Message 'OK' 'Error' | Out-Null
  exit 1
}
