cd "%~dp0\node_modules\snmpsniffer"

@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\node_modules\snmpsniffer\server.min.js" %*
) ELSE (
  node  "%~dp0\node_modules\snmpsniffer\server.min.js" %*
)
