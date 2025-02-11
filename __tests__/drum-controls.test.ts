import { DrumControlsConfig, configureDrumControls } from '../src/drum-controls';

describe('Drum Controls Configuration', () => {
  test('validates pitch settings', () => {
    // Valid configuration
    const validConfig: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,  // Standard MIDI note for kick
        pitch: {
          default: 0,
          min: -12,
          max: 12
        }
      }]
    };
    expect(() => configureDrumControls(validConfig)).not.toThrow();

    // Invalid min/max range
    const invalidRange: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        pitch: {
          default: 0,
          min: 12,
          max: -12
        }
      }]
    };
    expect(() => configureDrumControls(invalidRange)).toThrow(
      'Invalid pitch range for drum "Kick": min (12) cannot be greater than max (-12)'
    );

    // Default below minimum
    const defaultBelowMin: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        pitch: {
          default: -13,
          min: -12,
          max: 12
        }
      }]
    };
    expect(() => configureDrumControls(defaultBelowMin)).toThrow(
      'Invalid default pitch for drum "Kick": -13 is below minimum -12'
    );

    // Default above maximum
    const defaultAboveMax: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        pitch: {
          default: 13,
          min: -12,
          max: 12
        }
      }]
    };
    expect(() => configureDrumControls(defaultAboveMax)).toThrow(
      'Invalid default pitch for drum "Kick": 13 is above maximum 12'
    );
  });

  test('validates envelope settings', () => {
    // Valid configuration
    const validConfig: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        envelope: {
          attack: 0.001,
          decay: 0.5,
          sustain: 0.3,
          release: 1.2,
          attackCurve: -100,
          decayCurve: 100,
          releaseCurve: 50
        }
      }]
    };
    expect(() => configureDrumControls(validConfig)).not.toThrow();

    // Invalid negative time values
    const negativeTime: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        envelope: {
          attack: -0.001,
          decay: 0.5,
          sustain: 0.3,
          release: 1.2
        }
      }]
    };
    expect(() => configureDrumControls(negativeTime)).toThrow(
      'Invalid attack time for drum "Kick": -0.001. Must be >= 0'
    );

    // Invalid sustain level
    const invalidSustain: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        envelope: {
          attack: 0.001,
          decay: 0.5,
          sustain: 1.5,
          release: 1.2
        }
      }]
    };
    expect(() => configureDrumControls(invalidSustain)).toThrow(
      'Invalid sustain level for drum "Kick": 1.5. Must be between 0 and 1'
    );

    // Invalid curve value
    const invalidCurve: DrumControlsConfig = {
      drums: [{
        name: "Kick",
        rootNote: 36,
        envelope: {
          attack: 0.001,
          decay: 0.5,
          sustain: 0.3,
          release: 1.2,
          attackCurve: -150
        }
      }]
    };
    expect(() => configureDrumControls(invalidCurve)).toThrow(
      'Invalid attack curve for drum "Kick": -150. Must be between -100 and 100'
    );
  });

  test('generates valid drum kit configuration', () => {
    const config: DrumControlsConfig = {
      drums: [
        {
          name: "Kick",
          rootNote: 36,
          pitch: {
            default: 0,
            min: -12,
            max: 12
          },
          envelope: {
            attack: 0.001,
            decay: 0.5,
            sustain: 0.3,
            release: 1.2,
            attackCurve: -100,
            decayCurve: 100,
            releaseCurve: 50
          }
        },
        {
          name: "Snare",
          rootNote: 38,  // Standard MIDI note for snare
          // Only envelope, no pitch
          envelope: {
            attack: 0.001,
            decay: 0.3,
            sustain: 0,
            release: 0.8
          }
        }
      ]
    };

    const drumKit = configureDrumControls(config);

    // Check global settings
    expect(drumKit.globalSettings.drumControls).toBeDefined();
    expect(drumKit.globalSettings.drumControls?.Kick.pitch).toBeDefined();
    expect(drumKit.globalSettings.drumControls?.Kick.envelope).toBeDefined();
    expect(drumKit.globalSettings.drumControls?.Snare.envelope).toBeDefined();
    expect(drumKit.globalSettings.drumControls?.Snare.pitch).toBeUndefined();

    // Check drum pieces
    expect(drumKit.drumPieces).toHaveLength(2);
    expect(drumKit.drumPieces[0].name).toBe("Kick");
    expect(drumKit.drumPieces[1].name).toBe("Snare");
  });
});
