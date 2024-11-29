#!/bin/bash

# Clean up any existing builds
rm -rf dist
rm -f lexia-command.zip

# Create distribution directory
mkdir -p dist/lexia-command
mkdir -p dist/lexia-command/languages

# Build JavaScript/CSS assets
npm run build

# Copy only the necessary files
cp -r \
    lexia-command.php \
    README.txt \
    LICENSE.txt \
    includes \
    build \
    languages \
    dist/lexia-command/

# Create the zip file
cd dist && zip -r ../lexia-command.zip lexia-command

# Clean up
rm -rf dist

echo "Plugin package created: lexia-command.zip" 