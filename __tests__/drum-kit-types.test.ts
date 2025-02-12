import { BasicDrumKitConfig, isBasicDrumKitConfig } from '../src/basic-drum-kit';
import { AdvancedDrumKitConfig, isAdvancedDrumKitConfig } from '../src/advanced-drum-kit';

describe('isBasicDrumKitConfig', () => {
  it('should validate a complete valid basic config', () => {
    const validConfig = {
      globalSettings: {
        velocityLayers: [
          { low: 0, high: 63, name: 'soft' },
          { low: 64, high: 127, name: 'hard' }
        ]
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [
            { path: 'samples/kick_soft.wav' },
            { path: 'samples/kick_hard.wav' }
          ]
        }
      ]
    };
    expect(isBasicDrumKitConfig(validConfig)).toBe(true);
  });

  it('should validate basic config without optional fields', () => {
    const minimalConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'Snare',
          rootNote: 38,
          samples: [{ path: 'samples/snare.wav' }]
        }
      ]
    };
    expect(isBasicDrumKitConfig(minimalConfig)).toBe(true);
  });

  it('should reject invalid basic configs', () => {
    const invalidConfigs = [
      null,
      undefined,
      {},
      { globalSettings: {}, drumPieces: null },
      { globalSettings: null, drumPieces: [] },
      {
        globalSettings: {},
        drumPieces: [{ name: 'Invalid', samples: [] }] // missing rootNote
      },
      {
        globalSettings: {},
        drumPieces: [{ rootNote: 36, samples: [] }] // missing name
      },
      {
        globalSettings: {},
        drumPieces: [{ name: 'Invalid', rootNote: '36', samples: [] }] // rootNote wrong type
      }
    ];

    invalidConfigs.forEach(config => {
      expect(isBasicDrumKitConfig(config)).toBe(false);
    });
  });

  it('should reject configs with advanced features', () => {
    const configWithAdvancedFeatures = {
      globalSettings: {
        drumControls: {
          'Kick': {
            pitch: { default: 0 }
          }
        }
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav' }],
          muting: { // Advanced feature
            tags: ['kick'],
            silencedByTags: []
          }
        }
      ]
    };
    expect(isBasicDrumKitConfig(configWithAdvancedFeatures)).toBe(false);
  });
});

describe('isAdvancedDrumKitConfig', () => {
  it('should validate a complete valid advanced config', () => {
    const validConfig = {
      globalSettings: {
        velocityLayers: [
          { low: 0, high: 63, name: 'soft' },
          { low: 64, high: 127, name: 'hard' }
        ],
        roundRobin: {
          mode: 'round_robin',
          length: 2
        },
        drumControls: {
          'Kick': {
            pitch: { default: 0, min: -12, max: 12 },
            envelope: {
              attack: 0.001,
              decay: 0.3,
              sustain: 0,
              release: 0.5
            }
          }
        },
        micBuses: [
          {
            name: 'Close',
            outputTarget: 'AUX_STEREO_OUTPUT_1',
            volume: { default: 0 }
          }
        ]
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          muting: {
            tags: ['kick'],
            silencedByTags: ['kick2']
          },
          samples: [
            {
              path: 'samples/kick_1.wav',
              seqPosition: 1,
              micConfig: {
                position: 'close',
                busIndex: 0
              }
            }
          ]
        }
      ]
    };
    expect(isAdvancedDrumKitConfig(validConfig)).toBe(true);
  });

  it('should validate advanced config with only some advanced features', () => {
    const configWithSomeFeatures = {
      globalSettings: {
        roundRobin: {
          mode: 'round_robin',
          length: 2
        }
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [
            { path: 'samples/kick_1.wav', seqPosition: 1 },
            { path: 'samples/kick_2.wav', seqPosition: 2 }
          ]
        }
      ]
    };
    expect(isAdvancedDrumKitConfig(configWithSomeFeatures)).toBe(true);
  });

  it('should validate advanced config with basic features only', () => {
    const basicConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav' }]
        }
      ]
    };
    expect(isAdvancedDrumKitConfig(basicConfig)).toBe(true);
  });

  it('should reject invalid advanced configs', () => {
    const invalidConfigs = [
      {
        globalSettings: {
          roundRobin: {
            mode: 'invalid_mode', // Invalid mode
            length: 2
          }
        },
        drumPieces: [
          {
            name: 'Kick',
            rootNote: 36,
            samples: [{ path: 'samples/kick.wav' }]
          }
        ]
      },
      {
        globalSettings: {
          micBuses: [
            {
              name: 'Close',
              outputTarget: 'AUX_STEREO_OUTPUT_1',
              volume: { default: 'invalid' } // Should be number
            }
          ]
        },
        drumPieces: [
          {
            name: 'Kick',
            rootNote: 36,
            samples: [{ path: 'samples/kick.wav' }]
          }
        ]
      },
      {
        globalSettings: {},
        drumPieces: [
          {
            name: 'Kick',
            rootNote: 36,
            samples: [
              {
                path: 'samples/kick.wav',
                micConfig: {
                  position: 'invalid_position', // Invalid position
                  busIndex: 0
                }
              }
            ]
          }
        ]
      }
    ];

    invalidConfigs.forEach(config => {
      expect(isAdvancedDrumKitConfig(config)).toBe(false);
    });
  });

  it('should validate all round robin modes', () => {
    const modes: Array<'round_robin' | 'random' | 'true_random' | 'always'> = [
      'round_robin',
      'random',
      'true_random',
      'always'
    ];

    modes.forEach(mode => {
      const config = {
        globalSettings: {
          roundRobin: {
            mode,
            ...(mode !== 'always' && { length: 2 })
          }
        },
        drumPieces: [
          {
            name: 'Kick',
            rootNote: 36,
            samples: [{ path: 'samples/kick.wav' }]
          }
        ]
      };
      expect(isAdvancedDrumKitConfig(config)).toBe(true);
    });
  });

  it('should validate all mic positions', () => {
    const positions: Array<'close' | 'overheadLeft' | 'overheadRight' | 'roomLeft' | 'roomRight'> = [
      'close',
      'overheadLeft',
      'overheadRight',
      'roomLeft',
      'roomRight'
    ];

    positions.forEach(position => {
      const config = {
        globalSettings: {
          micBuses: [
            {
              name: 'Test',
              outputTarget: 'AUX_STEREO_OUTPUT_1',
              volume: { default: 0 }
            }
          ]
        },
        drumPieces: [
          {
            name: 'Kick',
            rootNote: 36,
            samples: [
              {
                path: 'samples/kick.wav',
                micConfig: {
                  position,
                  busIndex: 0
                }
              }
            ]
          }
        ]
      };
      expect(isAdvancedDrumKitConfig(config)).toBe(true);
    });
  });
});
