param(
  [string]$Message,
  [switch]$NoPull,
  [switch]$NoCommit,
  [switch]$NoPush
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-GitExecutable {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($git) { return $git.Source }

  $candidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe"
  )

  foreach ($path in $candidates) {
    if (Test-Path $path) { return $path }
  }

  throw "git не найден. Установите Git for Windows и убедитесь, что он доступен в PATH."
}

$gitExe = Resolve-GitExecutable

Push-Location $PSScriptRoot
try {
  & $gitExe rev-parse --is-inside-work-tree *> $null

  if (-not $NoPull) {
    & $gitExe pull --rebase --autostash
  }

  if (-not $NoCommit) {
    & $gitExe add -A
    $status = (& $gitExe status --porcelain)
    if ($status) {
      if (-not $Message) {
        $Message = "sync " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
      }
      & $gitExe commit -m $Message
    }
  }

  if (-not $NoPush) {
    $branch = ((& $gitExe rev-parse --abbrev-ref HEAD).Trim())
    & $gitExe push -u origin $branch
  }
}
finally {
  Pop-Location
}

