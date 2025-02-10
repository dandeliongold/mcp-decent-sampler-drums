import { DrumKitConfig, generateGroupsXml, isDrumKitConfig } from '../src/drum-kit';

describe('isDrumKitConfig', () => {
  it('should validate a complete valid config', () => {
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
          ],
          muting: {
            tags: ['kick'],
            silencedByTags: ['kick2']
          }
        }
      ]
    };
    expect(isDrumKitConfig(validConfig)).toBe(true);
  });

  it('should validate config without optional fields', () => {
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
    expect(isDrumKitConfig(minimalConfig)).toBe(true);
  });

  it('should reject invalid configs', () => {
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
      expect(isDrumKitConfig(config)).toBe(false);
    });
  });

  it('should validate velocity layers correctly', () => {
    const configWithInvalidLayers = {
      globalSettings: {
        velocityLayers: [
          { low: '0', high: 63, name: 'soft' }, // invalid low value type
          { low: 64, high: '127', name: 'hard' } // invalid high value type
        ]
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav' }]
        }
      ]
    };
    expect(isDrumKitConfig(configWithInvalidLayers)).toBe(false);
  });
});

describe('generateGroupsXml', () => {
  it('should include pitch control configuration', () => {
    const config: DrumKitConfig = {
      globalSettings: {
        drumControls: {
          'Kick': {
            pitch: {
              default: -12,
              min: -24,
              max: 0
            }
          }
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

    const expected = `<groups>
  <group name="Kick" ampVelTrack="1" tuning="-12">
      <control type="pitch" name="Kick Pitch" default="-12" minimum="-24" maximum="0">
        <binding type="general" level="group" position="0" parameter="groupTuning" />
      </control>
      <sample path="samples/kick.wav" rootNote="36" loNote="36" hiNote="36" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should include envelope configuration', () => {
    const config: DrumKitConfig = {
      globalSettings: {
        drumControls: {
          'Snare': {
            envelope: {
              attack: 0.001,
              decay: 0.5,
              sustain: 0.3,
              release: 1.2,
              attackCurve: -100,
              decayCurve: 100,
              releaseCurve: 50
            }
          }
        }
      },
      drumPieces: [
        {
          name: 'Snare',
          rootNote: 38,
          samples: [{ path: 'samples/snare.wav' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Snare" ampVelTrack="1" attack="0.001" decay="0.5" sustain="0.3" release="1.2" attackCurve="-100" decayCurve="100" releaseCurve="50">
      <sample path="samples/snare.wav" rootNote="38" loNote="38" hiNote="38" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should combine pitch and envelope controls', () => {
    const config: DrumKitConfig = {
      globalSettings: {
        drumControls: {
          'Tom': {
            pitch: {
              default: 0,
              min: -12,
              max: 12
            },
            envelope: {
              attack: 0.001,
              decay: 0.3,
              sustain: 0,
              release: 0.5
            }
          }
        }
      },
      drumPieces: [
        {
          name: 'Tom',
          rootNote: 45,
          samples: [{ path: 'samples/tom.wav' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Tom" ampVelTrack="1" tuning="0" attack="0.001" decay="0.3" sustain="0" release="0.5">
      <control type="pitch" name="Tom Pitch" default="0" minimum="-12" maximum="12">
        <binding type="general" level="group" position="0" parameter="groupTuning" />
      </control>
      <sample path="samples/tom.wav" rootNote="45" loNote="45" hiNote="45" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should handle multiple drums with different controls', () => {
    const config: DrumKitConfig = {
      globalSettings: {
        drumControls: {
          'Kick': {
            pitch: {
              default: -12,
              min: -24,
              max: 0
            }
          },
          'Snare': {
            envelope: {
              attack: 0.001,
              decay: 0.5,
              sustain: 0.3,
              release: 1.2
            }
          },
          'HiHat': {
            pitch: {
              default: 0,
              min: -12,
              max: 12
            },
            envelope: {
              attack: 0,
              decay: 0.1,
              sustain: 0,
              release: 0.1
            }
          }
        }
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav' }]
        },
        {
          name: 'Snare',
          rootNote: 38,
          samples: [{ path: 'samples/snare.wav' }]
        },
        {
          name: 'HiHat',
          rootNote: 42,
          samples: [{ path: 'samples/hihat.wav' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Kick" ampVelTrack="1" tuning="-12">
      <control type="pitch" name="Kick Pitch" default="-12" minimum="-24" maximum="0">
        <binding type="general" level="group" position="0" parameter="groupTuning" />
      </control>
      <sample path="samples/kick.wav" rootNote="36" loNote="36" hiNote="36" />
  </group>

  <group name="Snare" ampVelTrack="1" attack="0.001" decay="0.5" sustain="0.3" release="1.2">
      <sample path="samples/snare.wav" rootNote="38" loNote="38" hiNote="38" />
  </group>

  <group name="HiHat" ampVelTrack="1" tuning="0" attack="0" decay="0.1" sustain="0" release="0.1">
      <control type="pitch" name="HiHat Pitch" default="0" minimum="-12" maximum="12">
        <binding type="general" level="group" position="0" parameter="groupTuning" />
      </control>
      <sample path="samples/hihat.wav" rootNote="42" loNote="42" hiNote="42" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });
  it('should generate XML for a basic drum kit', () => {
    const config: DrumKitConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Kick" ampVelTrack="1">
      <sample path="samples/kick.wav" rootNote="36" loNote="36" hiNote="36" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should handle multiple drum pieces', () => {
    const config: DrumKitConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav' }]
        },
        {
          name: 'Snare',
          rootNote: 38,
          samples: [{ path: 'samples/snare.wav' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Kick" ampVelTrack="1">
      <sample path="samples/kick.wav" rootNote="36" loNote="36" hiNote="36" />
  </group>

  <group name="Snare" ampVelTrack="1">
      <sample path="samples/snare.wav" rootNote="38" loNote="38" hiNote="38" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should include velocity layers when specified', () => {
    const config: DrumKitConfig = {
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

    const expected = `<groups>
  <group name="Kick" ampVelTrack="1">
      <sample path="samples/kick_soft.wav" rootNote="36" loNote="36" hiNote="36" loVel="0" hiVel="63" />
      <sample path="samples/kick_hard.wav" rootNote="36" loNote="36" hiNote="36" loVel="64" hiVel="127" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should include volume attributes when specified', () => {
    const config: DrumKitConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [{ path: 'samples/kick.wav', volume: '-6dB' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Kick" ampVelTrack="1">
      <sample path="samples/kick.wav" volume="-6dB" rootNote="36" loNote="36" hiNote="36" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should include muting configuration when specified', () => {
    const config: DrumKitConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'HiHat',
          rootNote: 42,
          samples: [{ path: 'samples/hihat_closed.wav' }],
          muting: {
            tags: ['closed_hihat'],
            silencedByTags: ['open_hihat']
          }
        }
      ]
    };

    const expected = `<groups>
  <group name="HiHat" ampVelTrack="1" tags="closed_hihat" silencedByTags="open_hihat" silencingMode="fast">
      <sample path="samples/hihat_closed.wav" rootNote="42" loNote="42" hiNote="42" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should include round robin configuration at global level', () => {
    const config: DrumKitConfig = {
      globalSettings: {
        roundRobin: {
          mode: 'round_robin',
          length: 3
        }
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [
            { path: 'samples/kick_1.wav', seqPosition: 1 },
            { path: 'samples/kick_2.wav', seqPosition: 2 },
            { path: 'samples/kick_3.wav', seqPosition: 3 }
          ]
        }
      ]
    };

    const expected = `<groups seqMode="round_robin" seqLength="3">
  <group name="Kick" ampVelTrack="1">
      <sample path="samples/kick_1.wav" rootNote="36" loNote="36" hiNote="36" seqPosition="1" />
      <sample path="samples/kick_2.wav" rootNote="36" loNote="36" hiNote="36" seqPosition="2" />
      <sample path="samples/kick_3.wav" rootNote="36" loNote="36" hiNote="36" seqPosition="3" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });

  it('should handle different round robin modes', () => {
    const modes: Array<'round_robin' | 'random' | 'true_random' | 'always'> = [
      'round_robin',
      'random',
      'true_random',
      'always'
    ];

    modes.forEach(mode => {
      const config: DrumKitConfig = {
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
            samples: [
              { path: 'samples/kick_1.wav', seqPosition: 1 },
              { path: 'samples/kick_2.wav', seqPosition: 2 }
            ]
          }
        ]
      };

      const xml = generateGroupsXml(config);
      expect(xml).toContain(`seqMode="${mode}"`);
      if (mode !== 'always') {
        expect(xml).toContain('seqLength="2"');
      } else {
        expect(xml).not.toContain('seqLength');
      }
    });
  });

  it('should handle round robin settings inheritance', () => {
    const config: DrumKitConfig = {
      globalSettings: {
        roundRobin: {
          mode: 'round_robin',
          length: 4
        }
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          seqMode: 'random',
          seqLength: 2,
          seqPosition: 1,
          samples: [
            { path: 'samples/kick_1.wav', seqPosition: 2 },
            { path: 'samples/kick_2.wav', seqMode: 'true_random', seqPosition: 3 }
          ]
        }
      ]
    };

    const xml = generateGroupsXml(config);
    // Global settings
    expect(xml).toContain('seqMode="round_robin"');
    expect(xml).toContain('seqLength="4"');
    // Group override
    expect(xml).toContain('group name="Kick" ampVelTrack="1" seqMode="random" seqLength="2" seqPosition="1"');
    // Sample overrides
    expect(xml).toContain('seqPosition="2"');
    expect(xml).toContain('seqMode="true_random" seqPosition="3"');
  });

  it('should handle special characters in names', () => {
    const config: DrumKitConfig = {
      globalSettings: {},
      drumPieces: [
        {
          name: 'Hi-Hat & Cymbal',
          rootNote: 42,
          samples: [{ path: 'samples/hihat & cymbal.wav' }]
        }
      ]
    };

    const expected = `<groups>
  <group name="Hi-Hat & Cymbal" ampVelTrack="1">
      <sample path="samples/hihat & cymbal.wav" rootNote="42" loNote="42" hiNote="42" />
  </group>
</groups>`;

    expect(generateGroupsXml(config)).toBe(expected);
  });
});
