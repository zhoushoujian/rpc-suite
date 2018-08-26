@echo off

rem ver

:info

::echo %date%%time%

for /f "tokens=2 delims==" %%a in ('wmic path Win32_PerfFormattedData_PerfOS_Processor get PercentProcessorTime /value^|findstr "PercentProcessorTime"') do (

set UseCPU=%%a

)

rem print cpu useage
echo cpu usage%UseCPU%%%

rem get left mem
cscript //Nologo win_rem.vbs

rem sleep
rem ping -n 20 127.1>nul

rem loop exec
rem goto info