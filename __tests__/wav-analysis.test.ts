import { jest } from '@jest/globals';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

// Import fs mock for typing
import { promises as fs } from 'fs';
const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

// Import our function to test
import { analyzeWavFile } from '../src/wav-analysis.js';

// Helper to create WAV header buffer
function createWavBuffer({
  numChannels = 2,
  sampleRate = 44100,
  bitsPerSample = 24,
  dataSize = 1000
} = {}) {
  const buffer = Buffer.alloc(44 + dataSize); // Standard WAV header + data

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4); // File size - 8
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE((sampleRate * numChannels * bitsPerSample) / 8, 28); // Byte rate
  buffer.writeUInt16LE((numChannels * bitsPerSample) / 8, 32); // Block align
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

describe('WAV File Analysis', () => {
  // Test file paths
  const validWavPath = path.join(__dirname, 'fixtures', 'valid.wav');
  const corruptedWavPath = path.join(__dirname, 'fixtures', 'corrupted.wav');
  const invalidFormatWavPath = path.join(__dirname, 'fixtures', 'invalid_format.wav');
  const missingChunksWavPath = path.join(__dirname, 'fixtures', 'missing_chunks.wav');
  const invalidSizesWavPath = path.join(__dirname, 'fixtures', 'invalid_sizes.wav');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should successfully analyze a valid WAV file', async () => {
      const wavBuffer = createWavBuffer({
        numChannels: 2,
        sampleRate: 44100,
        bitsPerSample: 24,
        dataSize: 396900 // 1.5 seconds of audio (44100 * 1.5 * 2 channels * 3 bytes per sample)
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);

      expect(result).toEqual({
        path: validWavPath,
        sampleLength: 66150, // dataSize / (channels * bytesPerSample)
        sampleRate: 44100,
        channels: 2,
        bitDepth: 24
      });
    });

    it('should handle different bit depths', async () => {
      const wavBuffer = createWavBuffer({
        numChannels: 1,
        sampleRate: 44100,
        bitsPerSample: 16,
        dataSize: 88200 // 1 second of audio
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);

      expect(result).toEqual({
        path: validWavPath,
        sampleLength: 44100,
        sampleRate: 44100,
        channels: 1,
        bitDepth: 16
      });
    });

    it('should handle high sample rates', async () => {
      const wavBuffer = createWavBuffer({
        numChannels: 2,
        sampleRate: 96000,
        bitsPerSample: 24,
        dataSize: 576000 // 1 second of audio
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);

      expect(result).toEqual({
        path: validWavPath,
        sampleLength: 96000,
        sampleRate: 96000,
        channels: 2,
        bitDepth: 24
      });
    });
  });

  describe('Error Cases', () => {
    it('should handle JUNK chunk error case (real world error)', async () => {
      const buffer = Buffer.alloc(44);
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36, 4);
      buffer.write('WAVE', 8);
      buffer.write('JUNK', 12); // JUNK instead of fmt
      mockReadFile.mockResolvedValue(buffer);

      await expect(analyzeWavFile(corruptedWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(corruptedWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect(error).toHaveProperty('code', ErrorCode.InvalidRequest);
        expect((error as McpError).message).toContain('Missing fmt chunk');
      }
    });

    it('should handle invalid audio format', async () => {
      const buffer = createWavBuffer();
      buffer.writeUInt16LE(2, 20); // Non-PCM format
      mockReadFile.mockResolvedValue(buffer);

      await expect(analyzeWavFile(invalidFormatWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(invalidFormatWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect(error).toHaveProperty('code', ErrorCode.InvalidRequest);
        expect((error as McpError).message).toContain('Unsupported audio format: 2');
      }
    });

    it('should handle missing data chunk', async () => {
      const buffer = Buffer.alloc(44); // Minimum size but no data chunk
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // fmt chunk size
      buffer.writeUInt16LE(1, 20); // PCM format
      buffer.writeUInt16LE(2, 22); // channels
      buffer.writeUInt32LE(44100, 24); // sample rate
      buffer.writeUInt32LE(264600, 28); // byte rate
      buffer.writeUInt16LE(6, 32); // block align
      buffer.writeUInt16LE(24, 34); // bits per sample
      mockReadFile.mockResolvedValue(buffer);

      await expect(analyzeWavFile(missingChunksWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(missingChunksWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect(error).toHaveProperty('code', ErrorCode.InvalidRequest);
        expect((error as McpError).message).toContain('Missing data chunk');
      }
    });

    it('should handle file too small', async () => {
      const buffer = Buffer.alloc(40); // Less than minimum WAV header size
      mockReadFile.mockResolvedValue(buffer);

      await expect(analyzeWavFile(invalidSizesWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(invalidSizesWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect(error).toHaveProperty('code', ErrorCode.InvalidRequest);
        expect((error as McpError).message).toContain('File too small to be a valid WAV file');
      }
    });

    it('should handle missing RIFF header', async () => {
      const buffer = createWavBuffer();
      buffer.write('JUNK', 0); // Invalid RIFF header
      mockReadFile.mockResolvedValue(buffer);

      await expect(analyzeWavFile(validWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(validWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect(error).toHaveProperty('code', ErrorCode.InvalidRequest);
        expect((error as McpError).message).toContain('Missing RIFF header');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely short data chunks', async () => {
      const wavBuffer = createWavBuffer({
        dataSize: 4 // Extremely small data chunk
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);
      expect(result.sampleLength).toBe(1); // 4 bytes / (2 channels * 3 bytes per sample)
    });

    it('should handle extremely large data chunks', async () => {
      const wavBuffer = createWavBuffer({
        dataSize: 7200 * 44100 * 6 // 2 hours of stereo 24-bit audio
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);
      expect(result.sampleLength).toBe(317520000); // 7200 * 44100
    });

    it('should handle mono files', async () => {
      const wavBuffer = createWavBuffer({
        numChannels: 1,
        dataSize: 44100 * 3 // 1 second of mono 24-bit audio
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);
      expect(result.channels).toBe(1);
      expect(result.sampleLength).toBe(44100);
    });

    it('should handle multi-channel files', async () => {
      const wavBuffer = createWavBuffer({
        numChannels: 8,
        dataSize: 44100 * 24 // 1 second of 8-channel 24-bit audio
      });
      mockReadFile.mockResolvedValue(wavBuffer);

      const result = await analyzeWavFile(validWavPath);
      expect(result.channels).toBe(8);
      expect(result.sampleLength).toBe(44100);
    });
  });
});
