#!/bin/bash

docker build -t deploy .
docker run --rm -v .:/app -v ~/.aws/credentials:/root/.aws/credentials deploy