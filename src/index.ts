#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

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
      volume?: string
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

      samples.push(
        `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
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
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_drum_groups",
        description: "Generate DecentSampler <groups> XML for drum kits",
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
  if (request.params.name !== "generate_drum_groups") {
    throw new Error("Unknown tool");
  }

  // Validate input matches our expected type
  const args = request.params.arguments;
  if (!args || typeof args !== 'object') {
    throw new Error("Invalid arguments: expected object");
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
    throw new Error("Invalid arguments: does not match DrumKitConfig schema");
  }

  const config = args;
  const xml = generateGroupsXml(config);

  return {
    content: [{
      type: "text",
      text: xml
    }]
  };
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
