ECHO OFF

FOR /L %%A IN (8081,1,8090) DO (
  ECHO %%A
  start "" node app.js %%A
)

PAUSE