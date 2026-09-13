@echo off
title Subir OriWeb a GitHub
color 0b
echo ========================================================
echo        SUBIENDO PROYECTO ORIWEB A GITHUB
echo ========================================================
echo.

set PATH=C:\Users\gerug\AppData\Local\Programs\MinGit\cmd;C:\Users\gerug\AppData\Local\Programs\MinGit\mingw64\bin;%PATH%
cd /d C:\Users\gerug\Desktop\OriPro

echo Conectando con https://github.com/Gerugo/OriWeb...
echo Si es la primera vez, se abrira una pestana en tu navegador para dar permiso en 1 click.
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    color 0a
    echo ========================================================
    echo   EXITO: Todo el proyecto ha sido subido a GitHub!
    echo ========================================================
) else (
    color 0c
    echo ========================================================
    echo   Hubo un problema. Comprueba la conexion o el permiso.
    echo ========================================================
)
echo.
pause