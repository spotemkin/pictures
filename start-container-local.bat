@echo off
docker run --env-file .env.local -p 3000:3000 -v d:/vscode-work/pictures/pictures:/app -v d:/autopics:/data/pics/auto my-nodejs-app

