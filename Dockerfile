FROM node:20-alpine

WORKDIR /amply

COPY ./package.json ./package.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY turbo.json turbo.json

RUN npm install -g pnpm

RUN pnpm install

COPY . .

RUN cd apps/web

RUN pnpm install


EXPOSE 3000

CMD ["pnpm", "run", "dev"]


