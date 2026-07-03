# MedVision+: Personal AI Health Guard & Medicine Safety Engine

**Track:** Concierge Agents
**Submitting Authors:** MedVision+ Capstone Team
**Date:** July 2026

---

## 1. Project Title & Subtitle

### **MedVision+**
> *Personal AI Health Guard & Medicine Safety Engine: Combating medication errors and accidental allergen ingestion through vision intelligence, LLM orchestration, and Model Context Protocol (MCP) tool integration.*

---

## 2. Executive Summary & Problem Statement

In modern healthcare, medication management remains one of the most high-risk personal health challenges. Every year, millions of individuals experience adverse drug events due to:
1. **Look-alike/Sound-alike (LASA) Medications:** Brand names that look or sound almost identical but contain completely different active pharmaceutical ingredients (APIs).
2. **Hidden Allergens:** Active chemical compounds hidden behind commercial brand names (e.g., a patient allergic to Penicillin or Sulfa drugs taking an antibiotic without realizing it belongs to the same beta-lactam or sulfonamide chemical family).
3. **Complex Packaging Fine Print:** Elderly patients or individuals with visual impairments struggling to read the microscopic composition text printed on drug boxes or blister packs.
4. **Out-of-Pocket Cost Burdens:** A lack of immediate awareness regarding cheaper, bioequivalent generic alternatives with the exact same active ingredients.

Traditional digital solutions are static, relying on hard-coded keyword searches that fail when faced with spelling errors, unstructured photo inputs, or complex drug-allergy reasoning (e.g., recognizing that Ciprofloxacin and Levofloxacin share cross-reactivity risks).

**MedVision+** solves this by establishing a secure, intelligent, agentic concierge system that:
- Captures image photos of packaging using computer vision.
- Translates visual text into structured medical data using LLM reasoning.
- Automatically cross-references chemical compositions against a patient’s personalized, secure allergy profile.
- Suggests cost-effective generic alternatives.
- Schedules automated reminders to guarantee adherence.

---

## 3. Why Agents? The Paradigm Shift in Medical Concierge

Static databases cannot solve the medical safety challenge because medical query inputs are highly unstructured (photos, handwritten prescriptions, spelling variations). 

An **Agentic Approach** is uniquely suited for this task due to three key capabilities:
1. **Semantic Extraction and Translation:** Unlike basic OCR text matching, an LLM agent behaves as a pharmaceutical expert, understanding that a label containing "Aspirin 500mg" translates to Acetylsalicylic Acid, and mapping it to the NSAID drug family.
2. **Dynamic Clinical Reasoning:** The agent doesn't just look up items; it reasons about patient safety. If a user is allergic to "Beta-lactams" and inputs "Amoxicillin", the agent analyzes the chemical family, flags the conflict, and generates a detailed, patient-friendly safety warning.
3. **Autonomous Tool Use:** The agent coordinates multiple services. It queries the local pricing database for bioequivalent substitutes, fetches clinical data from external LLM APIs, and formats the output into a standardized JSON schema.

---

## 4. Overall Architecture & Multi-Agent Collaboration

MedVision+ is designed as a modular, full-stack application featuring a decoupled, secure backend, a futuristic user dashboard, and a standardized Model Context Protocol (MCP) layer.

```
       +-------------------------------------------------------+
       |                  User Interface                       |
       |  - Flask Frontend Web Application (Port 5002)         |
       |  - Real-Time Camera Upload & Search Dashboard        |
       +---------------------------+---------------------------+
                                   | (JSON / API Calls)
                                   v
       +-------------------------------------------------------+
       |             Node.js Backend Server (Port 3000)        |
       |  - REST Express Routing & Auth Controllers            |
       |  - MongoDB (Persisted Profiles & Allergies)           |
       +-------+-------------------+-------------------+-------+
               |                   |                   |
               v                   v                   v
      +------------------+  +--------------+  +------------------+
      |  Nvidia Llama    |  |  Groq LLM    |  | Local DB Service |
      |  (Image Parsing) |  |  (Llama-3.3) |  |  (Pricing &      |
      |  (Image Parsing) |  |  (Reasoning) |  |  Alternatives)   |
      +------------------+  +--------------+  +------------------+
                                   ^
                                   | (Tool Calls / stdio)
       +---------------------------+---------------------------+
       |         Model Context Protocol (MCP) Server           |
       |  - Exposes get_medicine_info, check_allergy_clash     |
       |  - Integrates with any compliant LLM client (e.g. IDE)|
       +-------------------------------------------------------+
```

