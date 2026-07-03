import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend reminders.json (adjusted for backend/mcp-server location)
const REMINDERS_FILE = path.join(__dirname, "../../frontend/reminders.json");

// Create MCP Server instance
const server = new Server(
  {
    name: "medvision-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_medicine_info",
        description: "Retrieve comprehensive details for a medicine from MedVision+, including composition, strength, dosage form, uses, side effects, price-sorted alternatives, and check for allergen clashes.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The brand name or active composition of the medicine to search (e.g., 'Paracetamol', 'Aspirin').",
            },
            allergies: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Optional list of patient allergies (e.g. ['penicillin', 'aspirin']) to check for conflicts.",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "check_allergy_clash",
        description: "Cross-checks a medicine's active ingredients or brand name against a patient's allergy profile to identify drug-allergy clashes.",
        inputSchema: {
          type: "object",
          properties: {
            medicine_name: {
              type: "string",
              description: "The name or composition of the medicine to check.",
            },
            allergies: {
              type: "array",
              items: {
                type: "string",
              },
              description: "List of patient allergies (e.g. ['penicillin', 'aspirin']).",
            },
          },
          required: ["medicine_name", "allergies"],
        },
      },
      {
        name: "add_reminder",
        description: "Schedules a medication reminder time inside the system.",
        inputSchema: {
          type: "object",
          properties: {
            medicine: {
              type: "string",
              description: "Name of the medicine.",
            },
            time: {
              type: "string",
              description: "Time in HH:MM format (24-hour clock, e.g. '08:00', '20:30').",
            },
          },
          required: ["medicine", "time"],
        },
      },
    ],
  };
});

// Configure backend base URL
const BACKEND_URL = process.env.BACKEND_URL || "https://medvision-backend-egoh.onrender.com";

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_medicine_info") {
      const searchName = args.name;
      const allergiesList = args.allergies ? args.allergies.join(",") : "";
      
      const response = await axios.get(`${BACKEND_URL}/api/medicine/info`, {
        params: {
          name: searchName,
          allergies: allergiesList,
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } 
    
    if (name === "check_allergy_clash") {
      const { medicine_name, allergies } = args;
      const response = await axios.get(`${BACKEND_URL}/api/medicine/info`, {
        params: {
          name: medicine_name,
          allergies: allergies.join(","),
        },
      });

      const data = response.data;
      const result = {
        medicine: medicine_name,
        allergy_warning: data.allergyWarning || false,
        allergy_details: data.allergyDetails || "No allergy warnings found.",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } 
    
    if (name === "add_reminder") {
      const { medicine, time } = args;
      
      // Load current reminders from file
      let reminders = [];
      if (fs.existsSync(REMINDERS_FILE)) {
        try {
          const fileData = fs.readFileSync(REMINDERS_FILE, "utf-8");
          reminders = JSON.parse(fileData);
        } catch (e) {
          reminders = [];
        }
      }

      const newReminder = {
        id: Date.now(),
        medicine: medicine.trim(),
        time: time.trim(),
      };

      reminders.push(newReminder);
      fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));

      return {
        content: [
          {
            type: "text",
            text: `Successfully scheduled reminder for ${medicine} at ${time}.`,
          },
        ],
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing tool: ${errorMsg}`,
        },
      ],
    };
  }
});

// Run server using StdioTransport
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MedVision+ MCP Server running on stdio");
}

run().catch((error) => {
  console.error("Failed to run MCP server:", error);
  process.exit(1);
});
