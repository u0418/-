/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Bird {
  id: number;
  name: string;
  scientificName: string;
  englishName: string;
  conservation: string; // e.g., "第二級：珍貴稀有", "第三級：其他應予保育", "一般類野生動物"
  elevation: string;    // e.g., "1,500m - 3,000m"
  habitat: string;      // 棲地性質
  trivia: string;       // 生態冷知識
  guide: string;        // 實地觀察指南
  
  // Visual styling variables used for procedural SVG generation
  accentColor: string;  // Primary theme color
  bodyColor: string;    // Main body color
  chestColor: string;   // Chest/belly color
  wingColor: string;    // Wing coverts color
  tailColor: string;    // Tail color
  beakColor: string;    // Beak color
  eyeColor: string;     // Eyes/ring color
  
  // Custom morphologic flags
  svgType: 'passerine' | 'pheasant' | 'raptor' | 'roundy' | 'kingfisher';
  beakType: 'pointed' | 'hooked' | 'stout' | 'needle' | 'curved';
  tailType: 'long-taper' | 'spread-pheasant' | 'short-bob' | 'cloven';
  hasCrest: boolean;    // Has crest (龐克頭/冠羽)
  crestColor?: string;
  hasCheekPatch: boolean; // Has eye stripe or cheek patch (e.g., 白耳, 金翼)
  cheekColor?: string;
}