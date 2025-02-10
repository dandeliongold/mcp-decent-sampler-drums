#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { PRESET_PROMPT } from "./prompts/preset_guidelines.js";
import { analyzeWavFile } from './wav-analysis.js';
import { DrumKitConfig, generateGroupsXml, isDrumKitConfig } from './drum-kit.js';
import { configureRoundRobin } from './round-robin.js';

const server = new Server(
  {
    name: "decent-sampler-drums",
    version: "0.0.7",
  },
  {
    capabilities: {
      prompts: {},
      tools: {},
    },
  }
);


server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "preset_guidelines",
        description: "Guidelines for structuring Decent Sampler preset files",
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "preset_guidelines") {
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: PRESET_PROMPT,
          },
        },
      ],
    };
  }
  throw new McpError(
    ErrorCode.MethodNotFound,
    `Unknown prompt: ${request.params.name}`
  );
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "configure_round_robin",
        description: "Configure round robin sample playback for a set of samples.\n\nThis tool will:\n- Validate sequence positions\n- Verify sample files exist\n- Generate proper XML structure for round robin playback",
        inputSchema: {
          type: "object",
          properties: {
            directory: {
              type: "string",
              description: "Absolute path to the directory containing samples"
            },
            mode: {
              type: "string",
              enum: ["round_robin", "random", "true_random", "always"],
              description: "Round robin playback mode"
            },
            length: {
              type: "number",
              description: "Number of round robin variations"
            },
            samples: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: {
                    type: "string",
                    description: "Path to sample file (relative to directory)"
                  },
                  seqPosition: {
                    type: "number",
                    description: "Position in the round robin sequence (1 to length)"
                  }
                },
                required: ["path", "seqPosition"]
              }
            }
          },
          required: ["directory", "mode", "length", "samples"]
        }
      },
      {
        name: "analyze_wav_samples",
        description: "Analyze WAV files to detect common issues in drum kit samples such as:\n- Non-standard WAV headers that may cause playback issues\n- Metadata inconsistencies that could affect multi-mic setups\n\nIMPORTANT: Always use absolute paths (e.g., 'C:/Users/username/Documents/Samples/kick.wav') rather than relative paths.",
        inputSchema: {
          type: "object",
          properties: {
            paths: {
              type: "array",
              items: { type: "string" },
              description: "Array of absolute paths to WAV files to analyze (e.g., ['C:/Users/username/Documents/Samples/kick.wav'])"
            }
          },
          required: ["paths"]
        }
      },
      {
        name: "generate_drum_groups",
        description: `Generate DecentSampler <groups> XML for drum kits.
  
Best Practices:
- IMPORTANT: Always use absolute paths (e.g., 'C:/Users/username/Documents/Samples/kick.wav') rather than relative paths
- Group all samples for a drum piece (e.g., all kick mics) into a single group to prevent voice conflicts
- When using multiple mic positions (e.g., Close, OH, Room), include them all in the same group
- Use velocity layers within a group to control dynamics

Example Structure:
{
  "drumPieces": [{
    "name": "Kick",
    "rootNote": 36,
    "samples": [
      // All mic positions for soft velocity
      {"path": "C:/Users/username/Documents/Samples/Kick_Close_Soft.wav"},
      {"path": "C:/Users/username/Documents/Samples/Kick_OH_L_Soft.wav"},
      {"path": "C:/Users/username/Documents/Samples/Kick_OH_R_Soft.wav"},
      // All mic positions for medium velocity
      {"path": "C:/Users/username/Documents/Samples/Kick_Close_Medium.wav"}
      ...
    ]
  }]
}

Workflow:
1. Configure your drum pieces with appropriate paths and settings
2. Pass the complete configuration to generate_drum_groups to create the XML`,
        inputSchema: {
          type: "object",
          properties: {
            globalSettings: {
              type: "object",
              properties: {
                velocityLayers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      low: { type: "number" },
                      high: { type: "number" },
                      name: { type: "string" }
                    },
                    required: ["low", "high", "name"]
                  }
                }
              },
              required: []
            },
            drumPieces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  rootNote: { type: "number" },
                  samples: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        volume: { type: "string" }
                      },
                      required: ["path"]
                    }
                  },
                  muting: {
                    type: "object",
                    properties: {
                      tags: { type: "array", items: { type: "string" } },
                      silencedByTags: { type: "array", items: { type: "string" } }
                    },
                    required: ["tags", "silencedByTags"]
                  }
                },
                required: ["name", "rootNote", "samples"]
              }
            }
          },
          required: ["globalSettings", "drumPieces"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "configure_round_robin": {
      const args = request.params.arguments;
      if (!args || typeof args !== 'object' || 
          typeof args.directory !== 'string' ||
          typeof args.mode !== 'string' ||
          typeof args.length !== 'number' ||
          !Array.isArray(args.samples)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid arguments: expected object with directory, mode, length, and samples"
        );
      }

      if (!['round_robin', 'random', 'true_random', 'always'].includes(args.mode)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid mode: must be one of 'round_robin', 'random', 'true_random', 'always'"
        );
      }

      try {
        const config = configureRoundRobin(args.directory, {
          mode: args.mode as "round_robin" | "random" | "true_random" | "always",
          length: args.length,
          groups: [{
            name: "Samples",
            samples: args.samples.map(s => ({
              path: String(s.path),
              seqPosition: Number(s.seqPosition)
            }))
          }]
        });
        const xml = generateGroupsXml(config);
        return {
          content: [{
            type: "text",
            text: xml
          }]
        };
      } catch (error: unknown) {
        if (error instanceof McpError) throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to configure round robin: ${message}`
        );
      }
    }

    case "analyze_wav_samples": {
      const args = request.params.arguments;
      if (!args || !Array.isArray(args.paths)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid arguments: expected array of paths"
        );
      }

      try {
        const analyses = await Promise.all(
          args.paths.map(path => analyzeWavFile(path))
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify(analyses, null, 2)
          }]
        };
      } catch (error: unknown) {
        if (error instanceof McpError) throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to analyze WAV files: ${message}`
        );
      }
    }
    
    case "generate_drum_groups": {

      // Validate input matches our expected type
      const args = request.params.arguments;
      if (!args || typeof args !== 'object') {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid arguments: expected object"
        );
      }

      if (!isDrumKitConfig(args)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid arguments: does not match DrumKitConfig schema"
        );
      }

      const config = args;
      const xml = generateGroupsXml(config);

      return {
        content: [{
          type: "text",
          text: xml
        }]
      };
    }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Decent Sampler Drums MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
