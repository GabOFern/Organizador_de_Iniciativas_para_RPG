@echo off
setlocal EnableExtensions
cd /d "%~dp0"
rem Salvar ANTES do shift em parse_args - shift sobrescreve %0 e quebra %~dp0.
rem Sem barra final: "…RPG\" no PowerShell engole a aspas e corrompe -Root.
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

rem Uso:
rem   iniciar.bat              - roda testes; so inicia se todos passarem
rem   iniciar.bat /force       - inicia mesmo se algum teste falhar
rem   iniciar.bat /skiptests   - pula os testes e inicia direto
rem   iniciar.bat /publico     - sobe Cloudflare Quick Tunnel (link sem tela Visit)
rem   Flags podem combinar: iniciar.bat /skiptests /publico

set "FORCE_START=0"
set "SKIP_TESTS=0"
set "PUBLICO=0"
set "API_PORT=5111"
set "WEB_PORT=5173"

:parse_args
if "%~1"=="" goto args_done
if /I "%~1"=="/force" set "FORCE_START=1"
if /I "%~1"=="/skiptests" set "SKIP_TESTS=1"
if /I "%~1"=="/skiptest" set "SKIP_TESTS=1"
if /I "%~1"=="/publico" set "PUBLICO=1"
shift
goto parse_args
:args_done

rem Evita ProgramFiles(x86) quebrando o parser do cmd (parenteses).
set "PF86=%ProgramFiles(x86)%"

rem O instalador do Node/winget atualiza o PATH do sistema, mas a janela
rem atual pode nao ver isso. Prefixa caminhos comuns.
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles%\cloudflared;%PF86%\cloudflared;%LOCALAPPDATA%\Microsoft\WinGet\Links;%PATH%"

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

set "CLOUDFLARED_EXE="
where cloudflared >nul 2>&1
if not errorlevel 1 for /f "delims=" %%C in ('where cloudflared') do if not defined CLOUDFLARED_EXE set "CLOUDFLARED_EXE=%%C"
if not defined CLOUDFLARED_EXE if exist "%PF86%\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=%PF86%\cloudflared\cloudflared.exe"
if not defined CLOUDFLARED_EXE if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=%ProgramFiles%\cloudflared\cloudflared.exe"

if "%PUBLICO%"=="1" if not defined CLOUDFLARED_EXE (
  echo.
  echo Nao encontrei o cloudflared ^(Cloudflare Tunnel^).
  echo Instale com:
  echo   winget install -e --id Cloudflare.cloudflared
  echo Depois feche e abra o terminal ^(ou reinicie^) e rode de novo com /publico.
  pause
  exit /b 1
)

if not exist "%ROOT%\src\IniciativasRPG.Web\.env" (
  copy /Y "%ROOT%\src\IniciativasRPG.Web\.env.example" "%ROOT%\src\IniciativasRPG.Web\.env" >nul
  echo Arquivo .env do site criado.
)

if not exist "%ROOT%\src\IniciativasRPG.Web\node_modules\" (
  echo Instalando dependencias do site...
  pushd "%ROOT%\src\IniciativasRPG.Web"
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias do site.
    popd
    pause
    exit /b 1
  )
  popd
)

rem Sempre encerra instancias anteriores (API + Vite + Tunnel + janelas cmd)
rem antes de testes ou de subir de novo — evita processos duplicados.
echo.
echo Encerrando processos anteriores ^(API :%API_PORT%, Vite :%WEB_PORT%^)...
call :stop_dev_servers
cd /d "%ROOT%"

if "%SKIP_TESTS%"=="1" (
  echo Pulando testes ^(/skiptests^).
  goto start_services
)

echo.
echo ========================================
echo  Rodando testes do backend ^(xUnit^)...
echo ========================================
dotnet test "%ROOT%\tests\IniciativasRPG.Tests\IniciativasRPG.Tests.csproj" --nologo -v q
if errorlevel 1 (
  echo.
  echo FALHA: testes do backend nao passaram.
  goto tests_failed
)
echo Backend: OK

echo.
echo ========================================
echo  Rodando testes do frontend ^(Vitest^)...
echo ========================================
pushd "%ROOT%\src\IniciativasRPG.Web"
call npm test
if errorlevel 1 (
  popd
  echo.
  echo FALHA: testes do frontend nao passaram.
  goto tests_failed
)
popd
echo Frontend: OK

echo.
echo Todos os testes passaram.
goto start_services

:tests_failed
if "%FORCE_START%"=="1" (
  echo Iniciando mesmo assim ^(/force^).
  goto start_services
)
echo.
choice /C SN /M "Deseja iniciar a aplicacao mesmo assim"
if errorlevel 2 (
  echo Inicio cancelado.
  pause
  exit /b 1
)
if errorlevel 1 goto start_services
echo Inicio cancelado.
pause
exit /b 1

:start_services
rem Garante que nada voltou a subir durante os testes.
call :stop_dev_servers
cd /d "%ROOT%"

if not exist "%ROOT%\logs\" mkdir "%ROOT%\logs" >nul 2>&1

