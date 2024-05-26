:: docker build -t imola.io .
@echo off
docker run --env-file .env.local -p 3000:3000 -v d:/vscode-work/pictures/pictures:/app -v d:/autopics:/data/pics/auto -v d:/auto-prv:/data/pics/auto-prv imola.io

