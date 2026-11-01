# Tester management for the hosted test folder (Tobias 2026-11-01: "wer kann testen", no PHP).
# A window on the Kanzlei PC: add a tester, give a new password, lock, delete; "Testordner
# aktualisieren" uploads the test folder with its .htpasswd (deploy\upload.ps1 -Ziel test). The
# logic and the local list (hashes only) live in deploy/testers.ts and deploy/.local/tester.json.
#
#   powershell -ExecutionPolicy Bypass -File deploy\tester.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$title = 'Fragebogen – Tester'

# PowerShell reads „ and “ as quote marks: German quotes only inside single-quoted strings.
function Show-Message([string]$text, [string]$buttons = 'OK', [string]$icon = 'Information') {
  return [System.Windows.Forms.MessageBox]::Show($text, $title, $buttons, $icon)
}

function Invoke-Testers([string[]]$arguments) {
  $old = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { $json = & node.exe (Join-Path $PSScriptRoot 'testers.ts') @arguments 2>$null }
  finally { $ErrorActionPreference = $old }
  if (-not $json) { throw 'Die Testerliste ließ sich nicht lesen (Node.js installiert?).' }
  return ($json -join "`n") | ConvertFrom-Json
}

function Read-Name {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Neuer Tester'
  $form.StartPosition = 'CenterParent'
  $form.FormBorderStyle = 'FixedDialog'
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.Font = New-Object System.Drawing.Font('Segoe UI', 10)
  $form.ClientSize = New-Object System.Drawing.Size(420, 150)
  $label = New-Object System.Windows.Forms.Label
  $label.Location = New-Object System.Drawing.Point(16, 12)
  $label.Size = New-Object System.Drawing.Size(388, 44)
  $label.Text = 'Anmeldename, z. B. „erika.m“ – 2 bis 32 Zeichen: Buchstaben, Ziffern, Punkt, Binde- oder Unterstrich.'
  $form.Controls.Add($label)
  $box = New-Object System.Windows.Forms.TextBox
  $box.Location = New-Object System.Drawing.Point(16, 62)
  $box.Size = New-Object System.Drawing.Size(388, 26)
  $form.Controls.Add($box)
  $ok = New-Object System.Windows.Forms.Button
  $ok.Text = 'Anlegen'
  $ok.Location = New-Object System.Drawing.Point(196, 104)
  $ok.Size = New-Object System.Drawing.Size(100, 32)
  $ok.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($ok)
  $form.AcceptButton = $ok
  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = 'Abbrechen'
  $cancel.Location = New-Object System.Drawing.Point(304, 104)
  $cancel.Size = New-Object System.Drawing.Size(100, 32)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)
  $form.CancelButton = $cancel
  $name = if ($form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { $box.Text.Trim() } else { '' }
  $form.Dispose()
  return $name
}

function Show-Password([string]$name, [string]$password) {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = 'Passwort – nur jetzt sichtbar'
  $form.StartPosition = 'CenterParent'
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

function Invoke-Change([string]$action, [string]$name) {
  $result = Invoke-Testers @($action, $name)
  if (-not $result.ok) { Show-Message $result.message 'OK' 'Warning' | Out-Null; return }
  Update-List
  if ($result.password) { Show-Password $name $result.password }
}

$buttons = @(
  @{ Text = 'Neuer Tester …'; Action = { $name = Read-Name; if ($name) { Invoke-Change 'neu' $name } } },
  @{ Text = 'Neues Passwort'; Action = {
      $item = Get-Selected
      if ($item -and (Show-Message ('Neues Passwort für „' + $item.Text + '“? Das alte gilt nach dem Aktualisieren nicht mehr.') 'YesNo' 'Question') -eq 'Yes') {
        Invoke-Change 'passwort' $item.Text
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
