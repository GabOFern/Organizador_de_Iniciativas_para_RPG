param(
    [Parameter(Mandatory = $true)]
    [string] $Root,

    [int] $TimeoutSeconds = 90
)

$ErrorActionPreference = 'Continue'
# Bat às vezes passa trailing backslash; remover evita "caracteres invalidos no caminho".
$Root = $Root.Trim().TrimEnd('\', '/')
$log = Join-Path $Root 'logs\cloudflared.log'
$out = Join-Path $Root 'logs\public-url.txt'
$urlRx = [regex]'https://[A-Za-z0-9-]+\.trycloudflare\.com'
$metricsRx = [regex]'Starting metrics server on 127\.0\.0\.1:(\d+)'

function Save-Url([string] $url) {
    Set-Content -LiteralPath $out -Value $url -NoNewline -Encoding ascii
    Write-Output $url
}

for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
    if (Test-Path -LiteralPath $log) {
        $text = Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue
        if ($text) {
            $m = $urlRx.Match($text)
            if ($m.Success) {
                Save-Url $m.Value
                exit 0
            }

            $mm = $metricsRx.Match($text)
            if ($mm.Success) {
                $port = $mm.Groups[1].Value
                try {
                    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$port/quicktunnel" -TimeoutSec 2
                    if ($resp.hostname) {
                        $hostName = [string]$resp.hostname
                        if (-not $hostName.StartsWith('http')) {
                            $hostName = "https://$hostName"
                        }
                        Save-Url $hostName
                        exit 0
                    }
                }
                catch {
                }
            }
        }
    }

    Start-Sleep -Seconds 1
}

Write-Error "URL trycloudflare.com nao apareceu em $TimeoutSeconds s. Veja $log"
exit 1
