ECHO OFF

start node app.js 8081 127.0.0.1 8080

timeout 2

start node app.js 8082 127.0.0.1 8080

timeout 2

start node app.js 8083 127.0.0.1 8081

timeout 2

start node app.js 8084 127.0.0.1 8081

timeout 2

start node app.js 8085 127.0.0.1 8083



