FROM node:20.18
RUN apt-get update && apt-get install -y jq

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY . /frontend

WORKDIR /frontend
RUN pnpm install
RUN ./env.sh
RUN rm -rf /frontend/dist/frontend/
CMD [ "pnpm", "build" ]



