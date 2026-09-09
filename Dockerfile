FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose port (Render overrides PORT at runtime)
EXPOSE 5001

# Start the application
CMD ["npm", "start"]

