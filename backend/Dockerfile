# --- Base image ---
FROM node:18

# --- Working directory inside container ---
WORKDIR /app

# --- Copy package.json and install deps ---
COPY package*.json ./
RUN npm install

# --- Copy the rest of the backend code ---
COPY . .

# --- Expose port for backend ---
EXPOSE 5000

# --- Start command ---
CMD ["npm", "start"]
