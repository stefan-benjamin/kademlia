ECHO OFF

FOR /L %%A IN (8081,1,8081) DO (
  ECHO %%A
  start "" node app.js %%A localhost 8080
)

PAUSE