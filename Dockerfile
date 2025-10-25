# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.20.0

FROM node:${NODE_VERSION}-alpine
WORKDIR /app

# Copy the package.json and package-lock.json files into the image.
COPY package*.json ./
RUN npm config set strict-ssl false
# Install the dependencies.
RUN npm install --legacy-peer-deps


COPY . .


EXPOSE 3000

# Run the application.
CMD ["npm", "run", "dev"]