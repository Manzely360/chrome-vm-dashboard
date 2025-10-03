FROM --platform=linux/amd64 ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:1
ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    software-properties-common \
    curl \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    xfce4 \
    xfce4-goodies \
    supervisor \
    dbus-x11 \
    xfonts-base \
    xfonts-75dpi \
    xfonts-100dpi \
    xfonts-scalable \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create chrome user
RUN useradd -m -s /bin/bash chromeuser \
    && usermod -aG audio,video chromeuser

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application files
COPY agent.js ./
COPY start-desktop.sh ./
COPY start.sh ./

# Make scripts executable
RUN chmod +x start-desktop.sh start.sh

# Create supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create directories
RUN mkdir -p /home/chromeuser/.config/google-chrome \
    && mkdir -p /home/chromeuser/.vnc \
    && mkdir -p /var/log/supervisor

# Set permissions
RUN chown -R chromeuser:chromeuser /home/chromeuser \
    && chown -R chromeuser:chromeuser /app

# Expose ports
EXPOSE 3000 6080

# Switch to chrome user
USER chromeuser

# Start all services with our custom script
CMD ["/app/start.sh"]