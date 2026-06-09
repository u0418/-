/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bird } from '../types';
import { playClickSound, playFocusConfirmSound } from '../sound';
import { 
  MapPin, 
  Lock, 
  Sparkles, 
  Eye, 
  Info, 
  Search,
  BookOpen
} from 'lucide-react';

interface TaiwanMapProps {
  birdsList: Bird[];
  activeBird: Bird;
  onSelectBird: (birdIndex: number) => void;
  observedList: number[];
  isMuted: boolean;
}

// Map coordinates for all 32 birds on a 200 x 320 SVG viewport
// Plotted carefully to match each bird's correct natural elevation belt and regional habitat
const BIRD_LOCATIONS: Record<number, { x: number; y: number; region: string; elevationType: 'low' | 'mid' | 'high'; traditionalName: string }> = {
  1: { x: 124, y: 52, region: "北部大屯山/陽明山混生闊葉林帶", elevationType: "low", traditionalName: "北境山娘" },
  2: { x: 98, y: 198, region: "中部阿里山/玉山深邃高山針葉林", elevationType: "high", traditionalName: "帝雉幽林" },
  3: { x: 86, y: 172, region: "中部大雪山中海拔潮濕次生林底層", elevationType: "mid", traditionalName: "白背鷴步" },
  4: { x: 104, y: 130, region: "合歡山冷杉與針葉高樹冠層頂梢", elevationType: "high", traditionalName: "戴菊杉梢" },
  5: { x: 92, y: 218, region: "高仙玉山塔塔加高原灌叢林緣", elevationType: "high", traditionalName: "林鴝橘領" },
  6: { x: 106, y: 152, region: "玉山及合歡群峰碎石坡與灌叢冷杉線", elevationType: "high", traditionalName: "噪眉金翼" },
  7: { x: 94, y: 168, region: "中海拔奧萬大楓林與針葉樹冠層", elevationType: "mid", traditionalName: "蓬冠嬉櫻" },
  8: { x: 78, y: 184, region: "中海拔溪頭杉林溪濕冷灌木底層", elevationType: "mid", traditionalName: "藪客黃痣" },
  9: { x: 86, y: 140, region: "鞍馬山中等海拔大林冠層上層", elevationType: "mid", traditionalName: "白耳晨囀" },
  10: { x: 62, y: 92, region: "西部低海拔平原、都會公園與林木幹身", elevationType: "low", traditionalName: "五色木鑿" },
  11: { x: 112, y: 142, region: "合歡山高海拔枯木與針葉灌木林", elevationType: "high", traditionalName: "朱雀霞羽" },
  12: { x: 55, y: 148, region: "八卦山與丘陵平地濃密低灌叢", elevationType: "low", traditionalName: "噪眉素袍" },
  13: { x: 122, y: 80, region: "宜蘭太平山原始闊葉大樹冠層", elevationType: "mid", traditionalName: "黃山冠羽" },
  14: { x: 115, y: 275, region: "花東縱谷向南至恆春半島東部海岸丘陵", elevationType: "low", traditionalName: "烏翁東襟" },
  15: { x: 98, y: 136, region: "清境與奇萊山周邊茂密箭竹林內", elevationType: "high", traditionalName: "強腳竹鶯" },
  16: { x: 110, y: 56, region: "北部烏來/坪林潮濕常綠闊葉林", elevationType: "low", traditionalName: "赤腹山精" },
  17: { x: 62, y: 132, region: "西部近山至竹林地表草生覆蓋處", elevationType: "low", traditionalName: "竹雞鬧野" },
  18: { x: 115, y: 64, region: "坪林/雙溪陰暗湍急山溪與巨石裂隙", elevationType: "low", traditionalName: "紫嘯煞聲" },
  19: { x: 90, y: 154, region: "南投惠蓀林場腐植質潮濕林地坡面", elevationType: "mid", traditionalName: "深山鷓鴣" },
  20: { x: 98, y: 38, region: "平野邊緣、觀音山/北投低山熱氣流盤旋空域", elevationType: "low", traditionalName: "蛇鷹嘯風" },
  21: { x: 102, y: 70, region: "桃園東眼山與插天山森林隱密中層", elevationType: "mid", traditionalName: "鵂鶓背目" },
  22: { x: 108, y: 64, region: "烏來內洞溪流湍流石塊與瀑布激水區", elevationType: "mid", traditionalName: "剪尾碧潭" },
  23: { x: 88, y: 126, region: "大雪山中高海拔松杉樹冠果莢帶", elevationType: "high", traditionalName: "褐鷽文雅" },
  24: { x: 82, y: 190, region: "南投杉林溪成熟落葉林冠層常綠帶", elevationType: "low", traditionalName: "山椒紅綠" }, // Lowland to Mid
  25: { x: 125, y: 72, region: "宜蘭平原、冬山河畔與農地乾淨池塘", elevationType: "low", traditionalName: "翠鳥魚獵" },
  26: { x: 94, y: 92, region: "雪霸觀霧巨大檜木與巨松老樹幹外皮", elevationType: "mid", traditionalName: "茶腹倒攀" },
  27: { x: 110, y: 100, region: "中海拔武陵農場開闊溪谷與櫻樹林梢", elevationType: "mid", traditionalName: "背青哨音" },
  28: { x: 74, y: 160, region: "溪頭/鞍馬山迎風森頂定點捕捕處", elevationType: "mid", traditionalName: "琉璃亮腹" },
  29: { x: 90, y: 115, region: "中高海拔霧林帶、冷杉鐵杉大樹下層", elevationType: "high", traditionalName: "白頭焦鶇" },
  30: { x: 76, y: 236, region: "南部藤枝與扇平保護林區常綠林頂", elevationType: "low", traditionalName: "綠羽蓬冠" },
  31: { x: 48, y: 178, region: "西部嘉近平原、荒原高雜草与休耕農田", elevationType: "low", traditionalName: " Hwamei草藪" },
  32: { x: 59, y: 188, region: "雲林林內/竹山竹木茂密溼氣谷底", elevationType: "low", traditionalName: "八色仙羽" }
};

