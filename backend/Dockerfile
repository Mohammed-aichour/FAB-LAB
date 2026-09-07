FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install

# Copy application source
COPY . .

# Expose default port
EXPOSE 8000

# Start server
CMD ["npm", "start"]
