@echo off
REM ============================================================
REM  DUSTY STARK LAB - one-command deploy to home-server
REM  Usage:
REM    deploy           full build + deploy
REM    deploy -SkipBuild   chi package + upload (da build san)
REM ============================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\deploy-home-server.ps1" %*
