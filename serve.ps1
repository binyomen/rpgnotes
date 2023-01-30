[CmdletBinding()]
param(
    [Parameter()]
    [Switch] $GmMode
)

$local:ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot

$oldTimeSetting = $env:RPGNOTES_NO_TIME
$env:RPGNOTES_NO_TIME = 1

$oldPerfSetting = $env:RPGNOTES_PERFORMANCE
$env:RPGNOTES_PERFORMANCE = 1

try {
    Get-Process python -ErrorAction SilentlyContinue | `
        Where-Object {$_.CommandLine -like '*http.server*'} | `
        Stop-Process -Force

    $arguments = $GmMode ? '--gm-mode' : ''
    node index.js $arguments

    Push-Location 'build'
    try {
        (python -m http.server &) > $null
    } finally {
        Pop-Location
    }
} finally {
    $env:RPGNOTES_PERFORMANCE = $oldPerfSetting
    $env:RPGNOTES_NO_TIME = $oldTimeSetting
    Pop-Location
}
