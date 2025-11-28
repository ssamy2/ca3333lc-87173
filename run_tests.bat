@echo off
REM Test script for market data functionality

echo.
echo ========================================
echo Market Data Tests
echo ========================================
echo.

REM Try to find Python
for /f "delims=" %%i in ('where python.exe 2^>nul') do set PYTHON=%%i
if not defined PYTHON (
    for /f "delims=" %%i in ('where python3.exe 2^>nul') do set PYTHON=%%i
)

if not defined PYTHON (
    echo ERROR: Python not found in PATH
    echo Please install Python or add it to your PATH
    pause
    exit /b 1
)

echo Using Python: %PYTHON%
echo.

REM Run market data tests
echo Running market data tests...
%PYTHON% test_market_data.py

if errorlevel 1 (
    echo.
    echo Tests failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo All tests passed!
echo ========================================
pause
