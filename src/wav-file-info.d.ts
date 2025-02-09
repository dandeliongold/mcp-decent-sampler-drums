declare module 'wav-file-info' {
  interface WavHeader {
    sample_rate: number;
    num_channels: number;
    bits_per_sample: number;
  }

  interface WavInfo {
    duration: number;
    header: WavHeader;
  }

  export function infoByFilename(
    path: string,
    callback: (err: Error | null, info: WavInfo) => void
  ): void;
}