if not exist "%ROOT%\src\IniciativasRPG.Api\" (
  echo Pasta da API nao encontrada: %ROOT%\src\IniciativasRPG.Api
  pause
  exit /b 1
)
if not exist "%ROOT%\src\IniciativasRPG.Web\" (
  echo Pasta do site nao encontrada: %ROOT%\src\IniciativasRPG.Web
  pause
  exit /b 1
)

echo Iniciando a API em http://localhost:%API_PORT%
rem cd na pasta alvo + start sem /D: evita "A pasta atual nao e valida" no Windows.
cd /d "%ROOT%\src\IniciativasRPG.Api"
start "IniciativasRPG API" cmd /k "set ASPNETCORE_ENVIRONMENT=Development&& set ASPNETCORE_URLS=http://localhost:%API_PORT%&& dotnet build --nologo -v q && dotnet bin\Debug\net10.0\IniciativasRPG.Api.dll"

if "%PUBLICO%"=="1" goto start_tunnel

echo Iniciando o site em http://localhost:%WEB_PORT%
cd /d "%ROOT%\src\IniciativasRPG.Web"
start "IniciativasRPG Web" cmd /k "npm run dev"

cd /d "%ROOT%"

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

:start_tunnel
echo.
echo Iniciando Cloudflare Quick Tunnel ^(porta %WEB_PORT%^)...
del /q "%ROOT%\logs\cloudflared.log" >nul 2>&1
del /q "%ROOT%\logs\public-url.txt" >nul 2>&1

cd /d "%ROOT%"
rem PATH ja inclui a pasta do cloudflared; herda para a janela do tunel.
rem --output json: a URL trycloudflare aparece no log (no formato default/QUIC ela some).
start "IniciativasRPG Tunnel" cmd /k "cloudflared tunnel --url http://localhost:%WEB_PORT% --output json > logs\cloudflared.log 2>&1"

echo Aguardando URL publica trycloudflare.com...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\wait-cloudflare-url.ps1" -Root "%ROOT%"
if errorlevel 1 (
  echo.
  echo Nao foi possivel obter a URL do tunel a tempo.
  echo Veja a janela IniciativasRPG Tunnel e logs\cloudflared.log
  pause
  exit /b 1
)

set /p PUBLIC_URL=<"%ROOT%\logs\public-url.txt"
rem Origem para o "Link publico" da batalha ^(mestre fica no localhost^).
if not exist "%ROOT%\src\IniciativasRPG.Web\public\" mkdir "%ROOT%\src\IniciativasRPG.Web\public" >nul 2>&1
> "%ROOT%\src\IniciativasRPG.Web\public\share-origin.txt" echo %PUBLIC_URL%

rem Console do site: o link fica no topo, antes do Vite ^(arquivo evita aspas do start^).
> "%ROOT%\logs\abrir-web.bat" echo @echo off
>> "%ROOT%\logs\abrir-web.bat" echo echo.
>> "%ROOT%\logs\abrir-web.bat" echo echo ========================================
>> "%ROOT%\logs\abrir-web.bat" echo echo LINK DOS JOGADORES:
>> "%ROOT%\logs\abrir-web.bat" echo echo %PUBLIC_URL%
>> "%ROOT%\logs\abrir-web.bat" echo echo MESTRE: http://localhost:%WEB_PORT%
>> "%ROOT%\logs\abrir-web.bat" echo echo ========================================
>> "%ROOT%\logs\abrir-web.bat" echo echo.
>> "%ROOT%\logs\abrir-web.bat" echo cd /d "%ROOT%\src\IniciativasRPG.Web"
>> "%ROOT%\logs\abrir-web.bat" echo npm run dev

echo Iniciando o site em http://localhost:%WEB_PORT%
start "IniciativasRPG Web" cmd /k "%ROOT%\logs\abrir-web.bat"

echo Aguardando o site responder...
powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing 'http://localhost:%WEB_PORT%/' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } } catch {} ; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo O site nao respondeu a tempo. Veja a janela IniciativasRPG Web.
  pause
  exit /b 1
)

echo.
echo ========================================
echo  Mestre:  http://localhost:%WEB_PORT%
echo  Jogadores / link publico:  %PUBLIC_URL%
echo ========================================
echo %PUBLIC_URL%| clip
echo URL dos JOGADORES copiada para a area de transferencia.
echo O mesmo link esta no topo da janela IniciativasRPG Web.
echo.

start "" "http://localhost:%WEB_PORT%"
echo Pronto. O navegador do mestre abriu em localhost.
echo Logs: logs\back, logs\front, logs\cloudflared.log
echo Para encerrar, feche as janelas IniciativasRPG API, Web e Tunnel.
pause
endlocal
exit /b 0

:stop_dev_servers
call :stop_port %API_PORT%
call :stop_port %WEB_PORT%
rem Janelas abertas pelo proprio iniciador (cmd /k), mesmo se a porta ja tiver sido liberada.
taskkill /FI "WINDOWTITLE eq IniciativasRPG API*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq IniciativasRPG Web*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq IniciativasRPG Tunnel*" /T /F >nul 2>&1
if defined ROOT del /q "%ROOT%\src\IniciativasRPG.Web\public\share-origin.txt" >nul 2>&1
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