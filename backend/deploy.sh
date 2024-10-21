#!/bin/bash

PYTHON_VERSION="3.12"

rm -Rf bundle.zip .bundle .deps

mkdir -p .bundle .deps .pip_cache


echo -e "\nInstalling requirements..."
pip install \
    -r requirements.txt \
    --target .deps \
    --platform manylinux2014_x86_64 \
    --implementation cp \
    --python-version $PYTHON_VERSION \
    --only-binary=:all: \
    --cache-dir .pip_cache \


echo -e "\nDeploying..."
cp -R src/shared .deps/* .bundle/
for filepath in ./src/*.py; do
  filename="${filepath##*/}"
  function_name=${filename%.py}

  cp "$filepath" .bundle/lambda_function.py

  cd .bundle
  zip -q -x "*/__pycache__/*" -r ../bundle.zip .
  cd ..

  aws lambda update-function-code \
    --no-cli-pager \
    --function-name "$function_name" \
    --zip-file fileb://./bundle.zip

  rm -f ./bundle.zip ./bundle/lambda_function.py
done


echo -e "\nCleaning up..."
rm -Rf bundle.zip .bundle

echo -e "\nDone"
