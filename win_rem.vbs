strComputer = "."
set objWMI = GetObject("winmgmts:\\" & strComputer & "\root\cimv2")
set colOS = objWMI.InstancesOf("Win32_OperatingSystem")
for each objOS in colOS
strReturn = "total mem: " &  round(objOS.TotalVisibleMemorySize / 1024) & " MB" & vbCrLf &"left mem: " & round(objOS.FreePhysicalMemory / 1024) & " MB" & vbCrLf &"mem useage :" & Round(((objOS.TotalVisibleMemorySize-objOS.FreePhysicalMemory)/objOS.TotalVisibleMemorySize)*100) & "%"
Wscript.Echo strReturn
next