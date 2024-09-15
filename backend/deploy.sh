#!/bin/bash

FUNCTION_NAME="BandoruAPI"

rm -f bundle.zip

mkdir -p .bundle
mkdir -p .pip_cache


echo -e "\nInstalling requirements..."
pip install \
    -r requirements.txt \
    --target .bundle \
    --platform manylinux2014_x86_64 \
    --implementation cp \
    --python-version 3.12 \
    --only-binary=:all: \
    --cache-dir .pip_cache \


echo -e "\nCopying files..."
cp -R src/* .bundle/

cd .bundle

echo -e "\nZipping..."
zip -q -x "*/__pycache__/*" -r ../bundle.zip .

cd ..

echo -e "\nDeploying to AWS Lambda..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://./bundle.zip

echo -e "\nCleaning up..."
rm -f bundle.zip

echo -e "\nDone"
