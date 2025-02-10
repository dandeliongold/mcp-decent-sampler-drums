import { describe, it, expect } from '@jest/globals';
import { MicBusConfig, DrumMicConfig, configureMicBuses, validateMicRouting } from '../src/mic-routing.js';

describe('Mic Routing', () => {
  describe('configureMicBuses', () => {
    it('generates correct bus XML with volume controls', () => {
      const buses: MicBusConfig[] = [
        {
          name: "Close Mic",
          outputTarget: "AUX_STEREO_OUTPUT_1",
          volume: {
            default: 0,
            min: -96,
            max: 12,
            midiCC: 21
          }
        },
        {
          name: "OH L",
          outputTarget: "AUX_STEREO_OUTPUT_2",
          volume: {
            default: -3,
            min: -96,
            max: 12,
            midiCC: 22
          }
        }
      ];

      const xml = configureMicBuses(buses);
      expect(xml).toContain('<buses>');
      expect(xml).toContain('output1Target="AUX_STEREO_OUTPUT_1"');
      expect(xml).toContain('output1Target="AUX_STEREO_OUTPUT_2"');
      expect(xml).toContain('midi_cc="21"');
      expect(xml).toContain('midi_cc="22"');
      expect(xml).toContain('minimum="-96"');
      expect(xml).toContain('maximum="12"');
    });

    it('handles buses without volume controls', () => {
      const buses: MicBusConfig[] = [
        {
          name: "Close Mic",
          outputTarget: "AUX_STEREO_OUTPUT_1"
        }
      ];

      const xml = configureMicBuses(buses);
      expect(xml).toContain('<buses>');
      expect(xml).toContain('output1Target="AUX_STEREO_OUTPUT_1"');
      expect(xml).not.toContain('midi_cc');
      expect(xml).not.toContain('minimum');
      expect(xml).not.toContain('maximum');
    });

    it('throws error for invalid bus config', () => {
      const invalidBuses = [
        {
          outputTarget: "AUX_STEREO_OUTPUT_1" // Missing name
        }
      ];

      expect(() => configureMicBuses(invalidBuses as MicBusConfig[]))
        .toThrow('Invalid mic bus configuration');
    });
  });

  describe('validateMicRouting', () => {
    const validBuses: MicBusConfig[] = [
      {
        name: "Close Mic",
        outputTarget: "AUX_STEREO_OUTPUT_1",
        volume: { default: 0 }
      },
      {
        name: "OH L",
        outputTarget: "AUX_STEREO_OUTPUT_2",
        volume: { default: -3 }
      }
    ];

    const validMics: DrumMicConfig[] = [
      {
        position: "close",
        busIndex: 0
      },
      {
        position: "overheadLeft",
        busIndex: 1
      }
    ];

    it('validates correct configuration', () => {
      expect(() => validateMicRouting(validBuses, validMics))
        .not.toThrow();
    });

    it('throws error for invalid bus index', () => {
      const invalidMics: DrumMicConfig[] = [
        {
          position: "close",
          busIndex: 2 // Invalid index
        }
      ];

      expect(() => validateMicRouting(validBuses, invalidMics))
        .toThrow('Invalid bus index');
    });

    it('throws error for duplicate output targets', () => {
      const duplicateBuses: MicBusConfig[] = [
        {
          name: "Close Mic 1",
          outputTarget: "AUX_STEREO_OUTPUT_1"
        },
        {
          name: "Close Mic 2",
          outputTarget: "AUX_STEREO_OUTPUT_1" // Duplicate
        }
      ];

      expect(() => validateMicRouting(duplicateBuses, validMics))
        .toThrow('Duplicate output target');
    });

    it('throws error for invalid volume range', () => {
      const invalidVolumeBuses: MicBusConfig[] = [
        {
          name: "Close Mic",
          outputTarget: "AUX_STEREO_OUTPUT_1",
          volume: {
            default: 0,
            min: 12,
            max: -96 // Invalid: min > max
          }
        }
      ];

      // Use a mic config that references only the first bus
      const mics: DrumMicConfig[] = [{
        position: "close",
        busIndex: 0
      }];

      expect(() => validateMicRouting(invalidVolumeBuses, mics))
        .toThrow('Invalid volume range');
    });

    it('throws error for default volume outside range', () => {
      const invalidDefaultBuses: MicBusConfig[] = [
        {
          name: "Close Mic",
          outputTarget: "AUX_STEREO_OUTPUT_1",
          volume: {
            default: 24, // Outside range
            min: -96,
            max: 12
          }
        }
      ];

      // Use a mic config that references only the first bus
      const mics: DrumMicConfig[] = [{
        position: "close",
        busIndex: 0
      }];

      expect(() => validateMicRouting(invalidDefaultBuses, mics))
        .toThrow('Default volume');
    });

    it('validates volume ranges before checking mic routing', () => {
      const invalidVolumeBuses: MicBusConfig[] = [
        {
          name: "Close Mic",
          outputTarget: "AUX_STEREO_OUTPUT_1",
          volume: {
            default: 0,
            min: 12,
            max: -96 // Invalid: min > max
          }
        }
      ];

      // Even with an invalid bus index, volume validation should fail first
      const mics: DrumMicConfig[] = [{
        position: "close",
        busIndex: 999 // Invalid bus index
      }];

      expect(() => validateMicRouting(invalidVolumeBuses, mics))
        .toThrow('Invalid volume range');
    });
  });
});
