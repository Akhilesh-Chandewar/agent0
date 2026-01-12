#!/bin/bash

# compile_page.sh - E2B Agent Builder Compilation Script
# This script sets up and validates the agent development environment

set -e  # Exit on error

echo "=========================================="
echo "E2B Agent Builder - Environment Compilation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check Python installation
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
else
    print_error "Python not found!"
    exit 1
fi

# Check pip installation
echo "Checking pip installation..."
if command -v pip &> /dev/null; then
    PIP_VERSION=$(pip --version)
    print_success "Pip installed: $PIP_VERSION"
else
    print_error "Pip not found!"
    exit 1
fi

# Verify Google ADK packages
echo ""
echo "Verifying Google ADK packages..."
GOOGLE_PACKAGES=("google-genai" "google-generativeai" "langchain" "langgraph" "pydantic")

for package in "${GOOGLE_PACKAGES[@]}"; do
    if pip show "$package" &> /dev/null; then
        VERSION=$(pip show "$package" | grep Version | cut -d' ' -f2)
        print_success "$package ($VERSION)"
    else
        print_error "$package not installed"
    fi
done

# Check Node.js (if needed)
echo ""
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_info "Node.js not found (optional)"
fi

# Create necessary directories
echo ""
echo "Setting up workspace directories..."
DIRS=("/workspace/agents" "/workspace/tools" "/workspace/data" "/workspace/configs" "/workspace/logs" "/workspace/output")

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    else
        print_info "Directory exists: $dir"
    fi
done

# Create a sample agent configuration
echo ""
echo "Creating sample configuration files..."

# Create a sample .env template
cat > /workspace/.env.example << 'EOF'
# Google ADK Configuration
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=/workspace/configs/google-credentials.json

# Agent Configuration
AGENT_NAME=default_agent
AGENT_MODEL=gemini-pro
AGENT_TEMPERATURE=0.7
AGENT_MAX_TOKENS=2048

# Vector Store Configuration
VECTOR_STORE_TYPE=chromadb
VECTOR_STORE_PATH=/workspace/data/vector_store

# API Configuration (if exposing agents via API)
API_HOST=0.0.0.0
API_PORT=8000
EOF

print_success "Created .env.example template"

# Create a sample agent configuration
cat > /workspace/configs/agent_config.yaml << 'EOF'
# Agent Configuration Template
agent:
  name: "default_agent"
  description: "A configurable agent built with Google ADK"
  model: "gemini-pro"
  temperature: 0.7
  max_tokens: 2048
  
tools:
  enabled:
    - web_search
    - code_execution
    - file_operations
  
memory:
  type: "conversation_buffer"
  max_messages: 10
  
vector_store:
  enabled: true
  type: "chromadb"
  persist_directory: "/workspace/data/vector_store"
  
logging:
  level: "INFO"
  file: "/workspace/logs/agent.log"
EOF

print_success "Created agent_config.yaml template"

# Create a sample Python agent starter
cat > /workspace/agents/sample_agent.py << 'EOF'
"""
Sample Agent Implementation using Google ADK
"""
import os
from google import genai
from google.genai import types

class SimpleAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=self.api_key)
        
    def run(self, prompt: str, model: str = "gemini-2.0-flash-exp") -> str:
        """Execute agent with given prompt"""
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=prompt
            )
            return response.text
        except Exception as e:
            return f"Error: {str(e)}"

if __name__ == "__main__":
    # Example usage
    agent = SimpleAgent()
    result = agent.run("Hello! Introduce yourself as an AI agent.")
    print(result)
EOF

print_success "Created sample_agent.py"

# Create a requirements.txt file for reference
cat > /workspace/requirements.txt << 'EOF'
# Google ADK Core
google-genai
google-generativeai
google-cloud-aiplatform
google-auth
google-auth-oauthlib

# Agent Framework
langchain
langchain-google-genai
langgraph
pydantic

# Utilities
httpx
requests
aiohttp
python-dotenv
tenacity
tiktoken
jsonschema
pyyaml
rich
click

# API Framework
fastapi
uvicorn
websockets

# Data & Vector Store
pandas
numpy
sqlalchemy
chromadb
faiss-cpu
sentence-transformers

# Development Tools
pytest
pytest-asyncio
black
flake8
mypy
ipython
EOF

print_success "Created requirements.txt"

# Validate Python syntax of created files
echo ""
echo "Validating Python files..."
if python3 -m py_compile /workspace/agents/sample_agent.py 2>/dev/null; then
    print_success "sample_agent.py syntax valid"
else
    print_error "sample_agent.py has syntax errors"
fi

# Create a README
cat > /workspace/README.md << 'EOF'
# Google ADK Agent Builder Environment

This workspace is configured for building agents using Google's Agent Development Kit (ADK).

## Directory Structure
- `/workspace/agents/` - Your agent implementations
- `/workspace/tools/` - Custom tools for agents
- `/workspace/data/` - Data storage and vector stores
- `/workspace/configs/` - Configuration files
- `/workspace/logs/` - Application logs
- `/workspace/output/` - Agent outputs

## Getting Started

1. Set up your environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. Run the sample agent:
   ```bash
   cd /workspace/agents
   python sample_agent.py
   ```

3. Build your custom agent by modifying the templates

## Resources
- Google Generative AI: https://ai.google.dev/
- LangChain Docs: https://python.langchain.com/
- LangGraph Docs: https://langchain-ai.github.io/langgraph/
EOF

print_success "Created README.md"

# Set permissions
echo ""
echo "Setting permissions..."
chmod +x /workspace/agents/*.py 2>/dev/null || true
chmod 644 /workspace/configs/* 2>/dev/null || true
print_success "Permissions set"

# Summary
echo ""
echo "=========================================="
echo "Compilation Complete!"
echo "=========================================="
echo ""
print_info "Workspace ready at: /workspace"
print_info "Sample agent: /workspace/agents/sample_agent.py"
print_info "Config template: /workspace/configs/agent_config.yaml"
print_info "Env template: /workspace/.env.example"
echo ""
print_success "Environment is ready for agent development!"
echo ""

# Display next steps
echo "Next Steps:"
echo "1. Configure your Google API credentials"
echo "2. Review and customize agent_config.yaml"
echo "3. Start building your agents in /workspace/agents/"
echo "4. Run: python /workspace/agents/sample_agent.py"
echo ""

exit 0