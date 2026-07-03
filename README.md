# MedVision+ - Backend API Server & MCP Engine

This repository contains the Node.js API server for **MedVision+** as well as the integrated **Model Context Protocol (MCP) Server**. It manages user authentication, user safety profiles, allergen checking logic, and price-sorted bioequivalent substitutions.

---

## 📁 Project Structure (Backend Only)
```
backend/
├── 📂 mcp-server/                  # Model Context Protocol Server
│   ├── 📄 index.js                 # stdio-based MCP entrypoint
│   └── 📄 package.json             # MCP server dependencies
│
├── 📄 server.js                   # Express server entry point
├── 📄 package.json                # Express dependencies
├── 📄 .env                        # Environment variables
├── 📂 routes/                     # API route definitions
├── 📂 controllers/                # Express request handlers
├── 📂 services/                   # LLM, pricing, and user services
├── 📂 utils/                      # Input validation & formatting
├── 📂 config/                     # Environment configuration
├── 📂 database/                   # Local JSON database stores
└── 📂 docs/
    ├── 📄 API.md                  # REST API endpoints documentation
    └── 📄 KAGGLER_WRITEUP.md      # Hackathon Writeup Submission Report
```

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js (v16+)
- API Keys: Groq API Key & NVIDIA API Key

### 1. Run the Express Backend Server
```bash
# Install dependencies
npm install

# Create a .env file and add your credentials:
# GROQ_API_KEY=your_groq_api_key_here
# NV_API_KEY=your_nvidia_vision_api_key_here
# PORT=3000

# Start the Express API server
npm start
```
The server runs on **http://localhost:3000**.

### 2. Run the Model Context Protocol (MCP) Server
The MCP server allows external AI agents to securely query MedVision+ tools directly.
```bash
# Navigate to mcp-server directory
cd mcp-server

# Install dependencies
npm install

# Start the MCP server (uses stdio transport)
node index.js
```

---

## 🛡️ Hackathon Evaluation Concept Mapping

| Key Concept | Implementation Details | Location in Code |
| :--- | :--- | :--- |
| **Model Context Protocol (MCP)** | Implements a stdio transport server exposing `get_medicine_info`, `check_allergy_clash`, and `add_reminder` as reusable tools for AI clients. | [mcp-server/index.js](file:///c:/Users/Kundan/Downloads/MedVisionApp%202/MedVisionApp%202/backend/mcp-server/index.js) |
| **Agent System** | Groq-powered safety engine operates as a medical agent—reasoning about structural drug family groups, generating conflict descriptions, and dynamically ranking safe choices. | [services/groq.service.js](file:///c:/Users/Kundan/Downloads/MedVisionApp%202/MedVisionApp%202/backend/services/groq.service.js) |
| **Security Features** | Standard JWT bearer authorization, password hashing with bcrypt, input sanitation constraints. | [middleware/auth.middleware.js](file:///c:/Users/Kundan/Downloads/MedVisionApp%202/MedVisionApp%202/backend/middleware/auth.middleware.js) |
| **Deployability** | Deployed backend on Render, runs Express port listens immediately to pass health checks during startup sequences. | [server.js](file:///c:/Users/Kundan/Downloads/MedVisionApp%202/MedVisionApp%202/backend/server.js) |

---

## 📝 License
© MedVision+. Advancing healthcare through AI innovation.
