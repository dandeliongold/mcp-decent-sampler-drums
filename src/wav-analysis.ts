import { McpError } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';

export interface WavAnalysis {
  path: string;
  sampleLength: number;  // For end marker
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

interface WavHeader {
  riffHeader: string;
  fileSize: number;
  waveHeader: string;
  fmtHeader: string;
  fmtChunkSize: number;
  audioFormat: number;
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  dataHeader?: string;
  dataSize?: number;
}

async function parseWavHeader(buffer: Buffer): Promise<WavHeader> {
  const invalidReasons: string[] = [];

  // RIFF header
  const riffHeader = buffer.toString('ascii', 0, 4);
  if (riffHeader !== 'RIFF') {
    invalidReasons.push('Missing RIFF header');
  }

  // File size
  const fileSize = buffer.readUInt32LE(4);

  // WAVE header
  const waveHeader = buffer.toString('ascii', 8, 12);
  if (waveHeader !== 'WAVE') {
    invalidReasons.push('Missing WAVE format marker');
  }

  // fmt chunk
  const fmtHeader = buffer.toString('ascii', 12, 16);
  if (fmtHeader !== 'fmt ') {
    invalidReasons.push('Missing fmt chunk');
  }

  const fmtChunkSize = buffer.readUInt32LE(16);
  const audioFormat = buffer.readUInt16LE(20);
  if (audioFormat !== 1) {
    invalidReasons.push(`Unsupported audio format: ${audioFormat} (only PCM supported)`);
  }

  const numChannels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const byteRate = buffer.readUInt32LE(28);
  const blockAlign = buffer.readUInt16LE(32);
  const bitsPerSample = buffer.readUInt16LE(34);

  // Validate format values
  if (numChannels === 0) {
    invalidReasons.push('Invalid number of channels: 0');
  }
  if (sampleRate === 0) {
    invalidReasons.push('Invalid sample rate: 0');
  }
  if (bitsPerSample === 0) {
    invalidReasons.push('Invalid bits per sample: 0');
  }

  // Look for data chunk
  let dataHeader: string | undefined;
  let dataSize: number | undefined;
  let offset = 36;

  // Skip any non-data chunks
  while (offset < buffer.length - 8) {
    const chunkHeader = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    
    if (chunkHeader === 'data') {
      dataHeader = chunkHeader;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }

  if (!dataHeader || !dataSize) {
    invalidReasons.push('Missing data chunk');
  }

  if (invalidReasons.length > 0) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `WAV file validation failed: ${invalidReasons.join(', ')}`
    );
  }

  return {
    riffHeader,
    fileSize,
    waveHeader,
    fmtHeader,
    fmtChunkSize,
    audioFormat,
    numChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    dataHeader,
    dataSize
  };
}

export async function analyzeWavFile(path: string): Promise<WavAnalysis> {
  try {
    const buffer = await fs.readFile(path);
    if (buffer.length < 44) { // Minimum size for WAV header
      throw new McpError(
        ErrorCode.InvalidRequest,
        'File too small to be a valid WAV file'
      );
    }

    const header = await parseWavHeader(buffer);
    
    // Calculate sample length from data chunk size
    const bytesPerSample = header.bitsPerSample / 8;
    const samplesPerChannel = header.dataSize! / (bytesPerSample * header.numChannels);

    return {
      path,
      sampleLength: Math.round(samplesPerChannel),
      sampleRate: header.sampleRate,
      channels: header.numChannels,
      bitDepth: header.bitsPerSample
    };
  } catch (error: unknown) {
    if (error instanceof McpError) {
      throw error; // Re-throw validation errors
    }
    // Handle unexpected errors
    console.error('WAV analysis error:', error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to analyze WAV file ${path}: ${message}`
    );
  }
}
