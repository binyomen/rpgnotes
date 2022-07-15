$local:ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    Get-Job | Stop-Job
    node index.js

    Push-Location 'build'
    try {
        (python -m http.server &) > $null
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}
