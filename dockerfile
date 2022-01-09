FROM node:16.13-bullseye-slim

# パッケージ関連の作業
RUN apt-get update && apt-get install -y \
    vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* 