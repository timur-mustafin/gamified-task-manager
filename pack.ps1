<# 
  pack.ps1 — упаковка проекта в zip с учетом .gitignore

  Приоритетно использует Git (точно учитывает все .gitignore, в т.ч. из поддиректорий).
  Фоллбэк: парсит .gitignore в корне (поддержка *, **, ?, !, / и директорий).

  Примеры:
    ./pack.ps1                       # создаст project-2025-09-07_17-00.zip
    ./pack.ps1 -Output my.zip
    ./pack.ps1 -GitIgnore .gitignore -Root .

  Требования:
    - Режим Git: установлен git и проект — git-репозиторий
    - Фоллбэк: PowerShell 5+ (или pwsh 7+), файл .gitignore в корне
#>

[CmdletBinding()]
param(
  [string]$Output,
  [string]$GitIgnore = ".gitignore",
  [string]$Root = ".",
  [switch]$VerboseLog
)

function Write-Info($msg) { if ($VerboseLog) { Write-Host "[pack] $msg" -ForegroundColor Cyan } }

# Генерируем дефолтное имя архива, если не задано
if (-not $Output) {
  $ts = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
  $rootName = Split-Path (Resolve-Path $Root) -Leaf
  $Output = "$rootName-$ts.zip"
}

# Убедимся, что корень существует
$Root = (Resolve-Path $Root).Path
Push-Location $Root
try {
  # Попытка «Git-режима»: максимально точная фильтрация
  $gitOk = $false
  $gitVersion = (git --version 2>$null)
  if ($LASTEXITCODE -eq 0) {
    # Проверим, что это git-репозиторий
    git rev-parse --is-inside-work-tree 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $gitOk = $true
    }
  }

  $files = @()
  if ($gitOk) {
    Write-Info "Using Git to resolve ignore rules…"
    # Возьмём все файлы, которые НЕ игнорируются: отслеживаемые + неотслеживаемые (но не игнорируемые)
    # -z: NUL-терминатор — безопасно для любых имён
    $raw = git ls-files -z --cached --others --exclude-standard 2>$null
    # Разделим по NUL
    $files = ($raw -split "`0") | Where-Object { $_ -ne "" }
  } else {
    # Фоллбэк: парсим корневой .gitignore
    if (-not (Test-Path $GitIgnore)) {
      throw "Git not available or not a repository, and '$GitIgnore' not found. Cannot determine ignore rules."
    }
    Write-Info "Git not available; using fallback parser for $GitIgnore"

    $patternsRaw = Get-Content $GitIgnore -Encoding UTF8
    # Очистим от комментариев и пустых строк
    $rules = @()
    foreach ($line in $patternsRaw) {
      $trim = $line.Trim()
      if (-not $trim) { continue }
      if ($trim -match '^\s*#') { continue }
      $rules += $trim
    }

    # Конвертация gitignore-паттернов в Regex
    function Convert-GitignorePatternToRegex {
      param([string]$pattern)

      $isNegation = $false
      if ($pattern.StartsWith("!")) {
        $isNegation = $true
        $pattern = $pattern.Substring(1)
      }

      $dirOnly = $false
      if ($pattern.EndsWith("/")) {
        $dirOnly = $true
        $pattern = $pattern.TrimEnd("/")
      }

      $anchored = $pattern.StartsWith("/")
      if ($anchored) {
        $pattern = $pattern.TrimStart("/")
      }

      # Нормализуем на прямые слэши
      $p = $pattern.Replace("\", "/")

      # Экранируем спецсимволы regex, потом вернём wildcard-ы
      $esc = [Regex]::Escape($p)

      # Вернем gitignore wildcard-семантику
      # '**' -> '.*' (включая разделители каталогов)
      $esc = $esc -replace [Regex]::Escape("**"), "§§DOUBLESTAR§§"
      # '*' -> [^/]*  (внутри одного каталога)
      $esc = $esc -replace [Regex]::Escape("*"), "[^/]*"
      # '?' -> [^/]
      $esc = $esc -replace [Regex]::Escape("?"), "[^/]"
      # Вернуть '**'
      $esc = $esc -replace "§§DOUBLESTAR§§", ".*"

      if ($anchored) {
        # Якорь от корня
        if ($dirOnly) {
          $regex = "^" + $esc + "/.*$"
        } else {
          $regex = "^" + $esc + "$"
        }
      } else {
        # Разрешить матч из любого подкаталога: (^|.*/)<pattern>
        if ($dirOnly) {
          $regex = "^(?:.*/)?"+ $esc + "/.*$"
        } else {
          $regex = "^(?:.*/)?"+ $esc + "$"
        }
      }

      return [pscustomobject]@{
        Regex     = $regex
        Negation  = $isNegation
        DirOnly   = $dirOnly
      }
    }

    $compiled = $rules | ForEach-Object { Convert-GitignorePatternToRegex $_ }

    # Соберём все файлы/директории и решим, что включать
    $all = Get-ChildItem -Recurse -Force | Where-Object { $_.PSIsContainer -eq $false } # только файлы
    foreach ($f in $all) {
      # путь относительно корня в формате с '/'
      $rel = (Resolve-Path -Relative $f.FullName) -replace '\\','/'
      $include = $true  # по умолчанию включаем, .gitignore задаёт исключения

      foreach ($rule in $compiled) {
        if ($rel -match $rule.Regex) {
          if ($rule.Negation) { $include = $true } else { $include = $false }
        }
      }
      if ($include) { $files += $rel }
    }
  }

  if (-not $files -or $files.Count -eq 0) {
    throw "No files to archive (after applying ignore rules)."
  }

  # Создадим архив, сохраняя структуру каталогов (используем относительные пути)
  if (Test-Path $Output) { Remove-Item $Output -Force }
  Write-Info ("Adding {0} files to {1}" -f $files.Count, $Output)

  # Compress-Archive корректно сохраняет структуру, если передать относительные пути из текущего каталога
  Compress-Archive -Path $files -DestinationPath $Output -CompressionLevel Optimal

  Write-Host "✅ Archive created: $Output"
}
catch {
  Write-Error $_.Exception.Message
}
finally {
  Pop-Location
}
