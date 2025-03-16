import { BasicDrumKitConfig } from './basic-drum-kit.js';
import { AdvancedDrumKitConfig } from './advanced-drum-kit.js';
import { configureMicBuses, generateSampleBusRouting } from './mic-routing.js';

export function generateGroupsXml(config: BasicDrumKitConfig | AdvancedDrumKitConfig): string {
  const { globalSettings, drumPieces } = config;
  
  // Generate buses XML if mic routing is configured (advanced only)
  const busesXml = 'micBuses' in globalSettings && globalSettings.micBuses ? 
    configureMicBuses(globalSettings.micBuses) : '';
  
  // Add round robin attributes to top-level groups if configured
  const roundRobinAttrs = 'roundRobin' in globalSettings && globalSettings.roundRobin
    ? ` seqMode="${globalSettings.roundRobin.mode}"${
        globalSettings.roundRobin.length 
          ? ` seqLength="${globalSettings.roundRobin.length}"`
          : ''
      }`
    : '';

  const groups: string[] = [];

  for (const piece of drumPieces) {
    // Combine muting and round robin attributes for group (advanced only)
    let groupAttrs = 'muting' in piece && piece.muting 
      ? ` tags="${piece.muting.tags.join(',')}" silencedByTags="${piece.muting.silencedByTags.join(',')}" silencingMode="fast"`
      : '';
    
    // Add group-level round robin settings if present
    if ('seqMode' in piece && piece.seqMode) {
      groupAttrs += ` seqMode="${piece.seqMode}"`;
    }
    if ('seqLength' in piece && piece.seqLength) {
      groupAttrs += ` seqLength="${piece.seqLength}"`;
    }
    if ('seqPosition' in piece && piece.seqPosition) {
      groupAttrs += ` seqPosition="${piece.seqPosition}"`;
    }

    // Add drum controls if configured (advanced only)
    const drumControls = 'drumControls' in globalSettings && globalSettings.drumControls?.[piece.name];
    let envelopeAttrs = '';
    let pitchControl = '';
    
    if (drumControls) {
      // Add envelope attributes if configured
      if (drumControls.envelope) {
        const env = drumControls.envelope;
        envelopeAttrs = ` attack="${env.attack}" decay="${env.decay}" sustain="${env.sustain}" release="${env.release}"`;
        if (env.attackCurve !== undefined) envelopeAttrs += ` attackCurve="${env.attackCurve}"`;
        if (env.decayCurve !== undefined) envelopeAttrs += ` decayCurve="${env.decayCurve}"`;
        if (env.releaseCurve !== undefined) envelopeAttrs += ` releaseCurve="${env.releaseCurve}"`;
      }
      
      // Add pitch control if configured
      if (drumControls.pitch) {
        const pitch = drumControls.pitch;
        groupAttrs += ` tuning="${pitch.default}"`;
        pitchControl = `      <control type="pitch" name="${piece.name} Pitch" default="${pitch.default}"` +
          (pitch.min !== undefined ? ` minimum="${pitch.min}"` : '') +
          (pitch.max !== undefined ? ` maximum="${pitch.max}"` : '') +
          `>\n        <binding type="general" level="group" position="0" parameter="groupTuning" />\n      </control>\n`;
      }
    }

    const sampleElements: string[] = [];
    
    for (const sample of piece.samples) {
      const volumeAttr = sample.volume ? ` volume="${sample.volume}"` : '';
      let velocityAttrs = '';
      if (globalSettings.velocityLayers) {
        const layerIndex = piece.samples.indexOf(sample);
        if (layerIndex < globalSettings.velocityLayers.length) {
          const layer = globalSettings.velocityLayers[layerIndex];
          velocityAttrs = ` loVel="${layer.low}" hiVel="${layer.high}"`;
        }
      }
      
      // Add sample-level round robin settings
      let sampleRRAttrs = '';
      if ('seqMode' in sample && sample.seqMode) {
        sampleRRAttrs += ` seqMode="${sample.seqMode}"`;
      }
      if ('seqLength' in sample && sample.seqLength) {
        sampleRRAttrs += ` seqLength="${sample.seqLength}"`;
      }
      if ('seqPosition' in sample && sample.seqPosition) {
        sampleRRAttrs += ` seqPosition="${sample.seqPosition}"`;
      }

      // Generate sample element with bus routing if configured (advanced only)
      const sampleXml = 'micConfig' in sample && sample.micConfig ? 
        generateSampleBusRouting(sample.path, sample.micConfig.busIndex, sample.micConfig.volume) :
        `      <sample path="${sample.path}"${volumeAttr} rootNote="${piece.rootNote}" ` +
        `loNote="${piece.rootNote}" hiNote="${piece.rootNote}"${velocityAttrs}${sampleRRAttrs} />`;
      
      sampleElements.push(sampleXml);
    }

    groups.push(
      `  <group name="${piece.name}" ampVelTrack="1"${groupAttrs}${envelopeAttrs}>\n` +
      (pitchControl ? pitchControl : '') +
      `${sampleElements.join('\n')}\n` +
      `  </group>`
    );
  }

  // Combine buses and groups XML
  const xml = [];
  if (busesXml) xml.push(busesXml);
  xml.push(`<groups${roundRobinAttrs}>\n${groups.join('\n\n')}\n</groups>`);
  
  return xml.join('\n\n');
}
