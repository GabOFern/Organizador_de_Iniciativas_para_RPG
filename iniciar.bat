@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem O instalador do Node atualiza o PATH do sistema, mas o Explorer
rem so enxerga isso depois de reiniciar. Este prefixo evita essa espera.
set "PATH=%ProgramFiles%\nodejs;%PATH%"

where dotnet >nul 2>&1
if errorlevel 1 (
  echo Nao encontrei o .NET SDK. Instale o .NET 10 e tente de novo.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo Nao encontrei o Node.js. Instale o Node.js 20 ou superior e tente de novo.
  pause
  exit /b 1
)

if not exist "src\IniciativasRPG.Web\.env" (
  copy /Y "src\IniciativasRPG.Web\.env.example" "src\IniciativasRPG.Web\.env" >nul
  echo Arquivo .env do site criado.
)

if not exist "src\IniciativasRPG.Web\node_modules\" (
  echo Instalando dependencias do site...
  pushd "src\IniciativasRPG.Web"
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias do site.
    popd
    pause
    exit /b 1
  )
  popd
)

netstat -ano | findstr ":5111" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Iniciando a API em http://localhost:5111
  start "IniciativasRPG API" /D "%~dp0src\IniciativasRPG.Api" cmd /k "set ASPNETCORE_ENVIRONMENT=Development&& set ASPNETCORE_URLS=http://localhost:5111&& dotnet build --nologo -v q && dotnet bin\Debug\net10.0\IniciativasRPG.Api.dll"
) else (
  echo A API ja esta em http://localhost:5111
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo Iniciando o site em http://localhost:5173
  start "IniciativasRPG Web" /D "%~dp0src\IniciativasRPG.Web" cmd /k "npm run dev"
) else (
  echo O site ja esta em http://localhost:5173
)

echo Aguardando o site responder...
powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing 'http://localhost:5173/' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch {} ; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo O site nao respondeu a tempo. Veja a janela IniciativasRPG Web.
  pause
  exit /b 1
)

start "" "http://localhost:5173"
echo.
echo Pronto. O navegador abriu em http://localhost:5173
echo Para encerrar, feche as janelas IniciativasRPG API e IniciativasRPG Web.
ping -n 4 127.0.0.1 >nul
endlocal
