# Tester management for the hosted test folder (Tobias 2026-11-01: "wer kann testen", no PHP).
# A window on the Kanzlei PC: add a tester (password typed or made), give a new password, lock,
# delete; "Testordner aktualisieren" uploads the test folder with its .htpasswd
# (deploy\upload.ps1 -Ziel test). The logic and the local list (hashes only) live in
# deploy/testers.ts and deploy/.local/tester.json.
#
#   powershell -ExecutionPolicy Bypass -File deploy\tester.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$title = 'Fragebogen – Tester'

# PowerShell reads „ and “ as quote marks: German quotes only inside single-quoted strings.
function Show-Message([string]$text, [string]$buttons = 'OK', [string]$icon = 'Information') {
  $owner = New-Object System.Windows.Forms.Form
  $owner.TopMost = $true
  try { return [System.Windows.Forms.MessageBox]::Show($owner, $text, $title, $buttons, $icon) }
  finally { $owner.Dispose() }
}

# A typed password goes to node on stdin (UTF-8), never on a command line.
function Invoke-Testers([string[]]$arguments, [string]$password = $null) {
  $old = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $oldEncoding = $OutputEncoding
  try {
    $script = Join-Path $PSScriptRoot 'testers.ts'
    if ($password) {
      $OutputEncoding = New-Object System.Text.UTF8Encoding $false
      $json = $password | & node.exe $script @arguments --passwort-stdin 2>$null
    } else {
      $json = & node.exe $script @arguments 2>$null
    }
  } finally {
    $ErrorActionPreference = $old
    $OutputEncoding = $oldEncoding
  }
  if (-not $json) { throw 'Die Testerliste ließ sich nicht lesen (Node.js installiert?).' }
  return ($json -join "`n") | ConvertFrom-Json
}

function Add-Row($form, [string]$label, [int]$y, [bool]$secret) {
  $text = New-Object System.Windows.Forms.Label
  $text.Location = New-Object System.Drawing.Point(16, ($y + 3))
  $text.Size = New-Object System.Drawing.Size(170, 24)
  $text.Text = $label
  $form.Controls.Add($text)
  $box = New-Object System.Windows.Forms.TextBox
  $box.Location = New-Object System.Drawing.Point(190, $y)
  $box.Size = New-Object System.Drawing.Size(250, 26)
  if ($secret) { $box.UseSystemPasswordChar = $true }
  $form.Controls.Add($box)
  return $box
}

# Name (for a new tester) and an optional password typed twice; $null when cancelled.
function Read-TesterInput([string]$heading, [bool]$withName) {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = $heading
  $form.StartPosition = 'CenterScreen'
  $form.TopMost = $true
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $form.ClientSize = New-Object System.Drawing.Size(456, 270)
  $y = 16
  $name = $null
  if ($withName) {
    $name = Add-Row $form 'Anmeldename' $y $false
    $y += 40
  }
  $first = Add-Row $form 'Passwort' $y $true
  $second = Add-Row $form 'Passwort wiederholen' ($y + 40) $true
  $hint = New-Object System.Windows.Forms.Label
  $hint.Location = New-Object System.Drawing.Point(16, ($y + 84))
  $hint.Size = New-Object System.Drawing.Size(424, 76)
  $hint.ForeColor = [System.Drawing.Color]::DimGray
  $hint.Text = 'Passwort leer lassen: das Werkzeug erzeugt eins und zeigt es einmal an. Eigenes Passwort: ' +
    'mindestens 10 Zeichen. Gespeichert wird nur ein Hash.' +
    $(if ($withName) { ' Anmeldename z. B. „tanja“: 2 bis 32 Zeichen, Buchstaben, Ziffern, . _ -' } else { '' })
  $form.Controls.Add($hint)
  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'OK'
  $ok.Location = New-Object System.Drawing.Point(232, 224)
  $ok.Size = New-Object System.Drawing.Size(100, 32)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok
  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = 'Abbrechen'
  $cancel.Location = New-Object System.Drawing.Point(340, 224)
  $cancel.Size = New-Object System.Drawing.Size(100, 32)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)
  $form.CancelButton = $cancel
  while ($true) {
    if ($form.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { $form.Dispose(); return $null }
    if ($first.Text -ne $second.Text) {
      Show-Message 'Die beiden Passwörter stimmen nicht überein.' 'OK' 'Warning' | Out-Null
      continue
    }
    $result = @{ name = $(if ($name) { $name.Text.Trim() } else { '' }); password = $first.Text }
    $form.Dispose()
    return $result
  }
}

