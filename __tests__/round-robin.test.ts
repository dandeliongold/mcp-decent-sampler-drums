import { configureRoundRobin, RoundRobinConfig } from '../src/round-robin';
import path from 'path';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('configureRoundRobin', () => {
  describe('Basic Configuration', () => {
    it('should accept minimal valid configuration', () => {
      const config: RoundRobinConfig = {
        mode: 'always',
        groups: [{
          name: 'Kick',
          samples: [{
            path: 'valid.wav'
          }]
        }]
      };

      const result = configureRoundRobin(FIXTURES_DIR, config);
      expect(result.globalSettings.roundRobin).toEqual({
        mode: 'always'
      });
      expect(result.drumPieces[0].name).toBe('Kick');
      expect(result.drumPieces[0].samples[0].path).toBe('valid.wav');
    });

    it('should handle all optional fields', () => {
      const config: RoundRobinConfig = {
        mode: 'round_robin',
        length: 4,
        groups: [{
          name: 'Kick',
          rootNote: 36,
          settings: {
            mode: 'random',
            length: 2,
            seqPosition: 1
          },
          samples: [{
            path: 'valid.wav',
            settings: {
              mode: 'true_random',
              length: 3,
              seqPosition: 2
            }
          }]
        }]
      };

      const result = configureRoundRobin(FIXTURES_DIR, config);
      expect(result.globalSettings.roundRobin!).toEqual({
        mode: 'round_robin',
        length: 4
      });
      const drumPiece = result.drumPieces[0];
      expect(drumPiece.name).toBe('Kick');
      expect(drumPiece.rootNote).toBe(36);
      expect(drumPiece.samples[0].path).toBe('valid.wav');
      expect(drumPiece.samples[0].seqPosition).toBe(2);
    });
  });

  describe('Sequence Position Validation', () => {
    it('should require seqPosition when mode is not "always"', () => {
      const config: RoundRobinConfig = {
        mode: 'round_robin',
        groups: [{
          name: 'Kick',
          samples: [{
            path: 'valid.wav'
            // Missing seqPosition
          }]
        }]
      };

      expect(() => configureRoundRobin(FIXTURES_DIR, config)).toThrow(
        'Sample valid.wav needs a seqPosition when mode is round_robin'
      );
    });

    it('should validate sequence positions are within range', () => {
      const config: RoundRobinConfig = {
        mode: 'round_robin',
        length: 2,
        groups: [{
          name: 'Kick',
          samples: [{
            path: 'valid.wav',
            seqPosition: 3 // Out of range
          }]
        }]
      };

      expect(() => configureRoundRobin(FIXTURES_DIR, config)).toThrow(
        'Invalid sequence position 3 for sample valid.wav'
      );
    });

    it('should not require seqPosition when mode is "always"', () => {
      const config: RoundRobinConfig = {
        mode: 'always',
        groups: [{
          name: 'Kick',
          samples: [{
            path: 'valid.wav'
            // No seqPosition needed
          }]
        }]
      };

      expect(() => configureRoundRobin(FIXTURES_DIR, config)).not.toThrow();
    });
  });

  describe('File Existence Validation', () => {
    it('should validate sample files exist', () => {
      const config: RoundRobinConfig = {
        mode: 'always',
        groups: [{
          name: 'Kick',
          samples: [{
            path: 'nonexistent.wav'
          }]
        }]
      };

      expect(() => configureRoundRobin(FIXTURES_DIR, config)).toThrow(
        'Sample file not found: nonexistent.wav'
      );
    });

    it('should accept existing sample files', () => {
      const config: RoundRobinConfig = {
        mode: 'always',
        groups: [{
          name: 'Kick',
          samples: [{
            path: 'valid.wav'
          }]
        }]
      };

      expect(() => configureRoundRobin(FIXTURES_DIR, config)).not.toThrow();
    });
  });

  describe('Mode-specific Behavior', () => {
    const modes: Array<'round_robin' | 'random' | 'true_random' | 'always'> = [
      'round_robin',
      'random',
      'true_random',
      'always'
    ];

    modes.forEach(mode => {
      it(`should handle ${mode} mode configuration`, () => {
        const config: RoundRobinConfig = {
          mode,
          length: mode !== 'always' ? 2 : undefined,
          groups: [{
            name: 'Kick',
            samples: [{
              path: 'valid.wav',
              ...(mode !== 'always' && { seqPosition: 1 })
            }]
          }]
        };

        const result = configureRoundRobin(FIXTURES_DIR, config);
        const roundRobin = result.globalSettings.roundRobin!;
        expect(roundRobin.mode).toBe(mode);
        if (mode !== 'always') {
          expect(roundRobin.length).toBe(2);
        }
      });
    });
  });

  describe('Settings Inheritance', () => {
    it('should inherit sequence position from group settings', () => {
      const config: RoundRobinConfig = {
        mode: 'round_robin',
        groups: [{
          name: 'Kick',
          settings: {
            mode: 'round_robin',
            seqPosition: 1
          },
          samples: [{
            path: 'valid.wav'
            // No seqPosition needed, inherits from group
          }]
        }]
      };

      expect(() => configureRoundRobin(FIXTURES_DIR, config)).not.toThrow();
    });

    it('should allow sample settings to override group settings', () => {
      const config: RoundRobinConfig = {
        mode: 'round_robin',
        groups: [{
          name: 'Kick',
          settings: {
            mode: 'round_robin',
            seqPosition: 1
          },
          samples: [{
            path: 'valid.wav',
            settings: {
              mode: 'random',
              seqPosition: 2
            }
          }]
        }]
      };

      const result = configureRoundRobin(FIXTURES_DIR, config);
      const sample = result.drumPieces[0].samples[0];
      expect(sample.path).toBe('valid.wav');
      expect(sample.seqPosition).toBe(2);
    });
  });
});