### Components:
- **Frontend Dashboard (Flask / CSS / JS):** A glassmorphic, responsive landing page using Outfit typography, equipped with interactive modals for manual drug searches, drag-and-drop packaging photo uploads, and an alarm notification console.
- **API Orchestrator (Node.js Express):** Manages user sessions, auth middleware, and forwards processing pipelines.
- **Multimodal Visual Parser (NVIDIA Llama-3.2-90b-Vision):** Decodes raw, unstructured photos of medical packaging into clean string drug names.
- **Clinical Safety Agent (Groq Llama-3.3-70b-Versatile):** Conducts safety checks, verifies composition drug-allergy clashes, and suggests therapeutic alternatives.
- **Local Pricing Engine:** Automatically looks up Indian Rupee (INR) prices from a mock pharmaceutical database to rank bioequivalent alternatives by cost, highlighting options that are allergy-safe.
- **Model Context Protocol (MCP) Server:** Implements the open-source protocol to allow any external AI agent to securely query the MedVision+ backend tools.

---

## 5. Course Key Concepts Demonstrated in Code

To show the mastery of agentic development, MedVision+ incorporates three key concepts from the course:

### A. Model Context Protocol (MCP) Server
We built a stdio-based MCP server in `mcp-server/index.js` using `@modelcontextprotocol/sdk`. This server exposes three key tools:
1. `get_medicine_info`: Pulls composition, dosage form, uses, and side effects.
2. `check_allergy_clash`: Cross-references ingredients against allergy profiles.
3. `add_reminder`: Writes to the local reminders system.

This enables external developer agents (like Antigravity) to call MedVision+ tools directly during workflow executions, showcasing true interoperability.

### B. Agent / Multi-Agent System (ADK)
The reasoning pipeline in `backend/services/groq.service.js` operates as a specialized safety agent. It doesn't perform a simple static match. Instead, it takes a patient's allergy profile (e.g. `['penicillin']`) and the query drug (e.g. `Ceflox`). It analyzes whether there are structural or class relationships (both are beta-lactams), flags an allergen conflict, writes a customized rationale, and forces the alternative recommendations to list *allergy-safe* options first.

### C. Security Features
Patient safety requires strict data privacy. We implemented several layer-defense security features:
1. **JWT-Authentication Session Management:** User tokens are cryptographically signed using HS256 algorithm and validated via `backend/middleware/auth.middleware.js` to prevent access spoofing.
2. **Cryptographic Password Hashing:** User passwords are secured using bcrypt with a salt factor of 10 (`backend/services/user.service.js`) preventing plain-text leaks.
3. **Input Sanitization and Validation:** Custom request validation (`backend/utils/validator.js`) restricts queries to a maximum of 100 characters and strips malicious HTML/SQL injections.

---

## 6. Walkthrough & User Demo Flow

1. **Dashboard Access:** The user logs in securely. Their dashboard displays their recorded allergies (e.g., Aspirin).
2. **Visual Scan:** The user snaps a picture of a pill box. The image is sent to the Express controller, processed by the NVIDIA vision engine, and identified as "Ecotrin".
3. **Safety Engine Evaluation:** The safety agent identifies "Ecotrin" as Aspirin (NSAID). It flags an immediate conflict with the user's recorded Aspirin allergy.
4. **Visual Alert:** The UI lights up in a neon warning color, displaying a warning: *"⚠️ Clash detected: Ecotrin contains Aspirin which matches your recorded allergy."*
5. **Alternative Recommendations:** The engine lists alternative medications (e.g., Paracetamol) which do not conflict with their allergy, sorted by price.
6. **Reminders & Audio Alerts:** The user schedules a daily intake reminder. When the time is reached, an audio alarm plays, prompting the user.

---

## 7. Setup & Execution Instructions

To run the full stack locally:

### Prerequisites:
- Node.js (v16+)
- Python 3.8+
- Groq API Key & NVIDIA API Key

### Step 1: Backend Setup
```bash
cd backend
npm install
# Add GROQ_API_KEY, NV_API_KEY, and MONGO_URI to .env
npm start
```
*Runs on http://localhost:3000*

### Step 2: Frontend Setup
```bash
cd frontend
pip install -r requirements.txt
python app.py
```
*Runs on http://localhost:5002*

### Step 3: Run the MCP Server
```bash
cd backend/mcp-server
npm install
node index.js
```

---

## 8. Conclusion & Future Roadmap

MedVision+ represents a practical, high-value concierge agent designed to protect individuals from preventable medication errors. By bridging advanced LLM reasoning, multimodal computer vision, and standard-based Model Context Protocol interfaces, we have constructed a tool that is highly secure, easily deployable, and ready for integration into smart-home and wearable ecosystems. 

Our roadmap includes integrating public clinical APIs (like openFDA) to retrieve live drug recall warnings and expanding support to multi-language translation for regional drug packaging.
