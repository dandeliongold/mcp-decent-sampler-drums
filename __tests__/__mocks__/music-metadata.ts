import { jest } from '@jest/globals';

export interface IMusicMetadataFormat {
  duration?: number;
  sampleRate?: number;
  numberOfChannels?: number;
  bitsPerSample?: number;
}

export interface IMusicMetadata {
  format?: IMusicMetadataFormat;
}

export const parseFile = jest.fn() as jest.MockedFunction<(path: string) => Promise<IMusicMetadata>>;

export default {
  parseFile
};
