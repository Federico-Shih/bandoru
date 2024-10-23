#!/bin/bash

PYTHON_VERSION="3.12"

rm -Rf build .bundle .deps &> /dev/null

mkdir -p .bundle .deps .pip_cache build &> /dev/null

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
  zip -q -x "*/__pycache__/*" -r /build/$function_name.zip .
  cd ..

  rm -f ./bundle/lambda_function.py
done


echo -e "\nCleaning up..."
rm -Rf bundle.zip .bundle

echo -e "\nDone"