export const TaiwanMap: React.FC<TaiwanMapProps> = ({
  birdsList,
  activeBird,
  onSelectBird,
  observedList,
  isMuted
}) => {
  const [hoveredLocation, setHoveredLocation] = useState<{ id: number; name: string; region: string; elevation: string; color: string; traditionalName: string; isObserved: boolean } | null>(null);

  const activeLoc = BIRD_LOCATIONS[activeBird.id];

  const handleSelectIcon = (birdId: number) => {
    // Find index of this bird
    const birdIdx = birdsList.findIndex(b => b.id === birdId);
    if (birdIdx !== -1) {
      if (!isMuted) playFocusConfirmSound();
      onSelectBird(birdIdx);
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* MAP CONTROLLER PANEL TITLE */}
      <div className="flex items-center justify-between border-b border-[#ECE2D0] pb-2 mb-3 px-1">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-xs font-black font-serif text-[#4A3C31] tracking-wide">
            福爾摩沙生態分佈地圖
          </h4>
          <span className="text-[10px] text-stone-400 font-sans block leading-none font-medium">
            Formosa Biodiversity Distribution Map
          </span>
        </div>
        <span className="text-[8px] font-mono font-bold bg-[#E8DEC9] text-[#706050] px-2 py-0.5 rounded shadow-inner flex-shrink-0">
          GRID 121°E
        </span>
      </div>

      <div className="text-[10px] text-stone-500 font-serif leading-relaxed mb-3.5 px-1 bg-stone-50 p-2 rounded border border-stone-200/60 shadow-sm">
        地圖與生態手札同步：已解鎖的特有種依海拔呈現<strong>彩色圖例</strong>，未紀錄的特有種則呈<strong>棕色</strong>。
        <span className="block text-[8.5px] text-stone-400 font-sans mt-1">Bird Guide and Field Journal Synchronization: Endemic species that have been discovered are displayed in color according to their elevation range, while undiscovered species remain shown in brown.</span>
      </div>

      {/* CORE INTERACTIVE MAP STAGE */}
      <div className="relative bg-[#FAF6EE] sketch-border-md flex-1 flex items-center justify-center p-3.5 overflow-visible min-h-[360px]">
        {/* VINTAGE SEA WATER PATTERN WATERMARKS */}
        <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none" style={{ backgroundImage: 'radial-gradient(#452A10 1px, transparent 0px)', backgroundSize: '16px 16px' }} />
        
        {/* VINTAGE LABELS FOR OCEANS */}
        <div className="absolute left-3 top-1/4 -rotate-90 select-none text-[8.5px] uppercase tracking-[7px] font-mono text-[#8C765C]/35 font-bold pointer-events-none">
          Taiwan Strait
        </div>
        <div className="absolute right-2 top-2/3 rotate-90 select-none text-[8.5px] uppercase tracking-[7px] font-mono text-[#8C765C]/35 font-bold pointer-events-none">
          Pacific Ocean
        </div>
        <div className="absolute left-1/3 bottom-5 select-none text-[8px] font-serif text-[#8C765C]/25 text-center pointer-events-none italic leading-tight">
          Est. 1926 Natural History Ledger<br />Map of Endemics
        </div>

        {/* TRADITIONAL COMPASS ROSE / WINDROSE INSIGNIA */}
        <div className="absolute top-4 left-4 w-12 h-12 opacity-[0.25] pointer-events-none select-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#5C4223]">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.75" />
            
            {/* North Indicator */}
            <path d="M 50 10 L 55 45 L 50 50 Z" fill="currentColor" />
            <path d="M 50 10 L 45 45 L 50 50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <text x="50" y="8" textAnchor="middle" fontSize="12" fontWeight="bold" fontFamily="serif" fill="currentColor">N</text>
            
            {/* South Indicator */}
            <path d="M 50 90 L 45 55 L 50 50 Z" fill="currentColor" />
            <path d="M 50 90 L 55 55 L 50 50 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <text x="50" y="99" textAnchor="middle" fontSize="10" fontFamily="serif" fill="currentColor">S</text>

            <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="0.5" />
            <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        {/* MAP STAGE CANVAS */}
        <div className="w-full max-w-[260px] h-full flex items-center justify-center relative">
          <svg 
            viewBox="0 0 200 320" 
            className="w-full h-auto max-h-[330px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* VINTAGE CARTOGRAPHIC COORDINATES LATITUDE LINES */}
            <line x1="5" y1="75" x2="195" y2="75" stroke="#8C765C" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.25" />
            <text x="7" y="72" fontSize="6.5" fontFamily="monospace" fill="#8C765C" opacity="0.4">24.5°N</text>

            <line x1="5" y1="210" x2="195" y2="210" stroke="#8C765C" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.25" />
            <text x="7" y="207" fontSize="6.5" fontFamily="monospace" fill="#8C765C" opacity="0.4">23.0°N</text>

            {/* MERIDIAN 121°E LONGITUDE */}
            <line x1="100" y1="10" x2="100" y2="310" stroke="#8C765C" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.25" />
            <text x="103" y="16" fontSize="6.5" fontFamily="monospace" fill="#8C765C" opacity="0.4" textAnchor="start">121°E</text>

            {/* TROPIC OF CANCER (北回歸線) DASHED ACCENT */}
            <line x1="5" y1="175" x2="195" y2="175" stroke="#A94442" strokeWidth="0.75" strokeDasharray="6 3 2 3" opacity="0.5" />
            <text x="195" y="172" fontSize="6.5" fontFamily="serif" fontStyle="italic" fill="#9E2A2B" opacity="0.75" textAnchor="end">
              北回歸線  Tropic of Cancer (23.5°N) ───
            </text>

            {/* MAIN GEOGRAPHIC SHAPE: SHADOW LAYER */}
            <path
              d="M 121 14 
                 C 123 13, 126 12, 128 14 
                 C 131 13, 134 15, 137 18 
                 C 138 20, 139 23, 137 26 
                 C 134 30, 131 34, 128 38 
                 C 126 41, 125 44, 125 47 
                 C 125 49, 127 51, 130 53 
                 C 132 55, 135 58, 136 62 
                 C 136 65, 134 69, 135 73 
                 C 136 77, 137 81, 137 85 
                 C 138 89, 138 94, 137 99 
                 C 137 104, 138 109, 138 114 
                 C 137 119, 136 124, 135 129 
                 C 135 134, 134 139, 133 144 
                 C 133 149, 132 154, 131 159 
                 C 131 164, 129 169, 128 174 
                 C 127 179, 126 184, 125 189 
                 C 124 194, 123 199, 122 204 
                 C 120 209, 118 214, 116 219 
                 C 115 224, 113 229, 111 234 
                 C 110 239, 108 244, 106 249 
                 C 105 254, 103 259, 101 264 
                 C 100 269, 101 274, 102 279 
                 C 103 284, 104 289, 105 294 
                 C 106 297, 107 301, 107 302 
                 C 106 303, 103 302, 101 299 
                 C 100 297, 98 297, 97 299 
                 C 96 301, 95 304, 94 306 
                 C 93 305, 91 301, 89 297 
                 C 87 293, 85 289, 83 284 
                 C 82 279, 81 273, 80 267 
                 C 79 261, 77 255, 75 249 
                 C 73 243, 71 236, 68 229 
                 C 65 222, 61 215, 57 208 
                 C 53 201, 49 194, 46 187 
                 C 43 180, 41 173, 41 166 
                 C 41 159, 43 152, 45 145 
                 C 47 138, 50 131, 53 124 
                 C 56 117, 60 110, 63 103 
                 C 66 96, 69 90, 72 84 
                 C 75 78, 78 72, 82 66 
                 C 86 60, 90 54, 94 48 
                 C 98 42, 102 36, 106 30 
                 C 110 24, 114 18, 119 15 
                 C 120 14, 121 14, 121 14 Z"
              fill="#D6CBB8"
              opacity="0.3"
              transform="translate(2, 3)"
            />

            {/* MAIN GEOGRAPHIC TAIWAN SILHOUETTE */}
            <path
              d="M 121 14 
                 C 123 13, 126 12, 128 14 
                 C 131 13, 134 15, 137 18 
                 C 138 20, 139 23, 137 26 
                 C 134 30, 131 34, 128 38 
                 C 126 41, 125 44, 125 47 
                 C 125 49, 127 51, 130 53 
                 C 132 55, 135 58, 136 62 
                 C 136 65, 134 69, 135 73 
                 C 136 77, 137 81, 137 85 
                 C 138 89, 138 94, 137 99 
                 C 137 104, 138 109, 138 114 
                 C 137 119, 136 124, 135 129 
                 C 135 134, 134 139, 133 144 
                 C 133 149, 132 154, 131 159 
                 C 131 164, 129 169, 128 174 
                 C 127 179, 126 184, 125 189 
                 C 124 194, 123 199, 122 204 
                 C 120 209, 118 214, 116 219 
                 C 115 224, 113 229, 111 234 
                 C 110 239, 108 244, 106 249 
                 C 105 254, 103 259, 101 264 
                 C 100 269, 101 274, 102 279 
                 C 103 284, 104 289, 105 294 
                 C 106 297, 107 301, 107 302 
                 C 106 303, 103 302, 101 299 
                 C 100 297, 98 297, 97 299 
                 C 96 301, 95 304, 94 306 
                 C 93 305, 91 301, 89 297 
                 C 87 293, 85 289, 83 284 
                 C 82 279, 81 273, 80 267 
                 C 79 261, 77 255, 75 249 
                 C 73 243, 71 236, 68 229 
                 C 65 222, 61 215, 57 208 
                 C 53 201, 49 194, 46 187 
                 C 43 180, 41 173, 41 166 
                 C 41 159, 43 152, 45 145 
                 C 47 138, 50 131, 53 124 
                 C 56 117, 60 110, 63 103 
                 C 66 96, 69 90, 72 84 
                 C 75 78, 78 72, 82 66 
                 C 86 60, 90 54, 94 48 
                 C 98 42, 102 36, 106 30 
                 C 110 24, 114 18, 119 15 
                 C 120 14, 121 14, 121 14 Z"
              fill="#EFE7D5"
              stroke="#8C765C"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* SYUESHAN & CENTRAL MOUNTAIN RANGE GEOMORPHIC HIGHLIGHTS (Beautiful jagged line patches) */}
            <g opacity="0.32" stroke="#8C765C" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Syueshan (NW Mountains) */}
              <path d="M 88 78 L 94 72 L 98 82 L 104 74 L 110 84" />
              <path d="M 82 92 L 88 84 L 94 95" />
              {/* Central Range Backbone */}
              <path d="M 102 110 L 108 102 L 112 114 L 118 106 L 122 120" />
              <path d="M 95 132 L 102 122 L 106 138 L 112 128 L 118 142" />
              {/* Alishan & Yushan Range */}
              <path d="M 88 152 L 94 142 L 100 158 L 104 148 L 110 164" />
              <path d="M 84 178 L 91 166 L 96 182" />
              <path d="M 82 198 L 88 186 L 94 202 L 100 190 L 104 204 L 108 194" />
              {/* Southern Spine */}
              <path d="M 78 222 L 85 210 L 92 228 L 98 214 L 102 230" />
              <path d="M 80 248 L 85 238 L 90 252 L 94 242" />
            </g>

            {/* TEXT ON GEOGRAPHY */}
            <text x="110" y="116" fontSize="6" fontFamily="serif" fontWeight="bold" fill="#755E49" opacity="0.9" textAnchor="middle" letterSpacing="1">中央山脈</text>
            <text x="86" y="68" fontSize="5" fontFamily="serif" fill="#755E49" opacity="0.75" textAnchor="middle">雪山山脈</text>
            <text x="82" y="212" fontSize="5.5" fontFamily="serif" fill="#755E49" opacity="0.9" textAnchor="middle" fontWeight="bold">玉山山脈</text>

            {/* ACTIVE BIRD HIGHLIGHT PULSING RING */}
            {activeLoc && (
              <g>
                <circle 
                  cx={activeLoc.x} 
                  cy={activeLoc.y} 
                  r="14" 
                  fill="none" 
                  stroke={activeBird.accentColor} 
                  strokeWidth="1.25" 
                  strokeDasharray="2 3"
                  className="animate-spin"
                  style={{ animationDuration: '10s', transformOrigin: `${activeLoc.x}px ${activeLoc.y}px` }}
                />
                <circle 
                  cx={activeLoc.x} 
                  cy={activeLoc.y} 
                  r="7.5"
                  fill="none"
                  stroke={activeBird.accentColor}
                  className="animate-ping"
                  style={{ animationDuration: '2.5s', transformOrigin: `${activeLoc.x}px ${activeLoc.y}px` }}
                />
              </g>
            )}

            {/* PINS FOR ALL 32 BIRDS */}
            {birdsList.map((bird, index) => {
              const loc = BIRD_LOCATIONS[bird.id];
              if (!loc) return null;
              
              const isObserved = observedList.includes(bird.id);
              const isActive = activeBird.id === bird.id;
              
              // Colors based on elevation belt
              let pinBg = "#BF4040"; // high: ruby crimson
              if (loc.elevationType === 'mid') pinBg = "#D97706"; // mid: golden amber
              if (loc.elevationType === 'low') pinBg = "#15803D"; // low: forest emerald

              return (
                <g 
                  key={bird.id}
                  className="cursor-pointer group"
                  onClick={() => handleSelectIcon(bird.id)}
                  onMouseEnter={() => setHoveredLocation({
                    id: bird.id,
                    name: bird.name,
                    region: loc.region,
                    elevation: bird.elevation,
                    color: pinBg,
                    traditionalName: loc.traditionalName,
                    isObserved
                  })}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  {/* Outer safety hover trigger circle */}
                  <circle 
                    cx={loc.x} 
                    cy={loc.y} 
                    r="8" 
                    fill="transparent" 
                  />

                  {isObserved ? (
                    /* OBSERVED BIRD: GLOWING COLORED PIN */
                    <g>
                      {/* Active bigger pin */}
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={isActive ? "5.5" : "3.5"}
                        fill={isActive ? bird.accentColor : pinBg}
                        stroke="#FAF6EE"
                        strokeWidth="1"
                        className="transition-all duration-300 group-hover:scale-125"
                        style={{ transformOrigin: `${loc.x}px ${loc.y}px` }}
                      />
                      {/* Tiny inner center eye dot */}
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={isActive ? "2" : "1.2"}
                        fill="#FAF6EE"
                      />
                    </g>
                  ) : (
                    /* UNOBSERVED BIRD: TRADITIONAL VINTAGE UNLOCK-LOCK SYMBOL */
                    <g opacity={isActive ? "1" : "0.55"} className="transition-opacity group-hover:opacity-100">
                      {/* Faded anchor spot */}
                      <circle
                        cx={loc.x}
                        cy={loc.y}
                        r={isActive ? "4.5" : "3"}
                        fill="#8A7663"
                        stroke="#BDAC99"
                        strokeWidth="0.75"
                        className="transition-all duration-300"
                      />
                      {/* Central slot line to look like a small clock or lock core */}
                      <line 
                        x1={loc.x} 
                        y1={loc.y - 1.5} 
                        x2={loc.x} 
                        y2={loc.y + 1.5} 
                        stroke="#FAF6EE" 
                        strokeWidth="0.75" 
                      />
                    </g>
                  )}
                </g>
              );
            })}

            {/* The active bird card has been migrated below to draw as a beautifully rendered, responsive HTML element on top of the SVG map canvas, completely avoiding any crop or cut off issues. */}
          </svg>

          {/* DYNAMIC INTEGRATED FLOATING CARD FOR ACTIVE REGISTERED SPECIES */}
          {activeLoc && (
            <div 
              className="absolute z-30 bg-[#FFFDF9] border border-[#BF7356] p-2.5 rounded-xl text-left shadow-[4px_4px_0px_rgba(191,115,86,0.18)] text-[10px] w-36 font-serif leading-relaxed select-none border-double animate-in fade-in duration-200"
              style={{ 
                left: `${(activeLoc.x / 200) * 100}%`,
                top: `${(activeLoc.y / 320) * 100}%`,
                transform: (() => {
                  // Horizontal dynamic offset: shifts left or right based on viewport region coordinates
                  const xTranslation = activeLoc.x > 100 ? '-108%' : '8%';
                  // Vertical shift: prevents cropping near high/low edges
                  let yTranslation = '-50%';
                  if (activeLoc.y < 85) {
                    yTranslation = '-15%';
                  } else if (activeLoc.y > 240) {
                    yTranslation = '-85%';
                  }
                  return `translate(${xTranslation}, ${yTranslation})`;
                })()
              }}
            >
              <div className="absolute top-1 left-1 bottom-1 w-[1px] bg-amber-800/10" />
              <div className="absolute top-1 right-1 bottom-1 w-[1px] bg-amber-800/10" />

              <div className="flex items-center justify-between border-b border-stone-200/60 pb-1 mb-1.5 px-0.5">
                <span className="font-extrabold text-[#3D2C1F] text-[10.5px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: activeBird.accentColor }} />
                  {activeBird.name}
                </span>
                <span className="text-[7.5px] font-mono bg-amber-50 text-amber-800 font-bold px-1 py-0.2 rounded border border-amber-200/60 max-h-[14px] flex items-center">
                  {activeLoc.traditionalName}
                </span>
              </div>

              <div className="text-[9px] text-stone-600 space-y-1 px-0.5 leading-snug">
                <div>
                  <strong className="text-[#8C765C]">學名：</strong>
                  <span className="font-sans italic text-stone-500 font-medium">{activeBird.scientificName}</span>
                </div>
                <div>
                  <strong className="text-[#8C765C]">海拔：</strong>
                  <span className="font-mono text-stone-700 font-medium">{activeBird.elevation}</span>
                </div>
                <div>
                  <strong className="text-[#8C765C]">棲地：</strong>
                  <span className="text-stone-700 font-medium">{activeBird.habitat}</span>
                </div>
              </div>

              <div className="mt-1.5 pt-1 border-t border-dotted border-stone-200 flex items-center justify-between px-0.5">
                <span className="text-[8px] text-stone-400 font-mono">No. {activeBird.id.toString().padStart(2, '0')}</span>
                {observedList.includes(activeBird.id) ? (
                  <span className="text-[8.5px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-emerald-600 rounded-full inline-block" />
                    已觀測
                  </span>
                ) : (
                  <span className="text-[8.5px] text-amber-800 font-bold flex items-center gap-0.5">
                    <span className="w-1 h-1 bg-stone-400 rounded-full inline-block" />
                    尚未記錄
                  </span>
                )}
              </div>
            </div>
          )}

          {/* DYNAMIC INTEGRATED FLOATING TOOLTIP FOR HOVER STATE */}
          {hoveredLocation && (
            <div 
              className="absolute z-40 pointer-events-none bg-[#FDFBF7] border-2 border-[#D3C7AC] p-2.5 rounded-xl text-left shadow-lg text-[10px] w-48 font-serif leading-tight border-double"
              style={{ 
                left: `${(hoveredLocation.id ? (BIRD_LOCATIONS[hoveredLocation.id]?.x || 100) / 200 : 0.5) * 100}%`,
                top: `${(hoveredLocation.id ? (BIRD_LOCATIONS[hoveredLocation.id]?.y || 160) / 320 : 0.5) * 100}%`,
                transform: (() => {
                  if (!hoveredLocation.id) return 'translate(-50%, -105%)';
                  const loc = BIRD_LOCATIONS[hoveredLocation.id];
                  if (!loc) return 'translate(-50%, -105%)';
                  
                  const isTooCloseToTop = loc.y < 85;
                  // Dynamic edge padding: shifts left or right so the 12rem (192px) width tooltip never goes past boundaries
                  const xTranslation = loc.x < 65 ? '-15%' : loc.x > 135 ? '-85%' : '-50%';
                  const yTranslation = isTooCloseToTop ? '12px' : '-105%';
                  return `translate(${xTranslation}, ${yTranslation})`;
                })()
              }}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-1 mb-1.5">
                <span className="font-extrabold text-[#352513] text-[10.5px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoveredLocation.color }} />
                  {hoveredLocation.name}
                </span>
                <span className="text-[7.5px] font-mono uppercase tracking-wider bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded border border-stone-200">
                  {hoveredLocation.traditionalName}
                </span>
              </div>
              <p className="text-[9.2px] text-stone-600 mb-1 leading-relaxed">
                <strong className="text-[#8C7B65]">分佈棲地 (Habitat)：</strong>{hoveredLocation.region}
              </p>
              <div className="flex items-center justify-between text-[8.5px] text-stone-400 mt-1 pt-1 border-t border-dotted border-stone-200/80 font-mono">
                <span>海拔 (Alt): {hoveredLocation.elevation}</span>
                {hoveredLocation.isObserved ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">已觀測 (Observed)</span>
                ) : (
                  <span className="text-stone-400 font-bold flex items-center gap-0.5 font-sans">未採集 (Locked)</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER LEGEND WITH ALTITUDE MAP */}
      <div className="mt-3 bg-[#FAF7F0] sketch-border-sm p-2.5 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center text-[9px] text-[#705F4E] font-serif">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-[#8C765C] flex items-center gap-1 border-r border-[#ECE2D0] pr-2 flex-shrink-0">
            地圖圖例 (Legend)：
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] inline-block border border-stone-100 shadow-sm" />
            <span>低海拔平原山野 (Lowlands 0-1000m)</span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] inline-block border border-stone-100 shadow-sm" />
            <span>中海拔針葉/闊葉林 (Midlands 1000-2000m)</span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BF4040] inline-block border border-stone-100 shadow-sm" />
            <span>高海拔冷杉針山 (Highlands 2000m+)</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[8.5px] text-stone-400 font-mono flex-shrink-0">
          <span>點選徽記可於手札內鎖定切換觀察 (Click badge to inspect)</span>
        </div>
      </div>
    </div>
  );
};
