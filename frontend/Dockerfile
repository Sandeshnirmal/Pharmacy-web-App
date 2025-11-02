# Use a Node.js base image
FROM node:18-alpine as builder

# Set the working directory
WORKDIR /app
RUN apk add --no-cache curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Set environment variable for API base URL
ENV VITE_API_BASE_URL=http://localhost:8000/

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Use a Node.js base image for serving (or just the builder image if it's small enough)
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Install a simple static file server
RUN npm install -g serve

# Expose port 80
EXPOSE 80

# Start the static file server
CMD ["serve", "-s", "dist", "-l", "80"]
