# Use the official Node.js image from Docker Hub
FROM node:latest

# Install dependencies
RUN apt-get update && apt-get install -y wget curl

# Download and install wait-for-it
RUN curl -o /usr/local/bin/wait-for-it https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh && \
    chmod +x /usr/local/bin/wait-for-it

# Set the working directory inside the container
WORKDIR /usr/src/crawler

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the application port (adjust as needed)
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "crawler"]
