FROM node:22-alpine

LABEL maintainer="BooksReader Development Team"
LABEL version="2.0"
LABEL description="BooksReader Backend Server with Python/Poppler support for cover generation"

# Install build dependencies for native modules (canvas, sharp, etc.)
RUN apk add --no-cache \
  python3 \
  py3-pip \
  make \
  g++ \
  gcc \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev \
  pixman-dev \
  pkgconfig \
  poppler-utils \
  py3-pillow \
  py3-setuptools \
  libstdc++

# Set Python executable path for cover generation
ENV COVER_PYTHON_PATH=python3
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies (includes canvas and sharp with native bindings)
RUN npm ci --only=production

# Copy Python requirements
COPY Cover_Image_Generator/requirements.txt ./Cover_Image_Generator/
RUN pip3 install --no-cache-dir --break-system-packages -r Cover_Image_Generator/requirements.txt

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 && \
  chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
