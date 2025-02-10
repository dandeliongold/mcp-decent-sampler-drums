import { jest } from '@jest/globals';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';

// Define types for music-metadata response
interface IMusicMetadataFormat {
  duration?: number;
  sampleRate?: number;
  numberOfChannels?: number;
  bitsPerSample?: number;
}

interface IMusicMetadata {
  format?: IMusicMetadataFormat;
}

// Mock music-metadata module
const mockParseFile = jest.fn<(path: string) => Promise<IMusicMetadata>>();
jest.mock('music-metadata', () => ({
  parseFile: mockParseFile
}));

// Type assertion for mockParseFile to help TypeScript understand mock methods
const typedMockParseFile = mockParseFile as jest.MockedFunction<typeof mockParseFile>;

// Import our function to test
import { analyzeWavFile } from '../src/wav-analysis.js';

describe('WAV File Analysis', () => {
  // Test file paths
  const validWavPath = path.join(__dirname, 'fixtures', 'valid.wav');
  const corruptedWavPath = path.join(__dirname, 'fixtures', 'corrupted.wav');
  const invalidFormatWavPath = path.join(__dirname, 'fixtures', 'invalid_format.wav');
  const missingChunksWavPath = path.join(__dirname, 'fixtures', 'missing_chunks.wav');
  const invalidSizesWavPath = path.join(__dirname, 'fixtures', 'invalid_sizes.wav');
  
  beforeEach(() => {
    // Clear mock before each test
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should successfully analyze a valid WAV file', async () => {
      // Mock successful response
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 1.5,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitsPerSample: 24
        }
      });

      const result = await analyzeWavFile(validWavPath);

      expect(result).toEqual({
        path: validWavPath,
        sampleLength: 66150, // 1.5 seconds * 44100 Hz
        sampleRate: 44100,
        channels: 2,
        bitDepth: 24
      });

      expect(typedMockParseFile).toHaveBeenCalledWith(validWavPath);
    });

    it('should handle different bit depths', async () => {
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 1.0,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitsPerSample: 16
        }
      });

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
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 1.0,
          sampleRate: 96000,
          numberOfChannels: 2,
          bitsPerSample: 24
        }
      });

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
      // Mock the specific error we encountered in production
      const errorData = {
        error: true,
        invalid_reasons: [
          'Expected "fmt " string at 8',
          'Unknown format: 0'
        ],
        header: {
          riff_head: 'RIFF',
          chunk_size: 329972,
          wave_identifier: 'WAVE',
          fmt_identifier: 'JUNK',
          subchunk_size: 28,
          audio_format: 0,
          num_channels: 0,
          sample_rate: 0,
          byte_rate: 0,
          block_align: 0,
          bits_per_sample: 0,
          data_identifier: '\u0000\u0000\u0000\u0000'
        }
      };

      typedMockParseFile.mockRejectedValue(new Error(JSON.stringify(errorData)));

      await expect(analyzeWavFile(corruptedWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(corruptedWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        const errorMessage = (error as McpError).message;
        // Extract the JSON part from the error message
        const jsonMatch = errorMessage.match(/{.*}/);
        expect(jsonMatch).toBeTruthy();
        const errorJson = JSON.parse(jsonMatch![0]);
        expect(errorJson.invalid_reasons).toContain('Expected "fmt " string at 8');
        expect(errorJson.invalid_reasons).toContain('Unknown format: 0');
      }
    });

    it('should handle invalid audio format', async () => {
      const errorData = {
        error: true,
        invalid_reasons: ['Unknown format: 0'],
        header: {
          audio_format: 0
        }
      };

      typedMockParseFile.mockRejectedValue(new Error(JSON.stringify(errorData)));

      await expect(analyzeWavFile(invalidFormatWavPath))
        .rejects
        .toThrow(McpError);

      try {
        await analyzeWavFile(invalidFormatWavPath);
      } catch (error) {
        expect(error).toBeInstanceOf(McpError);
        expect((error as McpError).message).toContain('Unknown format: 0');
      }
    });

    it('should handle missing data chunk', async () => {
      typedMockParseFile.mockRejectedValue(new Error('Missing data chunk'));

      await expect(analyzeWavFile(missingChunksWavPath))
        .rejects
        .toThrow(McpError);
    });

    it('should handle invalid chunk sizes', async () => {
      typedMockParseFile.mockRejectedValue(new Error('Invalid chunk size'));

      await expect(analyzeWavFile(invalidSizesWavPath))
        .rejects
        .toThrow(McpError);
    });

    it('should handle missing format information', async () => {
      typedMockParseFile.mockResolvedValue({});

      await expect(analyzeWavFile(validWavPath))
        .rejects
        .toThrow('No format information found in WAV file');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely short files', async () => {
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 0.0001, // Extremely short duration
          sampleRate: 44100,
          numberOfChannels: 2,
          bitsPerSample: 24
        }
      });

      const result = await analyzeWavFile(validWavPath);
      expect(result.sampleLength).toBe(4); // 0.0001 * 44100 rounded
    });

    it('should handle extremely long files', async () => {
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 7200, // 2 hours
          sampleRate: 44100,
          numberOfChannels: 2,
          bitsPerSample: 24
        }
      });

      const result = await analyzeWavFile(validWavPath);
      expect(result.sampleLength).toBe(317520000); // 7200 * 44100
    });

    it('should use default values for missing format properties', async () => {
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 1.0
          // Missing other properties - should use defaults
        }
      });

      const result = await analyzeWavFile(validWavPath);

      expect(result).toEqual({
        path: validWavPath,
        sampleLength: 44100, // 1.0 seconds * 44100 Hz
        sampleRate: 44100,   // Default
        channels: 2,         // Default
        bitDepth: 24        // Default
      });
    });

    it('should handle multi-channel files', async () => {
      typedMockParseFile.mockResolvedValue({
        format: {
          duration: 1.0,
          sampleRate: 44100,
          numberOfChannels: 8, // 8 channel audio
          bitsPerSample: 24
        }
      });

      const result = await analyzeWavFile(validWavPath);
      expect(result.channels).toBe(8);
    });
  });
});