function Show-Password([string]$name, [string]$password) {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Passwort – nur jetzt sichtbar'
  $form.StartPosition = 'CenterScreen'
  $form.TopMost = $true
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $form.ClientSize = New-Object System.Drawing.Size(460, 220)
  $label = New-Object System.Windows.Forms.Label
  $label.Location = New-Object System.Drawing.Point(16, 12)
  $label.Size = New-Object System.Drawing.Size(428, 100)
  $label.Text = "Anmeldename: $name`n`nDas Passwort wird nur jetzt angezeigt und nirgends gespeichert. Geben Sie es " +
    'getrennt von der Adresse weiter (z. B. am Telefon). Es gilt erst nach „Testordner aktualisieren“.'
  $form.Controls.Add($label)
  $box = New-Object System.Windows.Forms.TextBox
  $box.Location = New-Object System.Drawing.Point(16, 118)
  $box.Size = New-Object System.Drawing.Size(300, 30)
  $box.Font = New-Object System.Drawing.Font('Consolas', 14)
  $box.ReadOnly = $true
  $box.Text = $password
  $form.Controls.Add($box)
  $copy = New-Object System.Windows.Forms.Button
  $copy.Text = 'Kopieren'
  $copy.Location = New-Object System.Drawing.Point(328, 118)
  $copy.Size = New-Object System.Drawing.Size(116, 32)
  $copy.Add_Click({ [System.Windows.Forms.Clipboard]::SetText($password) }.GetNewClosure())
  $form.Controls.Add($copy)
  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'Fertig'
  $ok.Location = New-Object System.Drawing.Point(344, 172)
  $ok.Size = New-Object System.Drawing.Size(100, 32)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok
  [void]$form.ShowDialog()
  $form.Dispose()
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'Fragebogen – Tester des Testordners'
$form.StartPosition = 'CenterScreen'
$form.TopMost = $true
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$form.ClientSize = New-Object System.Drawing.Size(640, 420)
$form.MinimumSize = New-Object System.Drawing.Size(560, 360)

$list = New-Object System.Windows.Forms.ListView
$list.View = 'Details'
$list.FullRowSelect = $true
$list.MultiSelect = $false
$list.Location = New-Object System.Drawing.Point(16, 16)
$list.Size = New-Object System.Drawing.Size(420, 388)
$list.Anchor = 'Top, Bottom, Left, Right'
[void]$list.Columns.Add('Anmeldename', 180)
[void]$list.Columns.Add('angelegt', 110)
[void]$list.Columns.Add('Status', 110)
$form.Controls.Add($list)

function Update-List {
  $list.Items.Clear()
  foreach ($tester in @((Invoke-Testers @('liste')).testers)) {
    $item = New-Object System.Windows.Forms.ListViewItem($tester.name)
    [void]$item.SubItems.Add([string]$tester.created)
    [void]$item.SubItems.Add($(if ($tester.locked) { 'gesperrt' } else { 'freigegeben' }))
    [void]$list.Items.Add($item)
  }
}

function Get-Selected {
  if ($list.SelectedItems.Count -eq 0) {
    Show-Message 'Bitte zuerst einen Tester in der Liste wählen.' | Out-Null
    return $null
  }
  return $list.SelectedItems[0]
}

function Invoke-Change([string]$action, [string]$name, [string]$password = $null) {
  $result = Invoke-Testers @($action, $name) $password
  if (-not $result.ok) { Show-Message $result.message 'OK' 'Warning' | Out-Null; return }
  Update-List
  if ($result.password) { Show-Password $name $result.password }
  elseif ($password) { Show-Message ($result.message + ' Das eingegebene Passwort gilt nach „Testordner aktualisieren“.') | Out-Null }
}

$buttons = @(
  @{ Text = 'Neuer Tester …'; Action = {
      $entry = Read-TesterInput 'Neuer Tester' $true
      if ($entry -and $entry.name) { Invoke-Change 'neu' $entry.name $entry.password } } },
  @{ Text = 'Neues Passwort …'; Action = {
      $item = Get-Selected
      if ($item) {
        $entry = Read-TesterInput ('Neues Passwort für „' + $item.Text + '“') $false
        if ($entry) { Invoke-Change 'passwort' $item.Text $entry.password }
      } } },
  @{ Text = 'Sperren / Freigeben'; Action = {
      $item = Get-Selected
      if ($item) { Invoke-Change $(if ($item.SubItems[2].Text -eq 'gesperrt') { 'entsperren' } else { 'sperren' }) $item.Text } } },
  @{ Text = 'Löschen'; Action = {
      $item = Get-Selected
      if ($item -and (Show-Message ('„' + $item.Text + '“ endgültig löschen?') 'YesNo' 'Warning') -eq 'Yes') { Invoke-Change 'loeschen' $item.Text } } },
  @{ Text = 'Testordner aktualisieren'; Action = {
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'upload.ps1') -Ziel test } }
)
$y = 16
foreach ($definition in $buttons) {
  $button = New-Object System.Windows.Forms.Button
  $button.Text = $definition.Text
  $button.Location = New-Object System.Drawing.Point(452, $y)
  $button.Size = New-Object System.Drawing.Size(172, 36)
  $button.Anchor = 'Top, Right'
  $button.Add_Click($definition.Action)
  $form.Controls.Add($button)
  $y += 48
}
$hint = New-Object System.Windows.Forms.Label
$hint.Location = New-Object System.Drawing.Point(452, ($y + 8))
$hint.Size = New-Object System.Drawing.Size(172, 140)
$hint.Anchor = 'Top, Right'
$hint.ForeColor = [System.Drawing.Color]::DimGray
$hint.Text = 'Änderungen gelten erst nach „Testordner aktualisieren“. Von den IP-Adressen der Kanzlei geht es immer ohne Anmeldung.'
$form.Controls.Add($hint)

try {
  Update-List
  [void]$form.ShowDialog()
} catch {
  Show-Message $_.Exception.Message 'OK' 'Error' | Out-Null
  exit 1
}
