import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { parseFile } from 'music-metadata';
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export interface WavAnalysis {
  path: string;
  sampleLength: number;  // For end marker
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export async function analyzeWavFile(path: string): Promise<WavAnalysis> {
  try {
    const metadata = await parseFile(path);
    
    if (!metadata.format) {
      throw new Error('No format information found in WAV file');
    }

    const {
      duration = 0,
      sampleRate = 44100,
      numberOfChannels: channels = 2,
      bitsPerSample: bitDepth = 24
    } = metadata.format;

    return {
      path,
      sampleLength: Math.round(duration * sampleRate),
      sampleRate,
      channels,
      bitDepth
    };
  } catch (error: unknown) {
    console.error('WAV analysis error:', error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to analyze WAV file ${path}: ${message}`
    );
  }
}
