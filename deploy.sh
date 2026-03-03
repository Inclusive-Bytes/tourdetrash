#/!bin/bash/

destpath="/home/admin/Sm00thieGames/launcher/games/tourdetrash/"
rm -rf dist
rm -rf "$destpath"
mkdir "$destpath"
npm run build
cp -r dist/assets "$destpath/assets"
mkdir "$destpath/src"
cp -r src/sprites "$destpath/src"
cp dist/index.html "$destpath"

