@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=C:\Program Files\Java\jdk-21\bin;%PATH%"
if not exist D:\tmp mkdir D:\tmp
call gradlew.bat assembleDebug --gradle-user-home D:\tmp\glowvai-gradle-user --project-cache-dir D:\tmp\glowvai-project-cache
