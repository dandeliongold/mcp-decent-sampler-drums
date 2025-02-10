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

interface DrumKitConfig {
  globalSettings: {
    volume?: string,
    ampVelTrack?: number,
    trigger?: string,
    velocityLayers: {
      low: number,
      high: number,
      name: string
    }[]
  },
  drumPieces: {
    name: string,
    rootNote: number,
    samples: {
      path: string,
      volume?: string,
      sampleLength?: number  // Optional because it will be populated by analyze_wav_samples
    }[],
    muting?: {
      tags: string[],
      silencedByTags: string[]
    }
  }[]
}

function generateGroupsXml(config: DrumKitConfig): string {
  const { globalSettings, drumPieces } = config;
  const groups: string[] = [];

  for (const piece of drumPieces) {
    const mutingAttrs = piece.muting 
      ? ` tags="${piece.muting.tags.join(',')}" silencedByTags="${piece.muting.silencedByTags.join(',')}" silencingMode="fast"`
      : '';

    const samples: string[] = [];
    const velocityLayers = globalSettings.velocityLayers;

    for (let i = 0; i < Math.min(piece.samples.length, velocityLayers.length); i++) {
      const sample = piece.samples[i];
      const layer = velocityLayers[i];
      const volumeAttr = sample.volume ? ` volume="${sample.volume}"` : '';
      // end should be INDEX of last sample, which is length in samples - 1
      const sampleLengthAttr = sample.sampleLength ? ` start="0" end="${sample.sampleLength-1}"` : '';
      samples.push(
        `      <sample path="${sample.path}"${volumeAttr}${sampleLengthAttr} rootNote="${piece.rootNote}" ` +
        `loNote="${piece.rootNote}" hiNote="${piece.rootNote}" ` +
        `loVel="${layer.low}" hiVel="${layer.high}" />`
      );
    }

    const volumeAttr = globalSettings.volume ? ` volume="${globalSettings.volume}"` : '';
    const ampVelTrackAttr = globalSettings.ampVelTrack !== undefined ? ` ampVelTrack="${globalSettings.ampVelTrack}"` : ' ampVelTrack="1"';

    const triggerAttr = globalSettings.trigger ? ` trigger="${globalSettings.trigger}"` : ' trigger="attack"';
    
    groups.push(
      `  <group name="${piece.name}"${volumeAttr}${ampVelTrackAttr} tuning="0.0"${triggerAttr}${mutingAttrs}>\n` +
      `${samples.join('\n')}\n` +
      `  </group>`
    );
  }

  return `<groups>\n${groups.join('\n\n')}\n</groups>`;
}

const server = new Server(
  {
    name: "decent-sampler-drums",
    version: "0.0.6",
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
        name: "analyze_wav_samples",
        description: "Analyze WAV files to get sample lengths and metadata. Use this tool to get accurate end markers for your samples to prevent looping issues in DecentSampler. IMPORTANT: Always use absolute paths (e.g., 'C:/Users/username/Documents/Samples/kick.wav') rather than relative paths.",
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
- Each sample should have start/end markers only if the samples can be analyzed first and set as below:
  * Use the analyze_wav_samples tool to get accurate sample lengths:
    analyze_wav_samples(["C:/Users/username/Documents/Samples/Kick_Close_Soft.wav"]) -> {"sampleLength": 60645}
    Then we set the end to the INDEX of the last sample, which is the length in samples - 1,
    So for the above example where {"sampleLength": 60645}, you would use start="0" end="60644" in your sample definition.
- When using multiple mic positions (e.g., Close, OH, Room), include them all in the same group
- Use velocity layers within a group to control dynamics

Example Structure:
{
  "drumPieces": [{
    "name": "Kick",
    "rootNote": 36,
    "samples": [
      // All mic positions for soft velocity
      {"path": "C:/Users/username/Documents/Samples/Kick_Close_Soft.wav", "start": 0, "end": 60645},  // (Length from analyze_wav_samples - 1)
      {"path": "C:/Users/username/Documents/Samples/Kick_OH_L_Soft.wav", "start": 0, "end": 60000},
      {"path": "C:/Users/username/Documents/Samples/Kick_OH_R_Soft.wav", "start": 0, "end": 60000},
      // All mic positions for medium velocity
      {"path": "C:/Users/username/Documents/Samples/Kick_Close_Medium.wav", "start": 0, "end": 70162},  (Length from analyze_wav_samples - 1)
      ...
    ]
  }]
}

Workflow:
1. First use analyze_wav_samples to get accurate lengths for all your WAV files
2. Use those lengths to determine the index (i.e. length - 1) and set the end markers in your drum pieces configuration
3. Pass the complete configuration to generate_drum_groups to create the XML`,
        inputSchema: {
          type: "object",
          properties: {
            globalSettings: {
              type: "object",
              properties: {
                volume: { type: "string" },
                ampVelTrack: { type: "number" },
                trigger: { 
                  type: "string",
                  enum: ["attack", "release", "first", "legato"]
                },
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
              required: ["velocityLayers"]
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

      // Type guard function to validate DrumKitConfig
      function isDrumKitConfig(obj: unknown): obj is DrumKitConfig {
        const config = obj as Partial<DrumKitConfig>;
        return (
          !!config.globalSettings &&
          Array.isArray(config.globalSettings.velocityLayers) &&
          config.globalSettings.velocityLayers.every(layer => 
            typeof layer.low === 'number' &&
            typeof layer.high === 'number' &&
            typeof layer.name === 'string'
          ) &&
          Array.isArray(config.drumPieces) &&
          config.drumPieces.every(piece => 
            typeof piece.name === 'string' &&
            typeof piece.rootNote === 'number' &&
            Array.isArray(piece.samples) &&
            piece.samples.every(sample => typeof sample.path === 'string')
          )
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
