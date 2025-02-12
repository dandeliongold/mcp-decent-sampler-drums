import { BasicDrumKitConfig } from '../src/basic-drum-kit';
import { AdvancedDrumKitConfig } from '../src/advanced-drum-kit';
import { generateGroupsXml } from '../src/xml-generation';

describe('generateGroupsXml - Basic Configuration', () => {
  it('should generate XML for a basic drum kit', () => {
    const config: BasicDrumKitConfig = {
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

  it('should handle multiple drum pieces in basic config', () => {
    const config: BasicDrumKitConfig = {
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

  it('should include velocity layers in basic config', () => {
    const config: BasicDrumKitConfig = {
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

  it('should include volume attributes in basic config', () => {
    const config: BasicDrumKitConfig = {
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
});

describe('generateGroupsXml - Advanced Configuration', () => {
  it('should include pitch control configuration', () => {
    const config: AdvancedDrumKitConfig = {
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
    const config: AdvancedDrumKitConfig = {
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

  it('should include muting configuration', () => {
    const config: AdvancedDrumKitConfig = {
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

  it('should include round robin configuration', () => {
    const config: AdvancedDrumKitConfig = {
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

  it('should handle mic routing configuration', () => {
    const config: AdvancedDrumKitConfig = {
      globalSettings: {
        micBuses: [
          {
            name: 'Close Mic',
            outputTarget: 'AUX_STEREO_OUTPUT_1',
            volume: { default: 0 }
          },
          {
            name: 'OH L',
            outputTarget: 'AUX_STEREO_OUTPUT_2',
            volume: { default: -3 }
          }
        ]
      },
      drumPieces: [
        {
          name: 'Kick',
          rootNote: 36,
          samples: [
            {
              path: 'samples/kick_close.wav',
              micConfig: {
                position: 'close',
                busIndex: 0
              }
            },
            {
              path: 'samples/kick_oh_l.wav',
              micConfig: {
                position: 'overheadLeft',
                busIndex: 1,
                volume: -6
              }
            }
          ]
        }
      ]
    };

    const xml = generateGroupsXml(config);
    expect(xml).toContain('AUX_STEREO_OUTPUT_1');
    expect(xml).toContain('AUX_STEREO_OUTPUT_2');
    expect(xml).toContain('samples/kick_close.wav');
    expect(xml).toContain('samples/kick_oh_l.wav');
    expect(xml).toContain('output1Volume="-6"');
  });

  it('should combine all advanced features', () => {
    const config: AdvancedDrumKitConfig = {
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
          'Snare': {
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
          name: 'Snare',
          rootNote: 38,
          muting: {
            tags: ['snare'],
            silencedByTags: ['snare2']
          },
          samples: [
            {
              path: 'samples/snare_soft_1.wav',
              seqPosition: 1,
              micConfig: {
                position: 'close',
                busIndex: 0
              }
            },
            {
              path: 'samples/snare_soft_2.wav',
              seqPosition: 2,
              micConfig: {
                position: 'close',
                busIndex: 0
              }
            }
          ]
        }
      ]
    };

    const xml = generateGroupsXml(config);
    // Verify all features are present
    expect(xml).toContain('seqMode="round_robin"');
    expect(xml).toContain('seqLength="2"');
    expect(xml).toContain('tuning="0"');
    expect(xml).toContain('attack="0.001"');
    expect(xml).toContain('tags="snare"');
    expect(xml).toContain('AUX_STEREO_OUTPUT_1');
    expect(xml).toContain('samples/snare_soft_1.wav');
    expect(xml).toContain('samples/snare_soft_2.wav');
  });
});
