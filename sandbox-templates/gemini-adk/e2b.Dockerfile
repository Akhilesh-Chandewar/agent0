# e2b.Dockerfile for Google ADK Agent Development
FROM python:3.11-slim

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    wget \
    vim \
    nano \
    jq \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (useful for some agent tools)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install core Python packages
RUN pip install --upgrade pip setuptools wheel

# Install Google ADK and related dependencies
RUN pip install \
    google-genai \
    google-generativeai \
    google-cloud-aiplatform \
    google-auth \
    google-auth-oauthlib \
    google-auth-httplib2 \
    google-api-python-client

# Install common agent development libraries
RUN pip install \
    langchain \
    langchain-google-genai \
    langgraph \
    pydantic \
    httpx \
    requests \
    aiohttp \
    python-dotenv \
    tenacity \
    tiktoken \
    jsonschema \
    pyyaml \
    rich \
    click \
    fastapi \
    uvicorn \
    websockets

# Install data processing libraries
RUN pip install \
    pandas \
    numpy \
    sqlalchemy \
    chromadb \
    faiss-cpu \
    sentence-transformers

# Install testing and development tools
RUN pip install \
    pytest \
    pytest-asyncio \
    black \
    flake8 \
    mypy \
    ipython

# Create working directory
WORKDIR /workspace

# Create directories for agent projects
RUN mkdir -p /workspace/agents /workspace/tools /workspace/data /workspace/configs

# Set up a default configuration directory
ENV GOOGLE_APPLICATION_CREDENTIALS=/workspace/configs/google-credentials.json

# Create a basic entrypoint script
RUN echo '#!/bin/bash\n\
echo "Google ADK Agent Builder Environment Ready"\n\
echo "Python version: $(python --version)"\n\
echo "Node version: $(node --version)"\n\
echo ""\n\
echo "Available packages:"\n\
echo "  - google-genai"\n\
echo "  - langchain"\n\
echo "  - langgraph"\n\
echo "  - fastapi"\n\
echo ""\n\
echo "Working directory: /workspace"\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/bin/bash"]