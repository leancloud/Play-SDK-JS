#!/bin/sh
echo "Deploy doc to github pages.";
mkdir gh_pages;
cp -r doc gh_pages/;
cd gh_pages && git init;
git config user.name "onerain88";
git config user.email "onerain88@gmail.com";
git add .;
git commit -m "Deploy demos to Github Pages [skip ci]";
git push -qf https://github.com/${TRAVIS_REPO_SLUG}.git master:gh-pages;
echo "done.";
cd ..
