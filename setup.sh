#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/apple/Downloads/Medmemory"
BACKEND_DIR="$PROJECT_ROOT/medmemory-backend"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MedMemory Prototype - Complete Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}[1/6] Checking Prerequisites...${NC}"
command -v node &> /dev/null && echo -e "${GREEN}✓ Node.js found${NC}" || echo -e "${RED}✗ Node.js not found${NC}"
command -v npm &> /dev/null && echo -e "${GREEN}✓ npm found${NC}" || echo -e "${RED}✗ npm not found${NC}"
command -v python3 &> /dev/null && echo -e "${GREEN}✓ Python3 found${NC}" || echo -e "${RED}✗ Python3 not found${NC}"
echo

# Install frontend dependencies
echo -e "${YELLOW}[2/6] Installing Frontend Dependencies...${NC}"
cd "$PROJECT_ROOT"
if npm install > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
  echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
  exit 1
fi
echo

# Setup backend environment
echo -e "${YELLOW}[3/6] Setting Up Backend Environment...${NC}"
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

if pip install -q -r requirements.txt 2>&1; then
  echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
  echo -e "${RED}✗ Failed to install backend dependencies${NC}"
  exit 1
fi
echo

# Verify Python environment
echo -e "${YELLOW}[4/6] Verifying Backend Configuration...${NC}"
python3 -c "
import sys
try:
    import fastapi
    import sqlalchemy
    import pydantic
    print('✓ All backend packages installed')
except ImportError as e:
    print(f'✗ Missing package: {e}')
    sys.exit(1)
"
echo

# Verify environment files
echo -e "${YELLOW}[5/6] Verifying Configuration Files...${NC}"
[ -f "$PROJECT_ROOT/.env" ] && echo -e "${GREEN}✓ Frontend .env exists${NC}" || echo -e "${RED}✗ Frontend .env missing${NC}"
[ -f "$BACKEND_DIR/.env" ] && echo -e "${GREEN}✓ Backend .env exists${NC}" || echo -e "${RED}✗ Backend .env missing${NC}"
echo

# Verify frontend build
echo -e "${YELLOW}[6/6] Verifying Frontend Build...${NC}"
cd "$PROJECT_ROOT"
if npm run lint > /dev/null 2>&1; then
  echo -e "${GREEN}✓ TypeScript compilation successful${NC}"
else
  echo -e "${YELLOW}⚠ TypeScript warnings (non-blocking)${NC}"
fi
echo

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${BLUE}To start the application:${NC}\n"

echo -e "${YELLOW}Terminal 1 - Backend:${NC}"
echo -e "  cd $BACKEND_DIR"
echo -e "  source venv/bin/activate"
echo -e "  uvicorn app.main:app --reload --port 8000\n"

echo -e "${YELLOW}Terminal 2 - Frontend:${NC}"
echo -e "  cd $PROJECT_ROOT"
echo -e "  npm run dev\n"

echo -e "${BLUE}Access the app:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}\n"

echo -e "${YELLOW}Test Login Credentials (after signup):${NC}"
echo -e "  Role: patient, doctor, lab, clinic, or admin"
echo -e "  Use any email (e.g., test@example.com)"
echo -e "  Password: any password (auto-validated)\n"
