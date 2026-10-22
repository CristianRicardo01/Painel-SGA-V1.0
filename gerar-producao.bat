@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto erro
)
call npm run build
if errorlevel 1 goto erro
echo.
echo Build concluido. A pasta dist foi atualizada dentro deste projeto.
echo No XAMPP, mantenha a pasta inteira em htdocs\sgaprd\paineltv-modernizado.
echo URL: http://localhost/sgaprd/paineltv-modernizado/
pause
goto fim
:erro
echo.
echo Falha ao gerar a versao de producao. Confira a mensagem acima.
pause
:fim
