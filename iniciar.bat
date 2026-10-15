@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem Uso:
rem   iniciar.bat           - roda testes; so inicia se todos passarem
rem   iniciar.bat /force    - inicia mesmo se algum teste falhar
rem   iniciar.bat /skiptests - pula os testes e inicia direto

set "FORCE_START=0"
set "SKIP_TESTS=0"
set "API_PORT=5111"
set "WEB_PORT=5173"
if /I "%~1"=="/force" set "FORCE_START=1"
if /I "%~1"=="/skiptests" set "SKIP_TESTS=1"
if /I "%~1"=="/skiptest" set "SKIP_TESTS=1"

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

rem Sempre encerra instancias anteriores (API + Vite + janelas cmd do iniciador)
rem antes de testes ou de subir de novo — evita processos duplicados.
echo.
echo Encerrando processos anteriores ^(API :%API_PORT%, Vite :%WEB_PORT%^)...
call :stop_dev_servers

if "%SKIP_TESTS%"=="1" (
  echo Pulando testes ^(/skiptests^).
  goto :start_services
)

echo.
echo ========================================
echo  Rodando testes do backend ^(xUnit^)...
echo ========================================
dotnet test "tests\IniciativasRPG.Tests\IniciativasRPG.Tests.csproj" --nologo -v q
if errorlevel 1 (
  echo.
  echo FALHA: testes do backend nao passaram.
  goto :tests_failed
)
echo Backend: OK

echo.
echo ========================================
echo  Rodando testes do frontend ^(Vitest^)...
echo ========================================
pushd "src\IniciativasRPG.Web"
call npm test
if errorlevel 1 (
  popd
  echo.
  echo FALHA: testes do frontend nao passaram.
  goto :tests_failed
)
popd
echo Frontend: OK

echo.
echo Todos os testes passaram.
goto :start_services

:tests_failed
if "%FORCE_START%"=="1" (
  echo Iniciando mesmo assim ^(/force^).
  goto :start_services
)
echo.
choice /C SN /M "Deseja iniciar a aplicacao mesmo assim"
if errorlevel 2 (
  echo Inicio cancelado.
  pause
  exit /b 1
)
if errorlevel 1 goto :start_services
echo Inicio cancelado.
pause
exit /b 1

:start_services
rem Garante que nada voltou a subir durante os testes.
call :stop_dev_servers

echo Iniciando a API em http://localhost:%API_PORT%
start "IniciativasRPG API" /D "%~dp0src\IniciativasRPG.Api" cmd /k "set ASPNETCORE_ENVIRONMENT=Development&& set ASPNETCORE_URLS=http://localhost:%API_PORT%&& dotnet build --nologo -v q && dotnet bin\Debug\net10.0\IniciativasRPG.Api.dll"

echo Iniciando o site em http://localhost:%WEB_PORT%
start "IniciativasRPG Web" /D "%~dp0src\IniciativasRPG.Web" cmd /k "npm run dev"

echo Aguardando o site responder...
powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing 'http://localhost:%WEB_PORT%/' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch {} ; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo O site nao respondeu a tempo. Veja a janela IniciativasRPG Web.
  pause
  exit /b 1
)

start "" "http://localhost:%WEB_PORT%"
echo.
echo Pronto. O navegador abriu em http://localhost:%WEB_PORT%
echo Logs: logs\back  e  logs\front
echo Para encerrar, feche as janelas IniciativasRPG API e IniciativasRPG Web.
ping -n 4 127.0.0.1 >nul
endlocal
exit /b 0

:stop_dev_servers
call :stop_port %API_PORT%
call :stop_port %WEB_PORT%
rem Janelas abertas pelo proprio iniciador (cmd /k), mesmo se a porta ja tiver sido liberada.
taskkill /FI "WINDOWTITLE eq IniciativasRPG API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq IniciativasRPG Web*" /T /F >nul 2>&1
rem Pequena espera para a porta ser liberada pelo SO.
ping -n 2 127.0.0.1 >nul
exit /b 0

:stop_port
set "PORT=%~1"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  echo   Porta %PORT%: encerrando PID %%P
  taskkill /PID %%P /T /F >nul 2>&1
)
exit /b 0
