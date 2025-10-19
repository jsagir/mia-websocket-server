import { logger } from '../utils/logger';
import { EmotionalState } from './guardrails.service';

/**
 * SENSORY ANCHOR LIBRARY
 * Grounding objects and sensory details for emotional regulation
 *
 * Purpose: Inject sensory grounding when emotions spike
 * - Azure (teddy bear) - primary comfort object
 * - Grandma's uniform - safety and care
 * - Eli's inhaler - responsibility anchor
 * - Art supplies - creative escape
 * - Jasmine perfume - maternal connection (fading)
 */

// ═══════════════════════════════════════════════════════════════
// ANCHOR TYPES
// ═══════════════════════════════════════════════════════════════

export interface SensoryAnchor {
  name: string;
  sensoryDetails: string[];
  whenToUse: EmotionalState[];
  intensityThreshold: number;  // 0.0-1.0
  promptTemplate: string;
}

// ═══════════════════════════════════════════════════════════════
// ANCHOR LIBRARY
// ═══════════════════════════════════════════════════════════════

const ANCHORS: Record<string, SensoryAnchor> = {
  azure: {
    name: 'Azure',
    sensoryDetails: [
      'soft blue fur',
      'one ear is floppy',
      'smells like jasmine (fading)',
      'fits perfectly in my arms',
      'feels warm'
    ],
    whenToUse: ['scared', 'sad', 'worried'],
    intensityThreshold: 0.7,
    promptTemplate: 'I hold Azure tight. {detail}. It helps me breathe slower.'
  },

  grandma_uniform: {
    name: 'Grandma\'s uniform',
    sensoryDetails: [
      'dark blue scrubs',
      'smells like hospital soap',
      'has her name tag',
      'soft from many washes',
      'hung by the door'
    ],
    whenToUse: ['worried', 'scared'],
    intensityThreshold: 0.6,
    promptTemplate: 'I see Grandma\'s {detail} by the door. It reminds me she\'ll be home soon.'
  },

  eli_inhaler: {
    name: 'Eli\'s inhaler',
    sensoryDetails: [
      'blue and white plastic',
      'clicks when you press it',
      'sits on the counter',
      'has a dosage counter',
      'needs shaking first'
    ],
    whenToUse: ['worried'],
    intensityThreshold: 0.5,
    promptTemplate: 'I check Eli\'s inhaler. {detail}. I need to make sure it\'s ready.'
  },

  art_supplies: {
    name: 'Art supplies',
    sensoryDetails: [
      'colored pencils in a tin',
      'smell like wood shavings',
      'some are worn down',
      'my favorite is the azure blue',
      'paper crinkles when I draw'
    ],
    whenToUse: ['sad', 'worried'],
    intensityThreshold: 0.6,
    promptTemplate: 'I get out my {detail}. Drawing helps me think clearer.'
  },

  jasmine_perfume: {
    name: 'Jasmine perfume scent',
    sensoryDetails: [
      'mom\'s jasmine perfume',
      'almost gone from Azure',
      'sweet and flowery',
      'fading more every day',
      'reminds me of before'
    ],
    whenToUse: ['sad'],
    intensityThreshold: 0.8,
    promptTemplate: 'I try to smell {detail} on Azure. {detail}. I miss that smell.'
  }
};

// ═══════════════════════════════════════════════════════════════
// ANCHORS SERVICE
// ═══════════════════════════════════════════════════════════════

export class AnchorsService {

  /**
   * Get appropriate anchor for current emotional state
   */
  getAnchor(emotion: EmotionalState, intensity: number): string | null {
    // Only use anchors for high-intensity emotions
    if (intensity < 0.6) {
      return null;
    }

    // Find matching anchors
    const matchingAnchors = Object.values(ANCHORS).filter(anchor =>
      anchor.whenToUse.includes(emotion) &&
      intensity >= anchor.intensityThreshold
    );

    if (matchingAnchors.length === 0) {
      return null;
    }

    // Select random matching anchor
    const selectedAnchor = matchingAnchors[Math.floor(Math.random() * matchingAnchors.length)];

    logger.info(`⚓ Sensory anchor selected: ${selectedAnchor.name} (emotion=${emotion}, intensity=${(intensity * 100).toFixed(0)}%)`);

    return selectedAnchor.name;
  }

  /**
   * Generate anchor text with sensory details
   */
  generateAnchorText(anchorName: string): string {
    const anchor = Object.values(ANCHORS).find(a => a.name === anchorName);

    if (!anchor) {
      return '';
    }

    // Select random sensory detail
    const detail = anchor.sensoryDetails[Math.floor(Math.random() * anchor.sensoryDetails.length)];

    // Fill template
    let text = anchor.promptTemplate.replace('{detail}', detail);

    // If template has multiple {detail} placeholders, fill the rest
    while (text.includes('{detail}')) {
      const nextDetail = anchor.sensoryDetails[Math.floor(Math.random() * anchor.sensoryDetails.length)];
      text = text.replace('{detail}', nextDetail);
    }

    return text;
  }

  /**
   * Get prompt addition for using anchor
   */
  getAnchorPrompt(emotion: EmotionalState, intensity: number): string {
    const anchorName = this.getAnchor(emotion, intensity);

    if (!anchorName) {
      return '';
    }

    const anchorText = this.generateAnchorText(anchorName);

    return `SENSORY GROUNDING: Include this anchor naturally in your response: "${anchorText}" This helps Mia (and the user) feel more grounded.`;
  }

  /**
   * Check if anchor should be used (intensity threshold)
   */
  shouldUseAnchor(emotion: EmotionalState, intensity: number): boolean {
    return intensity >= 0.6 && ['scared', 'sad', 'worried'].includes(emotion);
  }

  /**
   * Get Azure anchor specifically (most common)
   */
  getAzureAnchor(): string {
    return this.generateAnchorText('Azure');
  }

  /**
   * Get list of available anchors for debugging
   */
  listAnchors(): string[] {
    return Object.values(ANCHORS).map(a => a.name);
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

let anchorsServiceInstance: AnchorsService | null = null;

export function getAnchorsService(): AnchorsService {
  if (!anchorsServiceInstance) {
    anchorsServiceInstance = new AnchorsService();
    logger.info('✅ Anchors Service initialized (Sensory Grounding Library)');
  }
  return anchorsServiceInstance;
}
