#!/usr/bin/env sh

# abort on errors
set -e

git checkout --orphan gh-pages
echo "Building started..."
npm run build
folderName="dist"
touch ./$folderName/.nojekyll
git --work-tree $folderName add --all
git --work-tree $folderName commit -m gh-pages

echo "Pushing to gh-pages..."
git push origin HEAD:gh-pages --force
rm -r $folderName

git checkout --f main
git branch -D gh-pages
echo "Successfully deployed, check your settings"