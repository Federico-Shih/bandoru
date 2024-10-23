FROM python:3.12

RUN apt update && apt install -y zip

COPY . /backend

WORKDIR /backend

CMD ["./deploy.sh"]