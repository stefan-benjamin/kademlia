ECHO OFF

ECHO Starting initial node at port 8080...
start /MIN "" node KademliaNode\app.js 8080 127.0.0.1 8080
TIMEOUT /t 2 /nobreak > NUL

ECHO.
ECHO Starting the rest of nodes..
FOR /L %%A IN (8081,1,8088) DO (
  ECHO Node at port: %%A
  start /MIN "" node KademliaNode\app.js %%A 127.0.0.1 8080
  TIMEOUT /t 1 /nobreak > NUL
)

ECHO.
ECHO Starting sensor node at port 7070..
start /MIN "" node WoTSensorNode\app.js 7070 127.0.0.1 8080 0

ECHO.
ECHO Project is running. Go to localhost:8080 in your browser to visit startup node
ECHO.
ECHO Press any key to close the project
PAUSE > NUL
taskkill /IM node.exe
PAUSE