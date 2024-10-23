FROM ubuntu:latest

WORKDIR /tmp

# Install dependencies
RUN	apt-get update -y &&\
	apt-get upgrade -y &&\
	apt-get install -y python3 python3-pip nodejs npm gnupg software-properties-common curl wget zip unzip jq &&\
	npm i -g pnpm


# Install and configure aws-cli
RUN	curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" &&\
	unzip awscliv2.zip &&\
	./aws/install &&\
	mkdir -p ~/.aws && echo "[default]" > ~/.aws/config && echo "region = us-east-1" >> ~/.aws/config


# Install terraform
RUN	wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg &&\
	echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list &&\
	apt-get update -y && apt-get install -y terraform



WORKDIR /app

CMD [ "/bin/bash", "./full_deploy.sh" ]
