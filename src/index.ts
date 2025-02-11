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
import { DrumControlsConfig, configureDrumControls } from './drum-controls.js';
import { configureRoundRobin } from './round-robin.js';
import { MicBusConfig, DrumMicConfig, validateMicRouting } from './mic-routing.js';

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
        name: "configure_drum_controls",
        description: `Configure global pitch and envelope controls for each drum type.

This tool will:
- Add per-drum pitch controls with customizable ranges
- Configure ADSR envelope settings for natural decay control
- Generate proper XML structure for global drum controls

Error Handling:
- Validates pitch range values (min/max must be valid numbers)
- Ensures envelope times are positive values
- Verifies curve values are within -100 to 100 range
- Returns detailed error messages for invalid configurations

Success Response:
Returns XML structure containing:
- Global controls for each drum type
- MIDI CC mappings for real-time control
- Properly formatted parameter bindings`,
        inputSchema: {
          type: "object",
          properties: {
            drumControls: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  pitch: {
                    type: "object",
                    properties: {
                      default: { 
                        type: "number",
                        description: "Default pitch in semitones (0 = no change)"
                      },
                      min: { 
                        type: "number",
                        description: "Minimum pitch adjustment (e.g. -12 semitones)"
                      },
                      max: { 
                        type: "number",
                        description: "Maximum pitch adjustment (e.g. +12 semitones)"
                      }
                    },
                    required: ["default"]
                  },
                  envelope: {
                    type: "object",
                    properties: {
                      attack: { 
                        type: "number",
                        description: "Attack time in seconds"
                      },
                      decay: { 
                        type: "number",
                        description: "Decay time in seconds"
                      },
                      sustain: { 
                        type: "number",
                        description: "Sustain level (0-1)"
                      },
                      release: { 
                        type: "number",
                        description: "Release time in seconds"
                      },
                      attackCurve: { 
                        type: "number",
                        description: "-100 to 100, Default: -100 (logarithmic)"
                      },
                      decayCurve: { 
                        type: "number",
                        description: "-100 to 100, Default: 100 (exponential)"
                      },
                      releaseCurve: { 
                        type: "number",
                        description: "-100 to 100, Default: 100 (exponential)"
                      }
                    },
                    required: ["attack", "decay", "sustain", "release"]
                  }
                }
              }
            }
          },
          required: ["drumControls"]
        }
      },
      {
        name: "configure_round_robin",
        description: `Configure round robin sample playback for a set of samples.

This tool will:
- Validate sequence positions
- Verify sample files exist
- Generate proper XML structure for round robin playback

Error Handling:
- Checks if sample files exist at specified paths
- Validates sequence positions are unique and sequential
- Ensures mode is one of: round_robin, random, true_random, always
- Returns specific error messages for missing files or invalid sequences

Success Response:
Returns XML structure with:
- Configured playback mode
- Sample sequence assignments
- Proper group organization for round robin playback`,
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
        description: `Analyze WAV files to detect common issues in drum kit samples.

This tool checks for:
- Non-standard WAV headers that may cause playback issues
- Metadata inconsistencies that could affect multi-mic setups
- Sample rate and bit depth compatibility
- Channel configuration issues
- File size and format validation

Error Handling:
- Reports detailed header format issues
- Identifies metadata inconsistencies between related samples
- Flags potential playback compatibility problems
- Returns specific error messages for each issue type

Success Response:
Returns detailed analysis including:
- WAV header information
- Sample metadata
- Potential compatibility issues
- Recommendations for fixes

IMPORTANT: Always use absolute paths (e.g., 'C:/Users/username/Documents/Samples/kick.wav') rather than relative paths.`,
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
        name: "configure_mic_routing",
        description: `Configure multi-mic routing with MIDI controls for drum samples.

This tool will:
- Set up individual volume controls for each mic position (close, OH L/R, room L/R)
- Route each mic to its own auxiliary output for DAW mixing
- Configure MIDI CC mappings for mic volumes
- Generate proper XML structure for DecentSampler

Error Handling:
- Validates mic position assignments
- Checks for duplicate MIDI CC assignments
- Ensures valid output routing targets
- Verifies bus indices are unique and valid
- Returns specific errors for routing conflicts

Success Response:
Returns XML structure containing:
- Configured mic bus routing
- Volume control mappings
- MIDI CC assignments
- Complete routing matrix for all samples`,
        inputSchema: {
          type: "object",
          properties: {
            micBuses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { 
                    type: "string",
                    description: "Display name for the mic (e.g., 'Close Mic', 'OH L')"
                  },
                  outputTarget: { 
                    type: "string",
                    description: "Output routing (e.g., 'AUX_STEREO_OUTPUT_1')"
                  },
                  volume: {
                    type: "object",
                    properties: {
                      default: { 
                        type: "number",
                        description: "Default volume in dB"
                      },
                      min: { 
                        type: "number",
                        description: "Minimum volume in dB (e.g., -96)"
                      },
                      max: { 
                        type: "number",
                        description: "Maximum volume in dB (e.g., 12)"
                      },
                      midiCC: { 
                        type: "number",
                        description: "MIDI CC number for volume control"
                      }
                    },
                    required: ["default"]
                  }
                },
                required: ["name", "outputTarget"]
              }
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
                        micConfig: {
                          type: "object",
                          properties: {
                            position: {
                              type: "string",
                              enum: ["close", "overheadLeft", "overheadRight", "roomLeft", "roomRight"]
                            },
                            busIndex: { type: "number" },
                            volume: { type: "number" }
                          },
                          required: ["position", "busIndex"]
                        }
                      },
                      required: ["path", "micConfig"]
                    }
                  }
                },
                required: ["name", "rootNote", "samples"]
              }
            }
          },
          required: ["micBuses", "drumPieces"]
        }
      },
      {
        name: "generate_drum_groups",
        description: `Generate DecentSampler <groups> XML for drum kits.

This tool will:
- Create complete drum kit configurations
- Handle velocity layers and muting groups
- Organize samples by drum piece and articulation
- Generate proper XML structure for all samples

Best Practices:
- IMPORTANT: Always use absolute paths (e.g., 'C:/Users/username/Documents/Samples/kick.wav')
- Group all samples for a drum piece (e.g., all kick mics) into a single group
- When using multiple mic positions, include them all in the same group
- Use velocity layers within a group to control dynamics

Error Handling:
- Validates all sample paths exist
- Checks for valid MIDI note numbers
- Ensures velocity layers don't overlap
- Verifies muting group configurations
- Returns specific errors for any invalid settings

Success Response:
Returns complete XML structure with:
- Organized sample groups
- Velocity layer mappings
- Muting group configurations
- All sample references and settings

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
}`,
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
    
    case "configure_mic_routing": {
      const args = request.params.arguments;
      if (!args || typeof args !== 'object' || !Array.isArray(args.micBuses) || !Array.isArray(args.drumPieces)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid arguments: expected object with micBuses and drumPieces"
        );
      }

      try {
        // Validate mic routing configuration
        validateMicRouting(
          args.micBuses as MicBusConfig[],
          args.drumPieces.flatMap(piece => 
            (piece.samples as Array<{ micConfig?: DrumMicConfig }>)
              .map(sample => sample.micConfig)
              .filter((config): config is DrumMicConfig => !!config)
          )
        );

        // Create DrumKitConfig with mic routing
        const config: DrumKitConfig = {
          globalSettings: {
            micBuses: args.micBuses as MicBusConfig[]
          },
          drumPieces: args.drumPieces as DrumKitConfig['drumPieces']
        };

        // Generate XML with mic routing
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
          `Failed to configure mic routing: ${message}`
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

    case "configure_drum_controls": {
      const args = request.params.arguments;
      if (!args || typeof args !== 'object' || !args.drumControls) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid arguments: expected object with drumControls"
        );
      }

      try {
        // Convert the input format to our DrumControlsConfig format
        const drumControlsConfig: DrumControlsConfig = {
          drums: Object.entries(args.drumControls).map(([name, controls]) => ({
            name,
            ...(controls as any)
          }))
        };

        // Configure and validate the drum controls
        const config = configureDrumControls(drumControlsConfig);

        // Generate XML with the validated configuration
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
          `Failed to configure drum controls: ${message}`
        );
      }
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
