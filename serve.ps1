[CmdletBinding()]
param(
    [Parameter()]
    [Switch] $GmMode
)

$local:ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
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
    Pop-Location
}
