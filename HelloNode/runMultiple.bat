ECHO OFF

FOR /L %%A IN (8081,1,8088) DO (
  ECHO %%A
  start "" node app.js %%A 127.0.0.1 8080
  TIMEOUT 1
)

PAUSE