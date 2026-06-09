/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bird } from './types';

interface BirdSvgProps {
  bird: Bird;
  isSilhouette?: boolean;
  customDrawingUrl?: string | null;
}

export const BirdSvg: React.FC<BirdSvgProps> = ({ bird, isSilhouette = false, customDrawingUrl = null }) => {
  // Hash function for subtle organic variations based on bird ID
  const hash = (offset: number) => {
    const x = Math.sin(bird.id * 754.3 + offset) * 10000;
    return x - Math.floor(x);
  };

  // Habitat and Elevation categories
  const isHighAltitude = bird.elevation.includes("2,000m") || bird.elevation.includes("2,500m") || bird.elevation.includes("1,800m");
  const isWaterDweller = bird.habitat.includes("溪") || bird.habitat.includes("水") || bird.habitat.includes("瀑布") || bird.habitat.includes("湧泉");

  // Determine colors based on silhouette state
  const bodyPaint = isSilhouette ? '#332f29' : bird.bodyColor;
  const chestPaint = isSilhouette ? '#2b2722' : bird.chestColor;
  const wingPaint = isSilhouette ? '#26221d' : bird.wingColor;
  const tailPaint = isSilhouette ? '#1c1916' : bird.tailColor;
  const beakPaint = isSilhouette ? '#403a33' : bird.beakColor;
  const eyePaint = isSilhouette ? '#403a33' : bird.eyeColor;
  const accentPaint = isSilhouette ? '#332f29' : bird.accentColor;
  const crestPaint = isSilhouette ? '#332f29' : (bird.crestColor || bird.accentColor);
  const cheekPaint = isSilhouette ? '#332f29' : (bird.cheekColor || bird.accentColor);

  // SVG Dimension Constants
  const width = 240;
  const height = 240;

  // Render a beautiful, artistic, atmospheric environment backdrop
  const renderBackdrop = () => {
    if (isSilhouette) return null;

    // Pick a gorgeous glow color reflecting the bird's nature
    let sunColor = "#fef08a"; // default warm yellow
    let mistColor = "#f1f5f9"; // misty white-gray

    if (isWaterDweller) {
      sunColor = "#bae6fd"; // aquatic light blue glow
      mistColor = "#ecfeff";
    } else if (isHighAltitude) {
      sunColor = "#ddd6fe"; // alpine twilight lavender
      mistColor = "#f8fafc";
    } else if (bird.accentColor) {
      // derive slightly pale backing glow from the bird's own accent color
      sunColor = bird.accentColor + "22"; // transparent accent
    }

    return (
      <g id="ambient-backdrop">
        {/* Soft atmospheric halo / sun */}
        <circle
          cx="120"
          cy="110"
          r="68"
          fill={`url(#ambient-sun-grad-${bird.id})`}
          opacity="0.8"
        />
        {/* Floating atmospheric pollen or water-mist dots */}
        <g opacity="0.35">
          <circle cx="70" cy="70" r="1.5" fill={sunColor} />
          <circle cx="175" cy="85" r="2.5" fill={sunColor} />
          <circle cx="160" cy="50" r="1.2" fill={sunColor} />
          <circle cx="65" cy="140" r="2.2" fill={sunColor} />
          <circle cx="190" cy="130" r="1.8" fill={sunColor} />
        </g>
      </g>
    );
  };

  // Render ground / branch / river environments
  const renderEnvironment = () => {
    if (isSilhouette) return null;

    if (isWaterDweller) {
      // Exquisite creek layout: sparkling water layers and a mossy, shiny river stone
      return (
        <g id="env-water">
          {/* Distant water wave */}
          <path
            d="M 10 188 C 50 178, 90 198, 130 188 C 170 178, 210 198, 230 188"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.25"
          />
          {/* Beautiful smooth river rock with 3D gradient */}
          <path
            d="M 28 205 C 28 152, 212 152, 212 205 Z"
            fill={`url(#rock-grad-${bird.id})`}
          />
          {/* Shiny wet highlight edge on the rock */}
          <path
            d="M 38 190 Q 120 156, 202 190"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            opacity="0.35"
          />
          {/* Velvet green moss patches on the stone */}
          <path
            d="M 45 186 Q 65 174, 85 183 C 78 185, 55 188, 45 186 Z"
            fill="#15803d"
            opacity="0.75"
          />
          <path
            d="M 152 178 Q 170 166, 188 176 C 180 179, 160 180, 152 178 Z"
            fill="#16a34a"
            opacity="0.75"
          />
          {/* Splashing water rings / bubbles */}
          <circle cx="195" cy="192" r="3" fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.6" />
          <circle cx="45" cy="196" r="2" fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.4" />
        </g>
      );
    } else if (isHighAltitude) {
      // High-altitude timber branch with thick, detailed pine needles and a geometric pinecone
      return (
        <g id="env-alpine">
          {/* Japanese-style high-mountain clouds */}
          <path
            d="M 15 55 Q 55 40, 95 55 T 165 52 Q 185 62, 215 48"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M -10 92 Q 35 84, 80 94 T 185 82"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Detailed pine needle clusters extending from the branch locations */}
          <g stroke="#1e3f20" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
            {/* Left needle cluster */}
            <line x1="75" y1="184" x2="52" y2="162" />
            <line x1="75" y1="184" x2="55" y2="152" />
            <line x1="75" y1="184" x2="63" y2="145" />
            <line x1="75" y1="184" x2="78" y2="142" />
            
            {/* Center needle cluster */}
            <line x1="140" y1="175" x2="115" y2="150" />
            <line x1="140" y1="175" x2="125" y2="140" />
            <line x1="140" y1="175" x2="138" y2="135" />
            <line x1="140" y1="175" x2="152" y2="142" />
            <line x1="140" y1="175" x2="162" y2="152" />

            {/* Right needle cluster */}
            <line x1="205" y1="170" x2="190" y2="140" />
            <line x1="205" y1="170" x2="208" y2="135" />
            <line x1="205" y1="170" x2="224" y2="142" />
            <line x1="205" y1="170" x2="235" y2="155" />
          </g>

          {/* Golden organic wooden branch */}
          <path
            d="M 255 168 Q 150 168, 45 186"
            fill="none"
            stroke={`url(#wood-grad-${bird.id})`}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Inner bark shade */}
          <path
            d="M 255 171 Q 150 171, 45 189"
            fill="none"
            stroke="#451a03"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.35"
          />

          {/* Hanging rustic alpine pinecone */}
          <g transform="translate(170, 172)" opacity="0.9">
            <path d="M 0 0 C -8 5, -8 18, 0 24 C 8 18, 8 5, 0 0 Z" fill="#7c2d12" />
            {/* Pinecone wooden scales */}
            <path d="M -6 7 Q 0 10, 6 7 M -7 13 Q 0 16, 7 13 M -5 19 Q 0 21, 5 19" fill="none" stroke="#451a03" strokeWidth="1.2" />
          </g>
        </g>
      );
    } else {
      // Woodsy lowland and mid-altitude setup: twisting cherry blossom branch with petals and organic leaves
      const isPinkFlowers = bird.id % 2 === 0;
      const flowerPetalPaint = isPinkFlowers ? "#fecdd3" : "#fef08a"; // Light pink or warm canary
      const flowerHeartPaint = isPinkFlowers ? "#f43f5e" : "#ea580c"; // Deep crimson or bright orange

      return (
        <g id="env-wood">
          {/* Distant mountain mist lines */}
          <path
            d="M 10 32 Q 90 48, 170 32 T 250 48"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Main detailed tree branch */}
          <path
            d="M -12 186 C 58 176, 158 152, 252 180"
            fill="none"
            stroke={`url(#wood-grad-${bird.id})`}
            strokeWidth="7.5"
            strokeLinecap="round"
          />
          
          {/* Tree branch wood bark texture crack */}
          <path
            d="M -10 187 C 55 178, 155 155, 235 181"
            fill="none"
            stroke="#451a03"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* Secondary offsets twigs */}
          <path
            d="M 166 162 Q 192 136, 222 142"
            fill="none"
            stroke="#451a03"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 68 178 Q 45 160, 22 165"
            fill="none"
            stroke="#451a03"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Broad, fresh green leaves with veins and gradients */}
          <g id="broad-leaves">
            {/* Left Leaf */}
            <g transform="translate(25, 158) rotate(-15)">
              <path d="M 0 10 Q -12 -5, 0 -18 Q 12 -5, 0 10 Z" fill={`url(#leaf-grad-1-${bird.id})`} />
              <path d="M 0 8 L 0 -16" stroke="#15803d" strokeWidth="1" opacity="0.4" />
            </g>
            {/* Center-Right Leaf */}
            <g transform="translate(128, 153) rotate(35)">
              <path d="M 0 12 Q -10 -5, 0 -22 Q 10 -5, 0 12 Z" fill={`url(#leaf-grad-2-${bird.id})`} />
              <path d="M 0 10 L 0 -20" stroke="#16a34a" strokeWidth="1.2" opacity="0.4" />
            </g>
          </g>
          
          {/* Detailed Blooming Cherry Blossoms / Wild Mountain Flowers */}
          {/* Flower 1 at coord (205, 138) */}
          <g transform="translate(205, 138)">
            {/* 5 Petals */}
            <circle cx="0" cy="-5" r="4.5" fill={flowerPetalPaint} />
            <circle cx="-5" cy="-1.5" r="4.5" fill={flowerPetalPaint} />
            <circle cx="5" cy="-1.5" r="4.5" fill={flowerPetalPaint} />
            <circle cx="-3" cy="4" r="4.5" fill={flowerPetalPaint} />
            <circle cx="3" cy="4" r="4.5" fill={flowerPetalPaint} />
            {/* Stamen/Pistil heart circle */}
            <circle cx="0" cy="0" r="2.2" fill={flowerHeartPaint} />
            {/* Little stamen dots */}
            <circle cx="0" cy="0" r="0.8" fill="#ffffff" />
          </g>

          {/* Flower 2 at coord (224, 143) */}
          <g transform="translate(224, 143) scale(0.85)">
            <circle cx="0" cy="-5" r="4.5" fill={flowerPetalPaint} opacity="0.9" />
            <circle cx="-5" cy="-1.5" r="4.5" fill={flowerPetalPaint} opacity="0.9" />
            <circle cx="5" cy="-1.5" r="4.5" fill={flowerPetalPaint} opacity="0.9" />
            <circle cx="-3" cy="4" r="4.5" fill={flowerPetalPaint} opacity="0.9" />
            <circle cx="3" cy="4" r="4.5" fill={flowerPetalPaint} opacity="0.9" />
            <circle cx="0" cy="0" r="2.2" fill={flowerHeartPaint} />
          </g>

          {/* Falling flower petal drifting in the mountain breeze */}
          <path
            d="M 52 142 C 48 136, 38 138, 42 144 C 44 147, 50 148, 52 142 Z"
            fill={flowerPetalPaint}
            opacity="0.8"
            transform="rotate(25, 47, 142)"
          />
        </g>
      );
    }
  };

  // Render bird gripping claws clamping the branch/rock
  const renderFeet = () => {
    // Calibrate foot height depending on morphological tallness
    const yVal = bird.svgType === 'pheasant' ? 186 : (bird.svgType === 'raptor' && !bird.name.includes("鵂鶓") ? 172 : 166);
    const leftToeX = 99;
    const rightToeX = 120;

    return (
      <g stroke={isSilhouette ? "#201c18" : "#44403c"} strokeWidth="2.8" strokeLinecap="round" fill="none" id="bird-claws">
        {/* Left Foot digits */}
        <line x1={leftToeX} y1={yVal} x2={leftToeX - 6} y2={yVal + 9} />
        <line x1={leftToeX} y1={yVal} x2={leftToeX + 2} y2={yVal + 10} />
        <line x1={leftToeX} y1={yVal} x2={leftToeX - 11} y2={yVal + 4} />
        
        {/* Right Foot digits */}
        <line x1={rightToeX} y1={yVal} x2={rightToeX - 4} y2={yVal + 10} />
        <line x1={rightToeX} y1={yVal} x2={rightToeX + 6} y2={yVal + 9} />
        <line x1={rightToeX} y1={yVal} x2={rightToeX + 11} y2={yVal + 4} />
      </g>
    );
  };

  // Render highly-detailed, layered tail feathers with complex shading
  const renderTail = () => {
    switch (bird.tailType) {
      case 'long-taper':
        // Elegant long tail feathers (Taiwan Blue Magpie, White-eared Sibia, Laughingthrushes)
        const isBlueMagpie = bird.id === 1;
        return (
          <g id="tail-long-taper">
            {/* Primary underlying dark shading tail plume */}
            <path
              d="M 120 142 Q 165 210, 158 244 Q 146 242, 110 152 Z"
              fill="#111827"
              opacity="0.8"
            />
            {/* Vibrant main top tail plume with rich gradient */}
            <path
              d="M 123 140 Q 166 206, 155 245 C 147 243, 141 216, 114 150 Z"
              fill={`url(#tail-grad-${bird.id})`}
            />

            {/* If Taiwan Blue Magpie, generate its signature stepped black-and-white tail panels */}
            {isBlueMagpie && !isSilhouette && (
              <g id="blue-magpie-tail-decor">
                {/* Stepped tail bars */}
                {/* Bar 1 */}
                <path d="M 137 184 L 149 193 L 140 198 Z" fill="#030712" />
                <path d="M 149 193 L 153 196 L 144 201 Z" fill="#f8fafc" />
                {/* Bar 2 */}
                <path d="M 144 205 L 157 215 L 147 220 Z" fill="#030712" />
                <path d="M 157 215 L 161 218 L 151 223 Z" fill="#f8fafc" />
                {/* Pure white majestic tip */}
                <path d="M 149 229 Q 155 240, 155 245 C 151 245, 146 238, 141 231 Z" fill="#f8fafc" />
              </g>
            )}

            {/* Shimmer light reflection streak down the tail */}
            {!isSilhouette && (
              <path
                d="M 123 145 Q 150 195, 148 230"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1"
                opacity="0.25"
              />
            )}
          </g>
        );

      case 'spread-pheasant':
        // Magnificent layered gamebird tail featuring elegant bar detailing (Mikado, Swinhoe, Eagle)
        const isMikado = bird.id === 2;
        return (
          <g id="tail-spread-pheasant">
            {/* Lower broad backdrop feather */}
            <path
              d="M 132 136 Q 202 182, 238 214 C 228 221, 218 218, 118 148 Z"
              fill="#0f172a"
              opacity="0.9"
            />
            {/* Main upper feathered deck */}
            <path
              d="M 128 138 Q 201 180, 235 215 Q 220 221, 116 146 Z"
              fill={`url(#tail-grad-${bird.id})`}
            />
            {/* Inner accent deck */}
            <path
              d="M 124 140 Q 186 195, 212 232 Q 200 236, 114 148 Z"
              fill={`url(#accent-grad-${bird.id})`}
              opacity="0.8"
            />

            {/* High-contrast majestic white/slate bars on pheasant tail feathers */}
            {!isSilhouette && (
              <g stroke={isMikado ? "#f8fafc" : "#cbd5e1"} strokeWidth="2.4" strokeLinecap="round" opacity="0.65">
                <line x1="152" y1="156" x2="160" y2="171" strokeWidth="2" />
                <line x1="171" y1="170" x2="181" y2="187" />
                <line x1="190" y1="184" x2="202" y2="203" strokeWidth="2.8" />
                <line x1="206" y1="196" x2="221" y2="218" strokeWidth="3" />
              </g>
            )}
          </g>
        );

      case 'cloven':
        // Distinctive V-shaped swallow or tit fork-tail
        return (
          <g id="tail-cloven">
            {/* Left prong feather */}
            <path
              d="M 115 142 L 138 198 C 131 197, 125 188, 110 148 Z"
              fill={`url(#tail-grad-${bird.id})`}
            />
            {/* Right prong feather with highlight */}
            <path
              d="M 122 140 L 152 192 L 140 186 L 116 145 Z"
              fill={`url(#accent-grad-${bird.id})`}
              opacity="0.9"
            />
            {/* Inner shadow crease */}
            <line x1="117" y1="142" x2="128" y2="174" stroke="#0f172a" strokeWidth="1.5" opacity="0.4" />
          </g>
        );

      case 'short-bob':
      default:
        // Stout, cute fan tail (Flamecrest, Barbet, Kingfisher, Owls)
        return (
          <g id="tail-short-bob">
            {/* Shadow layer */}
            <path
              d="M 114 138 Q 148 162, 138 174 Q 112 158, 106 140 Z"
              fill="#0f172a"
              opacity="0.4"
            />
            {/* Core tail */}
            <path
              d="M 118 136 Q 146 161, 137 172 Q 113 157, 108 138 Z"
              fill={`url(#tail-grad-${bird.id})`}
            />
            {/* Individual feather rib guides */}
            {!isSilhouette && (
              <g stroke="#ffffff" strokeWidth="1" opacity="0.25">
                <line x1="120" y1="142" x2="133" y2="164" />
                <line x1="114" y1="140" x2="122" y2="160" />
              </g>
            )}
          </g>
        );
    }
  };

  // Render bird body profile, wings, chest shields, and volume shading
  const renderBody = () => {
    const isOwl = bird.name.includes("鵂鶓");

    if (isOwl) {
      // Frontal facing Collared Pygmy Owl: incredibly volumetric and adorable chibi vector layout
      return (
        <g id="body-owl">
          {/* Owl core body puff sphere */}
          <circle cx="110" cy="120" r="54" fill={`url(#body-grad-${bird.id})`} />

          {/* Dimensional shadow overlay */}
          <path
            d="M 110 173 C 139 173, 161 151, 161 120 C 161 135, 139 169, 110 169 C 81 169, 59 135, 59 120 Q 59 173, 110 173 Z"
            fill="#000000"
            opacity="0.14"
          />

          {/* Owl facial feather discs (concentric discs for left/right eyes) */}
          <ellipse cx="91" cy="111" rx="20" ry="18" fill={`url(#owl-facial-disc-${bird.id})`} stroke="#ffffff" strokeWidth="1" />
          <ellipse cx="129" cy="111" rx="20" ry="18" fill={`url(#owl-facial-disc-${bird.id})`} stroke="#ffffff" strokeWidth="1" />

          {/* Intensely cute golden black cartoon eyes */}
          <circle cx="91" cy="111" r="11.5" fill={isSilhouette ? '#403a33' : '#eab308'} />
          <circle cx="91" cy="111" r="6.8" fill="#1c1917" />
          <circle cx="129" cy="111" r="11.5" fill={isSilhouette ? '#403a33' : '#eab308'} />
          <circle cx="129" cy="111" r="6.8" fill="#1c1917" />

          {/* Double shiny kawaii highlights */}
          {!isSilhouette && (
            <>
              <circle cx="89" cy="109" r="2.2" fill="#ffffff" />
              <circle cx="93" cy="113" r="1" fill="#ffffff" opacity="0.8" />
              <circle cx="127" cy="109" r="2.2" fill="#ffffff" />
              <circle cx="131" cy="113" r="1" fill="#ffffff" opacity="0.8" />
            </>
          )}

          {/* Little white brow plumes (eyebrows) */}
          {!isSilhouette && (
            <g stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
              <path d="M 80 98 Q 92 98, 102 105" fill="none" />
              <path d="M 140 98 Q 128 98, 118 105" fill="none" />
            </g>
          )}

          {/* Cute tiny pocket golden beak */}
          <path
            d="M 110 112 Q 107 119, 110 125 Q 113 119, 110 112 Z"
            fill={`url(#beak-grad-${bird.id})`}
          />

          {/* Fluffy barred throat necklace / "collar" (Collared Owl signature) */}
          {(!isSilhouette) && (
            <path
              d="M 74 133 C 85 142, 135 142, 146 133"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          )}

          {/* Detailed fluffy chest feather spots/bars */}
          {!isSilhouette && (
            <g stroke={chestPaint} strokeWidth="2.5" fill="none" opacity="0.8" strokeLinecap="round">
              <path d="M 94 138 Q 110 148, 126 138" />
              <path d="M 88 149 Q 110 159, 132 149" strokeWidth="2" />
              <path d="M 97 160 Q 110 167, 123 160" strokeWidth="1.8" />
              {/* Vertical arrow ticks on the chest */}
              <path d="M 100 144 L 100 150 M 110 146 L 110 154 M 120 144 L 120 150" strokeWidth="2.2" />
            </g>
          )}

          {/* Cute stubby baby-round wings on the sides */}
          <path d="M 62 114 Q 45 130, 64 144 Q 68 130, 62 114" fill={`url(#wing-grad-${bird.id})`} />
          <path d="M 158 114 Q 175 130, 156 144 Q 152 130, 158 114" fill={`url(#wing-grad-${bird.id})`} opacity="0.96" />

          {/* Sweet pink blushing cheeks */}
          {!isSilhouette && (
            <>
              <circle cx="78" cy="122" r="6.5" fill="#f43f5e" opacity="0.45" />
              <circle cx="142" cy="122" r="6.5" fill="#f43f5e" opacity="0.45" />
            </>
          )}
        </g>
      );
    }

    // Default profiles for the other 4 SVG morphologies rewritten to be ultra-chubby (Kotori Tai illustration character style)
    switch (bird.svgType) {
      case 'pheasant':
        // Regal yet adorable chubby round gamebird mascot
        return (
          <g id="body-pheasant">
            {/* Super chubby cute merged head and body */}
            <circle cx="106" cy="116" r="44" fill={`url(#body-grad-${bird.id})`} />
            <circle cx="94" cy="74" r="22" fill={`url(#body-grad-${bird.id})`} />
            <path
              d="M 74 90 Q 94 92, 114 90 Q 110 114, 74 114 Z"
              fill={`url(#chest-grad-${bird.id})`}
              opacity="0.9"
            />

            {/* Lush, cute stubby wing */}
            <path
              d="M 94 114 Q 132 116, 126 138 Q 104 144, 94 114 Z"
              fill={`url(#wing-grad-${bird.id})`}
            />
            
            {/* Soft highlight lines */}
            {!isSilhouette && (
              <g stroke={accentPaint} strokeWidth="1.8" strokeLinecap="round" opacity="0.65" fill="none">
                <path d="M 102 122 Q 118 124, 122 132" />
                <path d="M 98 128 Q 112 130, 116 136" />
              </g>
            )}
          </g>
        );

      case 'roundy':
        // Super fluffy, chubby ball bird (Flamecrest, Robin, Weebills)
        return (
          <g id="body-roundy">
            {/* Fluffy perfectly round body */}
            <circle cx="104" cy="116" r="45" fill={`url(#body-grad-${bird.id})`} />

            {/* Volumetric cute belly pattern in front */}
            <path
              d="M 68 114 Q 58 142, 102 159 Q 128 147, 130 125 C 105 132, 85 126, 68 114 Z"
              fill={`url(#chest-grad-${bird.id})`}
            />

            {/* Extremely cute, stubby round wing */}
            <path
              d="M 90 114 Q 133 118, 128 140 Q 102 144, 90 114 Z"
              fill={`url(#wing-grad-${bird.id})`}
            />

            {/* Accent lines */}
            {!isSilhouette && (
              <path
                d="M 98 122 Q 118 124, 120 134"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />
            )}
          </g>
        );

      case 'kingfisher':
        // Chubby, compact, highly energetic cartoon layout
        const isBarbet = bird.id === 10;
        return (
          <g id="body-kingfisher">
            {/* Chubby body and head */}
            <circle cx="106" cy="116" r="42" fill={`url(#body-grad-${bird.id})`} />
            <circle cx="92" cy="85" r="23" fill={`url(#body-grad-${bird.id})`} />
            <path
              d="M 72 102 Q 92 106, 110 102 Q 106 122, 72 122 Z"
              fill={`url(#chest-grad-${bird.id})`}
              opacity="0.9"
            />

            {/* Custom makeup mapping for Taiwan Barbet (五色鳥) */}
            {isBarbet && !isSilhouette && (
              <g id="barbet-rainbow-makeup">
                {/* 1. Yellow forehead and throat */}
                <path d="M 74 72 C 78 65, 96 65, 98 75 Z" fill="#eab308" />
                <path d="M 72 110 C 76 104, 90 102, 94 114 C 86 118, 76 116, 72 110 Z" fill="#eab308" />
                
                {/* 2. Azure cheek patch */}
                <ellipse cx="94" cy="94" rx="10" ry="7.5" fill="#06b6d4" />
                <path d="M 74 102 Q 88 104, 98 114" fill="none" stroke="#06b6d4" strokeWidth="4.5" strokeLinecap="round" />

                {/* 3. Jet Black mask around eye */}
                <path d="M 75 80 C 81 78, 92 78, 96 85 L 84 83 Z" fill="#1e293b" />

                {/* 4. Scarlet collar */}
                <path d="M 96 72 C 102 72, 108 76, 110 82" fill="none" stroke="#ef4444" strokeWidth="3" />
                <circle cx="100" cy="112" r="4.5" fill="#ef4444" />
              </g>
            )}

            {/* Cute stubby wing */}
            <path
              d="M 92 116 Q 130 118, 124 138 Q 102 142, 92 116 Z"
              fill={`url(#wing-grad-${bird.id})`}
            />
          </g>
        );

      case 'raptor':
      default:
        // Chubby bird of prey (Chibi griffin layout)
        return (
          <g id="body-raptor">
            {/* Proud but extremely chubby body and head */}
            <circle cx="106" cy="116" r="43" fill={`url(#body-grad-${bird.id})`} />
            <circle cx="98" cy="80" r="23" fill={`url(#body-grad-${bird.id})`} />
            <path
              d="M 78 98 Q 96 102, 114 98 Q 110 120, 78 120 Z"
              fill={`url(#chest-grad-${bird.id})`}
              opacity="0.9"
            />

            {/* Cute stubby wing */}
            <path
              d="M 94 114 Q 132 116, 126 138 Q 104 142, 94 114 Z"
              fill={`url(#wing-grad-${bird.id})`}
            />

            {/* Raptor scale patterns on chest simplified to cute mini arcs */}
            {!isSilhouette && (
              <g stroke="#ffffff" strokeWidth="1.6" opacity="0.3" fill="none" strokeLinecap="round">
                <path d="M 88 124 C 94 128, 100 128, 104 124" />
                <path d="M 85 132 C 93 136, 101 136, 108 132" />
              </g>
            )}
          </g>
        );
    }
  };

  // Render highly-tapered expressively dimensional bill/beaks
  const renderBeak = () => {
    const isOwl = bird.name.includes("鵂鶓");
    if (isOwl) return null; // Front-facing owl beak is already rendered on its face

    let startX = 76;
    let startY = 85;
    const isRaptor = bird.svgType === 'raptor';
    const isPheasant = bird.svgType === 'pheasant';
    
    if (isRaptor) {
      startX = 82;
      startY = 78;
    } else if (isPheasant) {
      startX = 81;
      startY = 72;
    }

    switch (bird.beakType) {
      case 'hooked':
        // Grand, formidable curved predator beak with standard yellow base (cere)
        return (
          <g id="beak-hooked">
            {/* Base skin cere link */}
            {!isSilhouette && (
              <path
                d={`M ${startX + 3} ${startY - 8} Q ${startX} ${startY}, ${startX + 4} ${startY + 6} Z`}
                fill="#facc15"
                opacity="0.9"
              />
            )}
            {/* Sharp hooked bill path */}
            <path
              d={`M ${startX} ${startY - 6} Q ${startX - 17} ${startY - 1}, ${startX - 15} ${startY + 15} Q ${startX - 5} ${startY + 7}, ${startX} ${startY + 4} Z`}
              fill={`url(#beak-grad-${bird.id})`}
            />
            {/* Mouth split line */}
            <path d={`M ${startX + 1} ${startY + 1} Q ${startX - 10} ${startY + 3}, ${startX - 14} ${startY + 8}`} fill="none" stroke="#1c1917" strokeWidth="1.2" opacity="0.32" />
          </g>
        );

      case 'needle':
        // Slender needle beak (Flamecrest, Erpornis, Kingfisher)
        return (
          <g id="beak-needle">
            <polygon
              points={`${startX},${startY - 3.2} ${startX - 18},${startY} ${startX},${startY + 2.5}`}
              fill={`url(#beak-grad-${bird.id})`}
            />
            <line x1={startX} y1={startY} x2={startX - 17} y2={startY} stroke="#1c1917" strokeWidth="1" opacity="0.25" />
          </g>
        );

      case 'stout':
        // Robust heavy-jawed bill (Barbet, Pheasants, Hwamei, White-whiskered laughingthrush)
        return (
          <g id="beak-stout">
            <path
              d={`M ${startX + 2} ${startY - 6.5} L ${startX - 16} ${startY} L ${startX + 1.2} ${startY + 5.5} Z`}
              fill={`url(#beak-grad-${bird.id})`}
            />
            {/* Bill divider split */}
            <line x1={startX + 1.5} y1={startY - 0.5} x2={startX - 15.5} y2={startY} stroke="#111827" strokeWidth="1.2" opacity="0.4" />
          </g>
        );

      case 'curved':
        // Smoothly curved down-arching bill (Nuthatch, Bullfinch)
        return (
          <g id="beak-curved">
            <path
              d={`M ${startX} ${startY - 4.5} Q ${startX - 12} ${startY - 4}, ${startX - 16} ${startY + 4} Q ${startX - 8} ${startY + 1}, ${startX} ${startY + 2} Z`}
              fill={`url(#beak-grad-${bird.id})`}
            />
            <path d={`M ${startX} ${startY - 1} Q ${startX - 9} ${startY - 0.5}, ${startX - 14} ${startY + 2}`} fill="none" stroke="#111827" strokeWidth="1" opacity="0.3" />
          </g>
        );

      case 'pointed':
      default:
        // Classical crisp songbird spear beak
        return (
          <g id="beak-pointed">
            <polygon
              points={`${startX},${startY - 4.2} ${startX - 14},${startY - 0.8} ${startX},${startY + 3.2}`}
              fill={`url(#beak-grad-${bird.id})`}
            />
            {/* Mouth separation */}
            <line x1={startX} y1={startY - 0.5} x2={startX - 13.5} y2={startY - 0.8} stroke="#111827" strokeWidth="1" opacity="0.32" />
          </g>
        );
    }
  };

  // Render eye and specialized eye ornamentation
  const renderEye = () => {
    const isOwl = bird.name.includes("鵂鶓");
    if (isOwl) return null; // already drew spectacular frontal eyes

    let cx = 90;
    let cy = 84;
    
    if (bird.svgType === 'raptor') {
      cx = 92;
      cy = 76;
    } else if (bird.svgType === 'pheasant') {
      cx = 88;
      cy = 68;
    } else if (bird.svgType === 'kingfisher') {
      cx = 86;
      cy = 82;
    }

    // Bare red cheek skin wattle (The legendary symbol of Mikado & Swinhoe Pheasants)
    const isPheasantType = bird.svgType === 'pheasant';
    const showRedWattle = isPheasantType && !isSilhouette;

    return (
      <g id="eye-assembly">
        {showRedWattle && (
          <g id="noble-pheasant-wattle">
            {/* Elegant double-lobed back-drawn scarlet skin patch */}
            <path
              d={`M ${cx - 9} ${cy} C ${cx - 9} ${cy - 10}, ${cx + 14} ${cy - 10}, ${cx + 16} ${cy + 4} C ${cx + 11} ${cy + 11}, ${cx - 6} ${cy + 11}, ${cx - 9} ${cy} Z`}
              fill="#dc2626"
            />
            <path
              d={`M ${cx - 4} ${cy + 3} C ${cx - 4} ${cy + 13}, ${cx + 7} ${cy + 13}, ${cx + 7} ${cy + 3} Z`}
              fill="#dc2626"
              opacity="0.95"
            />
            {/* Fine texture dot on bird wattle */}
            <circle cx={cx + 8} cy={cy + 3} r="1" fill="#ef4444" />
          </g>
        )}

        {/* Beautiful high-contrast eye rings */}
        {!isSilhouette && bird.id === 4 && (
          // Flamecrest white goggle ring
          <circle cx={cx} cy={cy} r="8" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
        )}

        {/* Outer kawaii black pupil eye */}
        <circle cx={cx} cy={cy} r="5.5" fill="#1c1917" />
        
        {/* Sparkling life reflection dots for Japanese illustration style */}
        {!isSilhouette && (
          <>
            <circle cx={cx - 1.5} cy={cy - 1.5} r="1.6" fill="#ffffff" />
            <circle cx={cx + 1.5} cy={cy + 1.5} r="0.8" fill="#ffffff" opacity="0.75" />
          </>
        )}
      </g>
    );
  };

  // Render cheek patterns, eye mask stripes, and white plumes
  const renderCheekOverlay = () => {
    if (isSilhouette) return null;

    let ecx = 90;
    let ecy = 84;
    
    if (bird.svgType === 'raptor') {
      ecx = 92;
      ecy = 76;
    } else if (bird.svgType === 'pheasant') {
      ecx = 88;
      ecy = 68;
    } else if (bird.svgType === 'kingfisher') {
      ecx = 86;
      ecy = 82;
    }

    const renderBlush = () => {
      return (
        <circle
          cx={ecx + 5}
          cy={ecy + 5}
          r="6.5"
          fill="#f43f5e"
          opacity="0.45"
          id="kawaii-blush-cheek"
        />
      );
    };

    // Special: White-eared Sibia (白耳畫眉 id 9) flowing ear ribbon
    if (bird.id === 9) {
      return (
        <g id="ear-ribbon-sibia" filter={`url(#plume-shadow-${bird.id})`}>
          {renderBlush()}
          {/* Stunning white silky feather ribbon sweeping gracefully back */}
          <path
            d="M 86 85 C 99 87, 114 81, 134 83 C 122 87, 102 88, 85 86 Z"
            fill="#f8fafc"
          />
          <path
            d="M 87 85.5 C 99 87.5, 114 82, 132 84.5"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
        </g>
      );
    }

    // Special: Gold-winged laughingthrush (金翼白眉 id 6) double white whiskers
    if (bird.id === 6) {
      return (
        <g id="sibia-mask">
          {renderBlush()}
          {/* Bold, thick white eyebrow */}
          <path
            d="M 80 72 Q 95 68, 115 76"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Bold whiskers mustache sweeping back */}
          <path
            d="M 82 86 Q 96 90, 112 88"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Special: Green-backed Tit (青背山雀 id 27) / Yellow Tit (黃山雀 id 13) large white cheek patch
    const isTit = bird.id === 13 || bird.id === 27;
    if (isTit) {
      return (
        <g id="tit-cheek">
          <ellipse
            cx={ecx + 5}
            cy={ecy + 9}
            rx="12"
            ry="8"
            fill="#f8fafc"
            transform={`rotate(-12, ${ecx + 5}, ${ecy + 9})`}
            id="tit-white-cheek"
          />
          {renderBlush()}
        </g>
      );
    }

    // Special: Collared Bush Robin (栗背林鴝 id 5) signature snowy white eyebrow
    if (bird.id === 5) {
      return (
        <g id="robin-spec-cheek">
          {renderBlush()}
          <path
            d="M 81 74 Q 92 71, 104 71"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            id="robin-eyebrow"
          />
        </g>
      );
    }

    // If generic cheek patch flag is true
    if (bird.hasCheekPatch) {
      return (
        <g id="generic-cheek">
          {renderBlush()}
          <path
            d={`M ${ecx + 3} ${ecy + 4} Q ${ecx + 12} ${ecy + 8}, ${ecx + 20} ${ecy + 5}`}
            fill="none"
            stroke={cheekPaint}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.95"
            id="casual-cheek"
          />
        </g>
      );
    }

    return renderBlush();
  };

  // Render glorious backward-swept crowns / crests (Flamecrest, Yuhina, Yellow Tit, etc.)
  const renderCrest = () => {
    if (!bird.hasCrest || isSilhouette) return null;

    let crestX = 98;
    let crestY = 72;
    if (bird.svgType === 'passerine') {
      crestX = 96;
      crestY = 74;
    }

    // 1. Special: Flamecrest (火冠戴菊 id 4) signature orange-on-yellow crown flame
    if (bird.id === 4) {
      return (
        <g id="crest-flamecrest">
          {/* Black enclosing crown borders */}
          <path d="M 90 77 Q 95 62, 114 62" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
          <path d="M 102 77 Q 106 63, 118 63" fill="none" stroke="#111827" strokeWidth="3.5" strokeLinecap="round" />
          
          {/* Outer glowing Canary Yellow crest deck */}
          <path
            d="M 94 76 Q 102 62, 115 62 Q 108 76, 94 76 Z"
            fill="#eab308"
          />
          {/* Inner dazzling Flame Orange center */}
          <path
            d="M 97 75 Q 101 64, 110 64 Q 105 75, 97 75 Z"
            fill="#ea580c"
          />
        </g>
      );
    }

    // 2. High-quality swept feathered crown (Yuhina, Yellow Tit, etc.)
    return (
      <g id="crest-crown">
        {/* Layer 1 back crest */}
        <path
          d={`M ${crestX - 4} ${crestY - 3} Q ${crestX + 2} ${crestY - 19}, ${crestX + 16} ${crestY - 9} Q ${crestX + 4} ${crestY + 2}, ${crestX - 4} ${crestY - 3} Z`}
          fill={`url(#crest-grad-${bird.id})`}
        />
        {/* Layer 2 feathered highlight lines */}
        <path
          d={`M ${crestX - 1} ${crestY - 2} Q ${crestX + 4} ${crestY - 14}, ${crestX + 11} ${crestY - 6}`}
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.8"
          opacity="0.5"
        />
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Wood textures gradient with rich dark core and lighter bark highlight stops */}
        <linearGradient id={`wood-grad-${bird.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="45%" stopColor="#854d0e" />
          <stop offset="100%" stopColor="#3f1a04" />
        </linearGradient>

        {/* River rock shiny wet gradient */}
        <linearGradient id={`rock-grad-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="25%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Fresh forest leaves gradients */}
        <linearGradient id={`leaf-grad-1-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id={`leaf-grad-2-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Dynamic bird shimmer color gradients */}
        <linearGradient id={`body-grad-${bird.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bodyPaint} />
          <stop offset="100%" stopColor={chestPaint} />
        </linearGradient>

        <linearGradient id={`chest-grad-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={chestPaint} />
          <stop offset="100%" stopColor={isSilhouette ? '#2b2722' : bodyPaint} />
        </linearGradient>

        <linearGradient id={`wing-grad-${bird.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={wingPaint} />
          <stop offset="70%" stopColor={accentPaint} />
          <stop offset="100%" stopColor={bodyPaint} />
        </linearGradient>

        <linearGradient id={`tail-grad-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={tailPaint} />
          <stop offset="100%" stopColor={isSilhouette ? '#1c1916' : (bird.id === 1 ? '#ffffff' : bodyPaint)} />
        </linearGradient>

        <linearGradient id={`accent-grad-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentPaint} />
          <stop offset="100%" stopColor={bodyPaint} />
        </linearGradient>

        <linearGradient id={`crest-grad-${bird.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={crestPaint} />
          <stop offset="100%" stopColor={bodyPaint} />
        </linearGradient>

        <linearGradient id={`beak-grad-${bird.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={beakPaint} />
          <stop offset="40%" stopColor={beakPaint} />
          <stop offset="100%" stopColor={isSilhouette ? '#403a33' : '#111827'} />
        </linearGradient>

        {/* Owl facial concentric rings gradient */}
        <radialGradient id={`owl-facial-disc-${bird.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="65%" stopColor="#fde68a" />
          <stop offset="85%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#451a03" />
        </radialGradient>

        {/* Backdrop Ambient Halo Glow */}
        <radialGradient id={`ambient-sun-grad-${bird.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isSilhouette ? '#fef08a' : (bird.accentColor + "40")} />
          <stop offset="60%" stopColor={isSilhouette ? '#fef08a' : (bird.accentColor + "15")} />
          <stop offset="100%" stopColor={isSilhouette ? '#eab308' : (bird.accentColor + "00")} />
        </radialGradient>

        <filter id={`plume-shadow-${bird.id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.5" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.15" />
        </filter>

        {/* Advanced Hand-Painted Colored-Pencil & Sketch Filter */}
        <filter id={`crayon-sketch-${bird.id}`} x="-20%" y="-20%" width="140%" height="140%">
          {/* A. Organic, delicate edge-wobbling mapping to simulate hand-sketched lines */}
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="edgeNoise" />
          <feDisplacementMap in="SourceGraphic" in2="edgeNoise" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="wobblyEdges" />

          {/* B. Extra-fine pencil paper tooth texture overlay */}
          <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="4" result="grainNoise" />
          
          {/* Convert grain to greyscale */}
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0
                                              0.33 0.33 0.33 0 0
                                              0.33 0.33 0.33 0 0
                                              0 0 0 1 0" in="grainNoise" result="greyGrain" />

          {/* Composite fine pencil pigment texture with the shaky hand-sketched edges */}
          <feComposite in="wobblyEdges" in2="greyGrain" operator="arithmetic" k1="0.25" k2="0.85" k3="0" k4="0" result="pencilTextured" />

          {/* C. Extract organic fine 2B carbon pencil outlines */}
          <feMorphology operator="dilate" radius="0.3" in="SourceGraphic" result="expanded" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.16
                                              0 0 0 0 0.13
                                              0 0 0 0 0.10
                                              0 0 0 0 0.45 0" in="expanded" result="sketchOutline" />
          <feDisplacementMap in="sketchOutline" in2="edgeNoise" scale="1.2" xChannelSelector="R" yChannelSelector="G" result="wobblyOutline" />

          {/* D. Merge soft fillings and fine outlines for authentic wood-pencil sketch look */}
          <feMerge result="finalArtwork">
            <feMergeNode in="wobblyOutline" />
            <feMergeNode in="pencilTextured" />
          </feMerge>

          {/* Apply a delicate paper shadow for physical realism */}
          <feDropShadow in="finalArtwork" dx="1.0" dy="2.5" stdDeviation="3.5" floodColor="#2F2314" floodOpacity="0.10" />
        </filter>
      </defs>

      {/* 1. Backdrop Glow Element - Left original/soft to represent ambient mountain mist */}
      {renderBackdrop()}

      {/* 2. Crayon Illustration Container wrapping environment context and the bird itself */}
      <g filter={`url(#crayon-sketch-${bird.id})`}>
        {/* Environmental Context (Mossy rocks, pine needles, or cherry blossoms) */}
        {renderEnvironment()}

        {/* Bird Structural Layers */}
        {customDrawingUrl && !isSilhouette ? (
          <image
            href={customDrawingUrl}
            xlinkHref={customDrawingUrl}
            x="0"
            y="0"
            width="240"
            height="240"
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <>
            {/* Layer 1: Tail feathers mapped first so they tuck behind body */}
            {renderTail()}

            {/* Layer 2: Climber claw feet */}
            {renderFeet()}

            {/* Layer 3: Solid volumetric body, head, and nested wings */}
            {renderBody()}

            {/* Layer 4: Majestic crest crowns & plumes */}
            {renderCrest()}

            {/* Layer 5: High-contrast facial stripes & custom makeups */}
            {renderCheekOverlay()}

            {/* Layer 6: Tapered sharp vector beaks/bills */}
            {renderBeak()}

            {/* Layer 7: Piercing lifelike eye assemblies */}
            {renderEye()}
          </>
        )}
      </g>
    </svg>
  );
};
