/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, ChangeEvent } from 'react';
import { birdsList } from './birdsData';
import { Bird } from './types';
import { BirdSvg } from './BirdSvg';
import { BirdSketchpad } from './components/BirdSketchpad';
import { TaiwanMap } from './components/TaiwanMap';
import marigoldMaplesBgm from './marigold-maples.mp3';
import { playShutterSound, playFocusConfirmSound, playClickSound, playBirdSound, startBgm, stopBgm, setCustomBgmUrl, getCustomBgmUrl } from './sound';
import { BIRD_TRANSLATIONS_EN } from './birdsTranslationsEn';
import { 
  Camera, 
  Binoculars, 
  Eye, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Compass, 
  ArrowLeft, 
  ArrowRight,
  MapPin,
  Flame,
  Search,
  BookOpen,
  Music,
  Upload,
  Info,
  X,
  Sliders,
  Palette,
  Pencil,
  Lightbulb,
  Check,
  AlertTriangle,
  Award,
  Trophy,
  Heart,
  ExternalLink
} from 'lucide-react';

const PHONETIC_MAP: Record<string, string> = {
  '鷴': 'ㄒㄧㄢˊ',
  '鴝': 'ㄑㄩˊ',
  '藪': 'ㄙㄡˇ',
  '鶇': 'ㄉㄨㄥ',
  '鷓': 'ㄓㄜˋ',
  '鴣': 'ㄍㄨ',
  '鷲': 'ㄐㄧㄡˋ',
  '鵂': 'ㄒㄧㄡ',
  '鶓': 'ㄇㄧㄠˊ',
  '鶹': 'ㄌㄧㄡˊ',
  '鴞': 'ㄒㄧㄠ',
  '鷽': 'ㄒㄩㄝˊ',
  '鳾': 'ㄕ',
  '雉': 'ㄓˋ',
};

function renderAnnotatedName(name: string) {
  // Parse for parentheses (supports both half-width and full-width brackets)
  const regex = /^([^\(（]+)(?:[\(（](.+?)[\)）])?$/;
  const match = name.match(regex);
  const main = match ? match[1].trim() : name;
  const sub = match && match[2] ? match[2].trim() : null;

  const renderSingleWord = (word: string) => {
    return Array.from(word).map((char, index) => {
      const phonetic = PHONETIC_MAP[char];
      if (phonetic) {
        return (
          <span className="inline-block relative mr-[10px] align-middle" key={index}>
            <span className="font-bold">{char}</span>
            <span 
              className="absolute text-[10px] font-sans font-black text-red-800/90 select-none leading-[0.9] whitespace-nowrap overflow-visible"
              style={{
                left: '100%',
                top: '50%',
                transform: 'translate(1px, -50%) scale(0.6)',
                transformOrigin: 'left center',
                writingMode: 'vertical-rl',
                textOrientation: 'upright',
                letterSpacing: '-2px',
              }}
            >
              {phonetic}
            </span>
          </span>
        );
      }
      return <span key={index} className="font-bold align-middle">{char}</span>;
    });
  };

  return (
    <span className="inline-flex flex-col items-center justify-center leading-tight">
      <span className="inline-flex items-center flex-wrap justify-center gap-x-0.5">
        {renderSingleWord(main)}
      </span>
      {sub && (
        <span className="text-[10.5px] text-stone-500 font-bold mt-1.5 inline-flex items-center flex-wrap justify-center gap-x-0.5 whitespace-nowrap leading-none">
          <span className="opacity-70 align-middle font-sans">(</span>
          {renderSingleWord(sub)}
          <span className="opacity-70 align-middle font-sans">)</span>
        </span>
      )}
    </span>
  );
}

export default function App() {
  // 1. Core States
  const [activeBirdIndex, setActiveBirdIndex] = useState<number>(0);
  const [focusSliderValue, setFocusSliderValue] = useState<number>(85); // 0 = perfect focus, 100 = completely blurred
  const [observedList, setObservedList] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [isFocusLocked, setIsFocusLocked] = useState<boolean>(false);
  const [userHasInteracted, setUserHasInteracted] = useState<boolean>(false);
  const [showHomepage, setShowHomepage] = useState<boolean>(true);
  const [leftPanelMode, setLeftPanelMode] = useState<'viewfinder' | 'map'>('viewfinder');
  
  // Custom Artist Drawing States
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [customDrawings, setCustomDrawings] = useState<Record<number, string | null>>({});
  
  // Custom BGM State
  const [customBgmName, setCustomBgmName] = useState<string | null>(null);
  
  // UI helper filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'observed' | 'unobserved'>('all');

  // Particle spikes for successful photo rewards
  const [successParticles, setSuccessParticles] = useState<{ id: number; x: number; y: number; s: number; color: string }[]>([]);

  // Reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetDrawingConfirmBirdId, setResetDrawingConfirmBirdId] = useState<number | null>(null);
  
  // Completion screen state
  const [showCompletionPage, setShowCompletionPage] = useState<boolean>(false);

  // DOM Refs
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrollingByCode = useRef<boolean>(false);
  const lastTickValue = useRef<number>(85);
  const dialRef = useRef<HTMLDivElement>(null);

  // Mouse Drag to Scroll controllers for bottom carousel
  const isMouseDownRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const list = carouselRef.current;
    if (!list) return;
    isMouseDownRef.current = true;
    startXRef.current = e.pageX - list.offsetLeft;
    scrollLeftRef.current = list.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    const list = carouselRef.current;
    if (!list) return;
    e.preventDefault();
    const x = e.pageX - list.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    list.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    isMouseDownRef.current = false;
  }, []);

  // 1b. Filtered Birds List Memoized
  const filteredBirds = useMemo(() => {
    return birdsList.filter(bird => {
      const matchesSearch = 
        bird.name.includes(searchQuery) || 
        bird.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bird.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        bird.elevation.includes(searchQuery);

      const isObs = observedList.includes(bird.id);
      if (filterMode === 'observed') return matchesSearch && isObs;
      if (filterMode === 'unobserved') return matchesSearch && !isObs;
      return matchesSearch;
    });
  }, [searchQuery, filterMode, observedList]);

  const activeBird = birdsList[activeBirdIndex];
  const isCurrentlyObserved = observedList.includes(activeBird.id);

  // 2. Hydrate observed birds from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('taiwan_birds_observed_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        setObservedList(parsed);
        if (parsed.length > 0 && parsed.length === birdsList.length) {
          // If already fully collected previously, configure flag but don't force instantly, allowing explorer mode
        }
      }
      const savedDrawings = localStorage.getItem('taiwan_birds_custom_drawings');
      if (savedDrawings) {
        setCustomDrawings(JSON.parse(savedDrawings));
      }
    } catch (e) {
      console.warn("Failed to read observed list from state", e);
    }
  }, []);

  // 2b & 3. Dynamically configure and play background music tracks
  useEffect(() => {
    if (showHomepage) {
      setCustomBgmUrl(null);
      setCustomBgmName('野林風鈴 (Procedural Wind-Chimes)');
    } else {
      setCustomBgmUrl(marigoldMaplesBgm);
      setCustomBgmName('森林主題曲：marigold-maples.mp3');
    }

    // Gracefully cycle sound engine on track transitions
    if (!isMuted && (userHasInteracted || !showHomepage)) {
      stopBgm();
      const delayTimer = setTimeout(() => {
        startBgm();
      }, 300);
      return () => clearTimeout(delayTimer);
    } else {
      stopBgm();
    }
  }, [showHomepage, isMuted, userHasInteracted]);

  // Save to localStorage when updated
  const saveObservedList = (newList: number[]) => {
    setObservedList(newList);
    try {
      localStorage.setItem('taiwan_birds_observed_list', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }

    // Auto-trigger completion page transition when all species are observed
    if (newList.length === birdsList.length && newList.length > 0) {
      setTimeout(() => {
        setIsFlashActive(true);
        setTimeout(() => {
          setIsFlashActive(false);
          setShowCompletionPage(true);
        }, 300);
      }, 2200); // Pause so they enjoy the snapshot flash and success particle burst first!
    }
  };

  const saveDrawing = (birdId: number, dataUrl: string | null) => {
    const nextDrawings = { ...customDrawings, [birdId]: dataUrl };
    setCustomDrawings(nextDrawings);
    try {
      localStorage.setItem('taiwan_birds_custom_drawings', JSON.stringify(nextDrawings));
    } catch (e) {
      console.error(e);
    }
  };

  // Determine current focus parameters
  const blurAmount = (focusSliderValue / 100) * 20; // max 20px blur
  const saturationPercentage = Math.max(15, 100 - focusSliderValue * 0.8);
  const grayscalePercentage = focusSliderValue / 100;

  // Sound triggering safely checked with muted state
  const triggerShutterSound = () => {
    if (!isMuted) playShutterSound();
  };

  const triggerFocusConfirmSound = () => {
    if (!isMuted) playFocusConfirmSound();
  };

  const triggerClickSound = () => {
    if (!isMuted) playClickSound();
  };

  // Handle focus slider slide ticks
  const handleFocusSliderChange = (val: number) => {
    setFocusSliderValue(val);
    setUserHasInteracted(true);
    
    // Play a subtle mechanical notch click sound for tactile feedback as they dial
    if (Math.abs(val - lastTickValue.current) >= 8) {
      triggerClickSound();
      lastTickValue.current = val;
    }

    // Lock focus when perfectly dialed to zero
    if (val === 0 && !isFocusLocked) {
      setIsFocusLocked(true);
      triggerFocusConfirmSound();
    } else if (val > 0 && isFocusLocked) {
      setIsFocusLocked(false);
    }
  };

  // Tactile dial knob rotary dragging engine
  const handleDialPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!dialRef.current) return;
    setUserHasInteracted(true);

    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const getAngle = (clientX: number, clientY: number) => {
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI); // Range: -180 to 180 degrees
      if (angle < 0) angle += 360;
      return angle;
    };

    const startAngle = getAngle(e.clientX, e.clientY);
    const startValue = focusSliderValue;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentAngle = getAngle(moveEvent.clientX, moveEvent.clientY);
      let angleDiff = currentAngle - startAngle;

      // Handle crossing boundaries of 0/360
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // Sensitivity mapping: Adjust the scale factor to make rotating dial comfortable
      const sensitivity = 0.55;
      let newValue = startValue + angleDiff * sensitivity;
      newValue = Math.max(0, Math.min(100, newValue));

      handleFocusSliderChange(Math.round(newValue));
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // 3. Shutter Snapshot Trigger
  const handleCaptureSnapshot = () => {
    setUserHasInteracted(true);
    triggerShutterSound();
    
    // 0.35s instant screen flash overlay
    setIsFlashActive(true);
    setTimeout(() => {
      setIsFlashActive(false);
    }, 350);

    // Forces focus slider to perfect focus (0) and lock it
    setFocusSliderValue(0);
    setIsFocusLocked(true);

    if (!isCurrentlyObserved) {
      const updatedList = [...observedList, activeBird.id];
      saveObservedList(updatedList);

      // Generate colorful vector burst particles
      const burstColors = [activeBird.accentColor, activeBird.bodyColor, activeBird.chestColor, '#eab308', '#dc2626'];
      const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: Math.random() + i,
        x: 40 + Math.random() * 160,
        y: 40 + Math.random() * 120,
        s: 4 + Math.random() * 10,
        color: burstColors[i % burstColors.length]
      }));
      setSuccessParticles(particles);
      setTimeout(() => {
        setSuccessParticles([]);
      }, 2000);
    }
  };

  // Handle user's local custom background music file
  const handleCustomBgmUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerClickSound();
      setUserHasInteracted(true);
      const url = URL.createObjectURL(file);
      setCustomBgmUrl(url);
      setCustomBgmName(file.name);
      
      // Instantly start/restart playback
      if (!isMuted) {
        stopBgm();
        setTimeout(() => {
          startBgm();
        }, 150);
      }
    }
  };

  // Reset core progress game
  const handleResetProgress = () => {
    triggerClickSound();
    setShowResetConfirm(true);
  };

  const executeResetProgress = () => {
    saveObservedList([]);
    setCustomDrawings({});
    try {
      localStorage.removeItem('taiwan_birds_custom_drawings');
    } catch (e) {}
    setFocusSliderValue(85);
    setIsFocusLocked(false);
    setActiveBirdIndex(0);
    scrollToItem(0);
    setShowResetConfirm(false);
    setShowCompletionPage(false);
    setShowHomepage(true);
    triggerClickSound();
  };

  // 4. Center snap scrolling helper
  const scrollToItem = useCallback((index: number) => {
    const list = carouselRef.current;
    if (!list) return;

    const targetBird = birdsList[index];
    if (!targetBird) return;

    const filteredIndex = filteredBirds.findIndex(b => b.id === targetBird.id);
    if (filteredIndex === -1) return;

    const items = list.querySelectorAll('.carousel-item');
    const child = items[filteredIndex] as HTMLElement;
    if (!child) return;

    isScrollingByCode.current = true;

    // Calculate center offset positions
    const containerCenter = list.clientWidth / 2;
    const itemCenter = child.offsetLeft + child.clientWidth / 2;
    const destScrollLeft = itemCenter - containerCenter;

    list.scrollTo({
      left: destScrollLeft,
      behavior: 'smooth'
    });

    // Reset code scrolling block after smooth motion finishes
    setTimeout(() => {
      isScrollingByCode.current = false;
    }, 600);
  }, [filteredBirds]);

  // Update indices smoothly
  const handleSelectBird = useCallback((index: number) => {
    if (index < 0 || index >= birdsList.length) return;
    setActiveBirdIndex(index);
    scrollToItem(index);
    // When switching birds, if already observed, automatically focus it. Otherwise reset blur
    const nextBirdObserved = observedList.includes(birdsList[index].id);
    if (nextBirdObserved) {
      setFocusSliderValue(0);
      setIsFocusLocked(true);
    } else {
      setFocusSliderValue(85);
      setIsFocusLocked(false);
    }
    triggerClickSound();
  }, [observedList, scrollToItem]);

  // Synchronize active bird when filteredBirds or filters change
  useEffect(() => {
    if (filteredBirds.length > 0) {
      const activeInFilter = filteredBirds.some(b => b.id === activeBird.id);
      if (!activeInFilter) {
        const targetBird = filteredBirds[0];
        const fullIndex = birdsList.findIndex(b => b.id === targetBird.id);
        if (fullIndex !== -1) {
          setActiveBirdIndex(fullIndex);
          setTimeout(() => {
            scrollToItem(fullIndex);
          }, 100);
        }
      }
    }
  }, [filteredBirds, activeBird.id, scrollToItem]);

  // Scrolling monitor radar: checks which item is closest to the horizontal center line
  const handleCarouselScroll = () => {
    if (isScrollingByCode.current) return;

    const list = carouselRef.current;
    if (!list) return;

    const parentCenter = list.scrollLeft + list.clientWidth / 2;
    const items = list.querySelectorAll('.carousel-item');
    
    let closestIndex = 0;
    let minDistance = Infinity;

    items.forEach((item, index) => {
      const child = item as HTMLElement;
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - parentCenter);

      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    const closestBird = filteredBirds[closestIndex];
    if (closestBird) {
      const fullIndex = birdsList.findIndex(b => b.id === closestBird.id);
      if (fullIndex !== -1 && fullIndex !== activeBirdIndex) {
        setActiveBirdIndex(fullIndex);
        // Synchronize focus depth of field values
        const targetBirdObserved = observedList.includes(closestBird.id);
        if (targetBirdObserved) {
          setFocusSliderValue(0);
          setIsFocusLocked(true);
        } else {
          setFocusSliderValue(85);
          setIsFocusLocked(false);
        }
      }
    }
  };

  // Center initial active item on load
  useEffect(() => {
    // Small delay ensures correct layout parameters calculated
    setTimeout(() => {
      scrollToItem(0);
    }, 300);
  }, [scrollToItem]);

  // Keys bindings for easy arrow key sliding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        const currentFilteredIndex = filteredBirds.findIndex(b => b.id === birdsList[activeBirdIndex].id);
        if (currentFilteredIndex !== -1) {
          const prevFilteredIndex = Math.max(0, currentFilteredIndex - 1);
          const prevBird = filteredBirds[prevFilteredIndex];
          if (prevBird) {
            const fullIndex = birdsList.findIndex(b => b.id === prevBird.id);
            handleSelectBird(fullIndex);
          }
        }
      } else if (e.key === 'ArrowRight') {
        const currentFilteredIndex = filteredBirds.findIndex(b => b.id === birdsList[activeBirdIndex].id);
        if (currentFilteredIndex !== -1) {
          const nextFilteredIndex = Math.min(filteredBirds.length - 1, currentFilteredIndex + 1);
          const nextBird = filteredBirds[nextFilteredIndex];
          if (nextBird) {
            const fullIndex = birdsList.findIndex(b => b.id === nextBird.id);
            handleSelectBird(fullIndex);
          }
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        // Space/Enter hits the shutter trigger, preventing default scroll jumps
        e.preventDefault();
        handleCaptureSnapshot();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBirdIndex, observedList, filteredBirds, handleSelectBird]);

  return (
    <div className="min-h-screen bg-[#F3ECE0] text-[#2F2A25] font-sans relative overflow-x-hidden border-[12px] border-[#D9D1C3] p-6 md:p-10 lg:p-14 flex flex-col justify-between">
      
      {/* Decorative Warm Paper Grain Background (Lo-Fi style) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Instant Camera White Flash Shutter Screen Overlay */}
      <div 
        id="camera-white-flash"
        className={`fixed inset-0 bg-white transition-opacity z-50 pointer-events-none ${
          isFlashActive ? 'opacity-100 duration-0' : 'opacity-0 duration-[400ms] ease-out'
        }`}
      />

      {showCompletionPage ? (
        /* MASTER INVESTIGATOR COMPLETION SHOWCASE PAGE */
        <div 
          className="max-w-5xl mx-auto w-full my-auto z-10 flex flex-col bg-[#FAF8F4]/98 overflow-hidden relative min-h-[640px] transition-all duration-300 font-serif p-6 sm:p-9 border-4 border-[#5C4D3E]"
          style={{
            borderRadius: '24px 110px 18px 105px/105px 18px 110px 24px',
            boxShadow: '6px 7px 0px 0px rgba(92, 77, 60, 0.18)'
          }}
        >
          {/* Handcrafted Double Line Header Border */}
          <div className="absolute top-3 inset-x-4 h-[3px] border-y border-dashed border-[#5C4D3E]/30" />
          
          {/* Main Layout Grid */}
          <div className="flex flex-col gap-6 md:gap-8 mt-2">
            
            {/* Top Congratulatory Seal Block with traditional Vermilion Ink Stamp */}
            <div className="text-center border-b-[3px] border-double border-[#5C4D3E]/30 pb-6 relative">
              {/* Retro Traditional Red Ink Stamp imprint */}
              <div className="absolute top-0 right-4 sm:right-10 w-24 h-24 border-2 border-dashed border-red-700/60 text-red-700/80 flex flex-col items-center justify-center rounded-sm rotate-12 select-none pointer-events-none p-1 bg-red-50/10 font-bold">
                <span className="text-[8px] font-mono tracking-tighter">FORMOSA JOURNAL</span>
                <span className="text-[12px] font-black font-serif leading-none border-y border-red-700/45 py-0.5 my-0.5">全觀測認證</span>
                <span className="text-[7.5px] font-mono tracking-widest scale-90">SUCCESS 100%</span>
              </div>

              <div className="inline-flex items-center justify-center bg-[#FCFAF5] p-3.5 rounded-full border-2 border-[#5C4D3E] shadow-sm mb-3.5" style={{ borderRadius: '53% 47% 51% 49% / 48% 52% 48% 52%' }}>
                <Award className="w-10 h-10 text-[#8C7256]" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black text-[#3D2C1F] tracking-wide flex items-center justify-center gap-2 font-serif text-center">
                全觀測達成 All Observations Achieved
              </h2>
              <div className="text-xs font-mono text-[#8C765C] font-extrabold tracking-widest uppercase mt-1 text-center">
                福爾摩沙野生飛羽考察大師 • Field Investigator Achievement
              </div>
              <p className="text-xs text-stone-600 mt-3 font-serif max-w-2xl mx-auto leading-relaxed text-center">
                恭喜您！已完成：臺灣 32 種特有種飛羽全圖鑑解鎖。
                <span className="block text-[10px] text-stone-500 font-sans mt-1">Congratulations. Completion achieved: 32 endemic bird species of Taiwan unlocked.</span>
              </p>
            </div>

            {/* Grid of All 32 Collected Bird Cards with Handcrafted Artwork */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="text-xs font-black text-[#4A3C31] flex items-center gap-1.5 font-serif uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-[#8C765C]" />
                  手繪寫生與照片附錄 (Hand-drawn Sketches & Photographic Appendix)
                </h3>
                <span className="text-[10px] font-mono bg-[#EFEBE4] text-[#5C4D3E] border border-[#C6BBA8] py-0.5 px-2.5 rounded-full font-bold">
                  解鎖進度 100% (32/32 已收錄) | Progress 100% (32/32 Collected)
                </span>
              </div>

              {/* Scrollable specimen list - Styled like a rustic glass specimen cabinet drawers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5 max-h-[280px] overflow-y-auto p-4 bg-[#FCFAF5]/85 rounded-xl border-2 border-[#5C4D3E]/45 font-serif scrollbar-thin">
                {birdsList.map((bird) => {
                  const customDrawing = customDrawings[bird.id];
                  const isObserved = observedList.includes(bird.id);
                  return (
                    <div 
                      key={bird.id}
                      className={`bg-white border-2 flex flex-col justify-between p-2 min-h-[140px] rounded transition-all duration-200 hover:-translate-y-0.5 select-none relative overflow-hidden ${
                        isObserved 
                          ? 'border-[#5C4D3E]/70 shadow-[2px_2.5px_0px_rgba(92,77,62,0.15)] bg-white' 
                          : 'border-stone-300 opacity-60 bg-stone-50'
                      }`}
                      style={{
                        borderRadius: '6px 8px 5px 7px/7px 5px 8px 6px'
                      }}
                    >
                      {/* Thumbnail wrapper */}
                      <div className="w-full h-[65px] bg-[#FAF8F3]/60 rounded border border-stone-200/50 flex items-center justify-center overflow-hidden relative">
                        {customDrawing ? (
                           <img 
                             src={customDrawing} 
                             alt={bird.name} 
                             className="w-full h-full object-contain rotate-1"
                             referrerPolicy="no-referrer"
                           />
                        ) : (
                           <div className={`scale-[0.55] transform origin-center select-none ${isObserved ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                             <BirdSvg 
                               bird={bird} 
                               isSilhouette={!isObserved} 
                               customDrawingUrl={null}
                             />
                           </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-[#5C4D3E]/90 text-[#FAF8F4] rounded-tl-sm px-1 text-[7px] font-mono leading-none py-0.5 scale-90 origin-bottom-right">
                          #{bird.id}
                        </span>
                      </div>
                      
                      {/* Name & status */}
                      <div className="text-center mt-1 w-full overflow-visible">
                        <div className="text-[10.5px] font-extrabold text-[#352513] leading-normal flex items-center justify-center gap-0.5 text-center break-words whitespace-normal min-h-[22px]">
                          {isObserved ? renderAnnotatedName(bird.name) : '???'}
                        </div>
                        <div className="text-[7px] font-mono text-stone-400 mt-1 truncate leading-none">
                          {bird.englishName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


            {/* Educational content columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-dashed border-stone-300">
              
              {/* Column 1: Taiwan as a birdwatching heaven */}
              <div className="bg-[#FAF8F5] p-5 rounded-xl border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#8C765C] uppercase tracking-wider mb-2.5 font-sans flex flex-col">
                    <span className="text-[#A0522D] text-sm font-serif font-black mb-0.5">臺灣為何是世界著名的「飛羽天堂與賞鳥聖地」？</span>
                    <span className="text-[10px] text-stone-400 font-normal font-sans normal-case tracking-normal">Why Taiwan is a World-Renowned Birdwatching Paradise</span>
                  </h4>
                  <div className="text-xs text-stone-600 leading-relaxed space-y-4 font-sans">
                    <div>
                      <p className="text-stone-700 font-medium">
                        臺灣位處東亞季風島弧的中心樞紐，雖然陸地面積僅佔全球的萬分之二點五，卻在特有種密度與總記錄鳥種上傲視群芳。目前全島記錄到的野生鳥類已超過 650 種，其中 32 種為百分之百完全的臺灣特有種，其餘更有超過 50 種特有亞種，密度位居世界前茅！
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif">
                        Taiwan sits at the heart of the East Asian island arc. Although its land area accounts for only 0.025% of the world's total, it boasts an exceptional concentration of endemic species and one of the richest bird records anywhere on Earth. More than 650 species of wild birds have been recorded across the island, including 32 species found nowhere else in the world and over 50 endemic subspecies.
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-700 font-medium">
                        更奇拔的是極致垂直海拔起伏：從臨海肥沃的潟湖濕地、低海拔茂盛闊葉林，到中海拔針闊混合林，直至拔地 3,952 米的玉山寒帶針葉林，在僅僅百公里的地理寛度內，壓縮了熱帶、溫帶及寒帶的微型多樣氣候圈。因此，各種林相繁花大放，成為孕育出如臺灣藍鵲、帝雉、藍腹鷴等傳奇飛羽的演化溫床。
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif">
                        What makes Taiwan even more remarkable is its dramatic range of elevations. Within a span of just 100 kilometers, landscapes rise from fertile coastal lagoons and wetlands, through lush lowland broadleaf forests and mid-elevation mixed forests, all the way to the alpine conifer forests of Yushan, Taiwan's highest peak at 3,952 meters. This compressed elevation gradient creates tropical, temperate, and alpine climate zones in close proximity, forming an evolutionary cradle for iconic birds such as the Taiwan Blue Magpie, Mikado Pheasant, and Swinhoe's Pheasant.
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-700 font-medium">
                        同時，臺灣更是「東亞-澳洲候鳥遷徙線 (EAAF)」不可替代的「心臟補給站」。每年入冬，數以十萬計的候鳥與極度瀕危的黑面琵鷺，皆在此棲息度冬。
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif">
                        Taiwan also serves as an irreplaceable stopover and wintering ground along the East Asian–Australasian Flyway (EAAF). Every winter, hundreds of thousands of migratory birds arrive on the island, including the critically endangered Black-faced Spoonbill.
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-700 font-medium">
                        學界觀點：許多歐美和日本的野生賞鳥家會花費數萬英里飛抵這裡，只為了在合歡山下一睹冠羽畫眉的獨特「龐克頭」和迷人歌喉！
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif">
                        According to ornithologists and birdwatchers worldwide, many enthusiasts from Europe, North America, and Japan travel thousands of miles to Taiwan for the chance to spot the Taiwan Yuhina, famous for its distinctive punk-like crest and delightful song in the mountains of Hehuanshan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Initial intention description */}
              <div className="bg-[#FAF8F5] p-5 rounded-xl border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#8C765C] uppercase tracking-wider mb-2.5 font-sans flex flex-col">
                    <span className="text-[#A0522D] text-sm font-serif font-black mb-0.5">《臺灣特有種鳥類觀測手札》的初衷</span>
                    <span className="text-[10px] text-stone-400 font-normal font-sans normal-case tracking-normal">The Purpose and Acoustic Design of "Taiwan's Endemic Birds Field Journal"</span>
                  </h4>
                  <div className="text-xs text-stone-600 leading-relaxed space-y-4 font-sans">
                    <div>
                      <p className="text-stone-700 font-medium">
                        本觀察手札是參考社團法人台灣野鳥協會 Wild Bird Association of Taiwan 提供之資料製作的互動網頁。其核心初衷是「推廣對臺灣這座島嶼野生動物、棲地保育的關懷、尊重與認識」。
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif">
                        This interactive field journal was created using reference materials provided by the Wild Bird Association of Taiwan. Its central mission is to foster appreciation, respect, and awareness for Taiwan's wildlife and habitat conservation.
                      </p>
                    </div>
                  
                    <div>
                      <p className="text-stone-700 font-medium">
                        配以「色鉛筆畫板」與「鏡頭對焦」功能，試圖將探險、專心致志的寧靜樂趣帶回日常。野生鳥類是生態系最靈敏的小生物，森林因啼聲而具有靈魂。期盼本手札對特有種的介紹，能在臺灣本島的居民心底種下一顆保護山林、愛護棲地生態、與萬物共和諧的種子。
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif mb-3">
                        Through features such as the "Colored Pencil Sketchbook" and "Camera Focus" interactions, the website seeks to recreate the quiet joy of exploration and mindful observation. Wild birds are among the most sensitive indicators of ecosystem health, and their songs bring life and character to the forests they inhabit.
                      </p>
                      <p className="text-[10.5px] text-stone-500 leading-normal mt-1.5 font-serif">
                        We hope that introducing Taiwan's endemic birds through this journal will inspire visitors to cherish the island's forests, protect natural habitats, and cultivate a deeper sense of harmony with the living world around them.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-5">
                  <div className="inline-block bg-[#F5EEDB] border border-[#DECDB3] px-3.5 py-1.5 rounded-lg text-[10px] text-amber-900 font-serif font-black shadow-sm">
                    <div>主題曲 marigold-maples.mp3 由Suno生成</div>
                    <div className="text-[8.5px] text-amber-800 font-normal mt-0.5">Theme Song 'marigold-maples.mp3' Generated by Suno AI</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons to navigate out or Reset progress */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t-[3px] border-double border-[#8C765C]/40 pt-5 mt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    const nextMute = !isMuted;
                    setIsMuted(nextMute);
                    setUserHasInteracted(true);
                    if (!nextMute) {
                      setTimeout(() => playClickSound(), 10);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#FAF6EE] border border-stone-300 rounded text-xs flex items-center gap-2 text-[#736353] hover:bg-stone-100 cursor-pointer font-bold transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-stone-500 animate-pulse" /> : <Volume2 className="w-4 h-4 text-[#BF564E] animate-bounce" />}
                  <span>{isMuted ? "已靜音 Muted" : "音樂播放中 Audio On"}</span>
                </button>
                <span className="text-[10px] text-stone-400 font-mono self-center">
                  BGM: {showHomepage ? "野林風鈴 Wind Chimes" : "marigold-maples.mp3"}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    triggerClickSound();
                    setShowCompletionPage(false);
                    setShowHomepage(true); // Goes back to Book Cover
                  }}
                  className="sketch-btn-c px-4 py-2.5 text-xs text-stone-700 hover:text-stone-900 border border-stone-300 font-serif cursor-pointer"
                >
                  <span>返回手札封面 (Book Cover)</span>
                </button>

                <button
                  onClick={() => {
                    triggerClickSound();
                    setShowCompletionPage(false);
                    setShowHomepage(false); // Straight to viewfinder explorer
                  }}
                  className="sketch-btn-b px-5 py-2.5 text-xs text-stone-800 bg-[#FAF7F0] font-serif hover:bg-white border border-[#8C765C]/40 cursor-pointer"
                >
                  <span>進入觀測地 自由探險、相片與手繪圖鑑 (Field Guide & Sketchbook)</span>
                </button>

                <button
                  onClick={handleResetProgress}
                  className="sketch-btn-a px-4 py-2.5 text-xs bg-red-700 hover:bg-red-800 text-white border-b-2 border-red-900 font-serif active:border-b-0 cursor-pointer"
                >
                  <span>重置所有觀察數據 (Reset All Progress)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : showHomepage ? (
        /* VINTAGE HOMEPAGE / NATURALIST COVER PAGE */
        <div className="max-w-5xl mx-auto w-full my-auto z-10 flex flex-col lg:flex-row bg-[#FAF6EE] sketch-frame-homepage sketch-container-base overflow-hidden relative min-h-[640px] transition-all duration-300">
          {/* Left Side: Cloth Binding & Spine Cover */}
          <div className="lg:w-5/12 bg-[#21372E] sketch-homepage-left p-8 flex flex-col justify-between text-[#EAE2C6] relative border-r-4 border-[#162720] shadow-none min-h-[420px] lg:min-h-auto">
            {/* Book Spine shadow */}
            <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/5 via-black/10 to-transparent border-r border-[#15251F]/30" />
            <div className="absolute right-2 top-0 bottom-0 w-[2px] bg-[#D1B875]/20" />
            
            {/* Fine Pressed corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#D1B875]/40 rounded-tl-sm pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#D1B875]/40 rounded-bl-sm pointer-events-none" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#D1B875]/10 rounded-tr-sm pointer-events-none lg:hidden" />
            
            <div className="flex justify-between items-center text-[10px] tracking-widest font-mono text-[#9AB3A7] font-bold uppercase">
              <span>Formosa Journal</span>
              <span>Est. 2026</span>
            </div>

            {/* Title card */}
            <div className="my-auto py-6 flex flex-col items-center">
              <div className="bg-[#FAF8F3] text-[#2C2114] px-6 py-9 max-w-[180px] text-center flex flex-col items-center justify-between gap-4 sketch-frame-badge shadow-none">
                <div className="w-8 h-[1.5px] bg-[#C5A880]" />
                
                <h2 className="text-2xl md:text-3xl font-extrabold font-serif leading-8 tracking-widest text-[#352513] [writing-mode:vertical-rl] px-1 filter drop-shadow-sm select-none">
                  臺灣特有種鳥類<br />觀測手札
                </h2>
                
                <div className="w-8 h-[1.5px] bg-[#C5A880] mt-1" />

                <span className="text-[7.5px] font-mono tracking-wider text-stone-500 uppercase font-black mt-1 text-center scale-90">
                  Taiwan Endemic Birds
                </span>

                {/* Vermillion traditional ink stamp */}
                <div className="border-[2px] border-[#BF4040]/70 rounded-md px-2 py-0.5 mt-3 flex flex-col items-center justify-center bg-[#FAF8F3] shadow-none transform -rotate-3 select-none">
                  <span className="text-[#BF4040] font-serif font-black tracking-widest text-[9.5px] leading-tight font-extrabold">福爾摩沙</span>
                  <span className="text-[6.5px] text-[#A33434] font-mono scale-90 leading-none tracking-tight">WILD EXPEDITION</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-[#9AB3A7] font-serif tracking-widest uppercase font-bold leading-none">
                Field Study Handbook
              </p>
            </div>
          </div>

          {/* Right Side: Naturalist open page with stats and beautiful stamp boxes */}
          <div className="lg:w-7/12 bg-[#FAF6EE] sketch-homepage-right p-6 md:p-8 flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Header info */}
              <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-5">
                <div>
                  <h3 className="text-lg md:text-xl font-black font-serif text-[#4A3C31] tracking-wide flex items-center gap-1.5">
                    觀測指南 Field Guide
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 font-serif leading-relaxed">
                    在鏡頭的焦距中捕捉大自然細節，用色鉛筆的溫暖筆觸，一頁頁畫下屬於這座島嶼的飛羽圖鑑。
                    <span className="block text-[10px] text-stone-400 font-sans mt-0.5 normal-case tracking-normal">Focus your lens to capture the subtle details of nature, and bring this island's unique bird journal to life with warm colored-pencil sketches.</span>
                  </p>
                </div>
              </div>

              {/* Research logs stats summary */}
              <div className="grid grid-cols-2 gap-4 mb-5 font-serif">
                <div className="bg-[#FAF7F0] p-3 sketch-frame-badge shadow-none">
                  <span className="text-[10px] text-stone-400 block font-mono font-bold tracking-wider uppercase">已觀測收錄 Observed</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-[#BF4040]">
                      {observedList.length}
                    </span>
                    <span className="text-xs text-stone-500">/ 32 特有種 Endemics</span>
                  </div>
                  {/* Progress Bar indicator */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-[#BF4040] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(observedList.length / 32) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#FAF7F0] p-3 sketch-frame-badge shadow-none">
                  <span className="text-[10px] text-stone-400 block font-mono font-bold tracking-wider uppercase">已繪製手譜 Sketches</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-amber-800">
                      {Object.values(customDrawings).filter(Boolean).length}
                    </span>
                    <span className="text-xs text-stone-500">/ 32 幅手稿 Artwork</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-[#8F5E36] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(Object.values(customDrawings).filter(Boolean).length / 32) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  triggerClickSound();
                  setUserHasInteracted(true);
                  setShowHomepage(false);
                }}
                className="sketch-btn-a bg-[#8C765C] hover:bg-[#78644e] text-white w-full py-4 px-6 text-sm tracking-widest cursor-pointer flex items-center justify-center font-serif"
              >
                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
                <span>
                  展開研究！繼續我的野外考察 Begin field research. Continue the expedition.
                </span>
              </button>

              {observedList.length > 0 ? (
                <div className="flex justify-between items-center px-1 text-[10px] font-mono text-stone-400">
                  <span>上次探險紀錄: {observedList.length} 種鳥 Previous Progress: {observedList.length} Species</span>
                  <button
                    onClick={handleResetProgress}
                    className="text-red-700/80 hover:text-red-950 hover:underline cursor-pointer font-bold"
                  >
                    重置全部研究紀錄 Reset Progress Record
                  </button>
                </div>
              ) : (
                <p className="text-[9.5px] text-stone-400 font-serif text-center leading-relaxed">
                  本系統採用網頁安全 LocalStorage 技術，保全您的相片與圖鑑，重啟瀏覽器亦不丟失。<br />
                  <span className="text-[8.5px] text-stone-400 font-sans block mt-0.5">This journal uses sandboxed LocalStorage, preserving custom observations, photographs, and sketched artwork securely across sessions.</span>
                </p>
              )}

              {/* Completion view shortcut or Cheat fast-track button */}
              {observedList.length === birdsList.length ? (
                <button
                  onClick={() => {
                    triggerClickSound();
                    setUserHasInteracted(true);
                    setShowCompletionPage(true);
                  }}
                  className="w-full mt-2.5 py-3 px-4 text-[#564433] bg-[#FCFAF5] font-serif font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1.5px] shadow-[3.5px_4px_0px_#5C4D3C] active:shadow-[1px_1px_0px_#5C4D3C] border-2 border-[#5C4D3C]"
                  style={{ borderRadius: '220px 15px 185px 18px/18px 230px 15px 220px' }}
                >
                  <Trophy className="w-4 h-4 text-[#B58E5E] animate-bounce" />
                  <span>全觀測達成成就區 View Achievement</span>
                </button>
              ) : (
                <div className="pt-1.5 border-t border-dashed border-stone-200">
                  <button
                    onClick={() => {
                      triggerClickSound();
                      setUserHasInteracted(true);
                      const allIds = birdsList.map(b => b.id);
                      saveObservedList(allIds);
                      setTimeout(() => {
                        setIsFlashActive(true);
                        setTimeout(() => {
                          setIsFlashActive(false);
                          setShowCompletionPage(true);
                        }, 300);
                      }, 500);
                    }}
                    className="text-[10px] text-amber-700/90 hover:text-amber-900 hover:underline cursor-pointer font-serif flex items-center justify-center gap-1 mx-auto py-1 fill-amber-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>學者捷徑：模擬一鍵裝滿手札全觀測 (快進體驗完滿大頁面) | Scholar Shortcut: Fast-Track 100% Progress</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ORIGINAL APPLICATION VIEW */
        <>
          {/* MAIN TOP HEADER BAR */}
          <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b-2 border-[#DCD3C4] pb-4 mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-[#8C765C] p-2.5 rounded-lg text-[#FBF9F5] shadow-md ring-4 ring-[#8C765C]/10">
            <Binoculars className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#453629] flex flex-col lg:flex-row lg:items-center gap-1.5 lg:gap-3">
              <span className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="whitespace-nowrap">臺灣特有種鳥類</span>
                <span className="font-semibold whitespace-nowrap">觀測手札</span>
              </span>
              <span className="text-xs bg-[#BF7356] text-white py-0.5 px-2 rounded-full font-medium w-fit">野生動物觀測篇</span>
            </h1>
            <p className="text-xs md:text-sm text-[#736553] font-serif mt-0.5 leading-relaxed">
              橫跨島嶼高低海拔，觀察並記錄 32 種臺灣特有種野生鳥類
              <span className="block text-[11px] text-[#8C7652]/80 font-sans mt-0.5">Explore high and low elevation forests to observe and record 32 endemic bird species of Taiwan</span>
            </p>
          </div>
        </div>

         {/* Dynamic Status Badges & Mute controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Custom Music Indicator (Subtle status indicator only) */}
          {customBgmName && (
            <div 
              className="flex items-center gap-1.5 bg-[#FAF6EE] border-2 border-[#8C765C]/80 py-1 px-2.5 text-[10px] text-[#4A3C31] font-serif"
              style={{
                borderRadius: '8px 15px 6px 14px/12px 6px 15px 8px'
              }}
              title={`播放中: ${customBgmName}`}
            >
              <Music className="w-3 h-3 text-amber-800 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="max-w-[70px] md:max-w-[125px] truncate font-bold font-serif">{customBgmName}</span>
            </div>
          )}

          {/* Sound control button */}
          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              setUserHasInteracted(true);
              if (!nextMute) {
                setTimeout(() => playClickSound(), 10);
              }
            }}
            className="sketch-button-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5 font-bold"
            title={isMuted ? "開啟聲音 Audio On" : "關閉聲音 Mute"}
            id="sound-toggle-btn"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-500 animate-pulse" /> : <Volume2 className="w-4 h-4 text-amber-800" />}
            <span>{isMuted ? "靜音 Muted" : "音效開 Audio On"}</span>
          </button>

          {/* Back to Cover */}
          <button
            onClick={() => {
              triggerClickSound();
              setShowHomepage(true);
            }}
            className="sketch-button-secondary text-xs py-1.5 px-2.5 flex items-center font-bold"
            title="返回封面 Cover"
            id="back-to-cover-btn"
          >
            <span>返回封面 Cover</span>
          </button>

          {/* Golden Triumph Button if complete - styled like a hand-pressed terracotta ink mark */}
          {observedList.length === birdsList.length && (
            <button
              onClick={() => {
                triggerClickSound();
                setShowCompletionPage(true);
              }}
              className="px-2.5 py-1.5 bg-[#FAF7F0] border-2 border-[#BF564E] text-[#BF564E] hover:bg-[#BF564E] hover:text-[#FAF7F0] text-xs font-serif font-black flex items-center cursor-pointer transition-colors duration-150"
              style={{
                borderRadius: '6px 14px 8px 12px/12px 8px 14px 6px'
              }}
              title="收集成就 Achievements"
            >
              <span>收集成就 Achievements</span>
            </button>
          )}

          {/* Reset progress */}
          <button
            onClick={handleResetProgress}
            className="sketch-button-secondary text-xs py-1.5 px-2.5 flex items-center font-bold"
            title="重算觀測成績 Reset"
            id="reset-progress-btn"
          >
            <span>重置 Reset</span>
          </button>

          {/* Progress Tracker (0/32) */}
          <div 
            className="flex items-center gap-1.5 bg-[#FBF9F5] py-1 px-2.5 border-2 border-[#8C765C]/80 shadow-none text-[#85715D]"
            style={{
              borderRadius: '15px 6px 14px 8px/8px 14px 6px 12px'
            }}
          >
            <span className="text-xs font-serif font-black">進度 Progress</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-black text-[#BF4040]" id="birds-progress-badge">
                {observedList.length}
              </span>
              <span className="text-[10px] font-serif text-[#8C7652] font-bold">/32</span>
            </div>
          </div>
        </div>
      </header>

      {/* FILTER SEARCH SUB-ROW */}
      <section className="max-w-6xl mx-auto w-full mb-10 lg:mb-12 z-10 bg-[#E9E1D2] p-2.5 sketch-border-md flex flex-wrap items-center justify-between gap-3 shadow-none">
        <div className="relative flex-1 min-w-[200px] flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-[#8C765C] pointer-events-none" />
          <input
            type="text"
            placeholder="搜尋俗名、學名、海拔 Search common name, scientific name, altitude"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sketch-input w-full pl-9 pr-4 py-1.5 text-sm font-sans"
            id="search-birds-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#706050] font-bold font-serif hidden sm:inline">狀態篩選 Filter Status:</span>
          <div className="flex p-0.5 sketch-border-sm text-xs bg-[#FFFDFC]/60">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 sketch-tab font-serif font-black ${filterMode === 'all' ? 'bg-[#89735D] text-white' : 'text-[#706050] hover:bg-[#EBE2CF]/50'}`}
              id="filter-all-btn"
            >
              全部 All {birdsList.length}
            </button>
            <button
              onClick={() => setFilterMode('observed')}
              className={`px-3 py-1 sketch-tab font-serif font-black ${filterMode === 'observed' ? 'bg-[#89735D] text-white' : 'text-[#706050] hover:bg-[#EBE2CF]/50'}`}
              id="filter-observed-btn"
            >
              已採集 Observed {observedList.length}
            </button>
            <button
              onClick={() => setFilterMode('unobserved')}
              className={`px-3 py-1 sketch-tab font-serif font-black ${filterMode === 'unobserved' ? 'bg-[#89735D] text-white' : 'text-[#706050] hover:bg-[#EBE2CF]/50'}`}
              id="filter-unobserved-btn"
            >
              未採集 Unobserved {32 - observedList.length}
            </button>
          </div>
        </div>
      </section>

      {/* CORE PLAYGROUND: Camera Viewfinder Left VS Handbook Card Right */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start flex-1 mb-12 md:mb-16">
        
        {/* LEFT COLUMN: VIEWPORT CAMERA FRAMER (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col items-center justify-start w-full">
          
          {/* Panel Selector Toggle tabs */}
          <div className="flex w-full max-w-md sketch-border-sm bg-[#FAF6EE] p-0.5 text-xs mb-4 font-serif">
            <button 
              onClick={() => { setLeftPanelMode('viewfinder'); triggerClickSound(); }} 
              className={`flex-1 py-1.5 px-3.5 sketch-tab transition-all font-black flex items-center justify-center cursor-pointer ${leftPanelMode === 'viewfinder' ? 'bg-[#89735D] text-white' : 'text-[#706050] hover:bg-[#EBE2CF]/50'}`}
              title="切換回野地鏡頭：自由對焦與手繪觀測"
            >
              <span>觀測觀景窗</span>
            </button>
            <button 
              onClick={() => { setLeftPanelMode('map'); triggerClickSound(); }} 
              className={`flex-1 py-1.5 px-3.5 sketch-tab transition-all font-black flex items-center justify-center cursor-pointer ${leftPanelMode === 'map' ? 'bg-[#89735D] text-white' : 'text-[#706050] hover:bg-[#EBE2CF]/50'}`}
              title="切換至生物特有種分布：臺灣島棲地索引"
            >
              <span>生態分布圖</span>
            </button>
          </div>

          {leftPanelMode === 'viewfinder' ? (
            /* Main Polaroid Style Polaroid Viewfinder frame */
            <div 
              id="camera-viewfinder-frame"
              className="sketch-border-lg bg-white w-full max-w-md p-5 pb-8 relative flex flex-col items-center justify-between min-h-[500px]"
            >
              {/* Viewfinder Header info stamp */}
              <div className="w-full flex justify-between items-center text-[10px] font-mono tracking-wider text-stone-400 font-bold mb-3 border-b border-stone-100 pb-2">
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-[#BF4040]" /> 
                  {isDrawingMode ? 'FIELD STUDIO v1.8' : 'FIELD RECON v2.0'}
                </span>
                <span className="bg-[#ECE2D0] text-stone-600 px-2 py-0.5 rounded-full" id="camera-batt-sensor">
                  {isDrawingMode ? '手繪創作中' : 'ISO 400 • F4.0'}
                </span>
              </div>

              {isDrawingMode ? (
                <BirdSketchpad
                  bird={activeBird}
                  initialDrawing={customDrawings[activeBird.id] || null}
                  onSave={(dataUrl) => {
                    saveDrawing(activeBird.id, dataUrl);
                    setIsDrawingMode(false);
                    triggerClickSound();

                    // Auto observe when they sketch
                    if (dataUrl && !isCurrentlyObserved) {
                      const updatedList = [...observedList, activeBird.id];
                      saveObservedList(updatedList);
                    }
                  }}
                  onClose={() => {
                    setIsDrawingMode(false);
                    triggerClickSound();
                  }}
                />
              ) : (
                <>
                  {/* SQUARE EYE-FIND PANEL Container */}
                  <div 
                    id="camera-lens-viewpoint"
                    onClick={() => {
                      if (!isFocusLocked) {
                        // Dial it to perfect focus
                        handleFocusSliderChange(0);
                      }
                    }}
                    className="aspect-square w-full bg-white sketch-lens-circle overflow-hidden relative flex flex-col items-center justify-center cursor-pointer group shadow-none"
                    title="點擊畫面以自動鎖定焦距"
                  >
                    {/* Beautiful Camera Optics Glass Overlay with clean neutral edge transition */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_72%,rgba(0,0,0,0.04)_100%)] pointer-events-none" />
                    {/* Soft photorealistic diagonal light sheen reflection in elegant white */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.12] pointer-events-none" />
                    
                    {/* Custom Crop Marks ┌ ┐ └ ┘ */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-stone-400/30" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-stone-400/30" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-stone-400/30" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-stone-400/30" />

                    {/* Crosshairs scope circle */}
                    <div className="absolute w-28 h-28 rounded-full border border-dashed border-stone-300/50 flex items-center justify-center pointer-events-none">
                      <div className="absolute w-0.5 h-0.5 rounded-full bg-stone-400/40" />
                      <div className="absolute w-3.5 h-[1px] bg-stone-300/60" />
                      <div className="absolute h-3.5 w-[1px] bg-stone-100/30 absolute" />
                      <div className="absolute -top-1 w-2 h-1 border-t border-x border-stone-300/30" />
                      <div className="absolute -bottom-1 w-2 h-1 border-b border-x border-stone-300/30" />
                    </div>

                    {/* PROCEDURAL SVG BIRD GRAPHIC ILLUSTRATION */}
                    <div 
                      id="bird-svg-wrapper"
                      className="w-4/5 h-4/5 transition-all duration-[600ms] ease-out select-none"
                      style={{
                        filter: `blur(${blurAmount}px) saturate(${saturationPercentage}%) grayscale(${grayscalePercentage})`,
                        opacity: isCurrentlyObserved ? 1 : Math.max(0.2, 1 - (focusSliderValue / 110))
                      }}
                    >
                      <BirdSvg 
                        bird={activeBird} 
                        isSilhouette={!isCurrentlyObserved && focusSliderValue > 25} 
                        customDrawingUrl={customDrawings[activeBird.id]}
                      />
                    </div>

                    {/* Sparkle reward particles overlay */}
                    {successParticles.map(part => (
                      <div
                        key={part.id}
                        className="absolute pointer-events-none animate-bounce"
                        style={{
                          left: `${part.x}%`,
                          top: `${part.y}%`,
                          width: `${part.s}px`,
                          height: `${part.s}px`,
                          borderRadius: '50%',
                          backgroundColor: part.color,
                          boxShadow: `0 0 8px ${part.color}`,
                          transition: 'opacity 1.5s ease-out',
                          opacity: 0.95
                        }}
                      />
                    ))}

                    {/* Focal Locked Double Check overlay if sharp */}
                    {isFocusLocked && !isCurrentlyObserved && (
                      <div className="absolute inset-x-0 bottom-12 text-center pointer-events-none animate-bounce">
                        <span className="bg-[#5C4D3E]/95 text-[#FDFBFA] text-[11px] font-serif font-black py-1 px-3 rounded-full flex items-center justify-center gap-1 mx-auto w-fit shadow-md">
                          <Sparkles className="w-3.5 h-3.5 text-[#EADBC8]" />
                          焦點合焦！按下快門記錄
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BEAUTIFUL COMPACT HAND-DRAWN HORIZONTAL FOCUS SCALE (REPLACES ROTATING DIAL) */}
                  <div className="w-full mt-4" id="focus-adjustment-stage">
                    <div className="flex flex-col gap-2 bg-[#FAF6EE]/40 border border-[#8C765C]/15 rounded-xl p-3 shadow-none">
                      
                      {/* Title & Status Readout Header */}
                      <div className="flex justify-between items-center text-xs text-[#5C4D3E]">
                        <span className="font-serif font-black flex items-center gap-1.5">
                          調焦環 Manual Focus Ring
                        </span>
                        <div className="font-mono text-[9px] font-extrabold text-[#BF564E] bg-white border border-[#BF564E]/25 rounded py-0.5 px-2">
                          {focusSliderValue === 0 ? '極致合焦 IN-FOCUS (1.0m)' : `深度偏離 +${focusSliderValue}mm`}
                        </div>
                      </div>

                      {/* Interactive Horizontal Focal Track */}
                      <div className="relative flex items-center py-4 px-1 group touch-none">
                        {/* Custom Pencil-Stroke Ruler Scale Background */}
                        <div className="absolute inset-x-2 h-[2px] bg-[#5C4D3E]/30" />
                        
                        {/* Ruler Ticks */}
                        <div className="absolute inset-x-2 flex justify-between pointer-events-none select-none opacity-40">
                          <span className="w-[1.5px] h-2.5 bg-[#5C4D3E]" />
                          <span className="w-[1px] h-1.5 bg-[#5C4D3E]" />
                          <span className="w-[1.5px] h-2 bg-[#5C4D3E]" />
                          <span className="w-[1px] h-1.5 bg-[#5C4D3E]" />
                          <span className="w-[1.5px] h-2.5 bg-[#5C4D3E]" />
                        </div>

                        {/* Standard Range Slider styled to match hand-penciled brass aesthetics */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={focusSliderValue}
                          onChange={(e) => {
                            setUserHasInteracted(true);
                            handleFocusSliderChange(Number(e.target.value));
                          }}
                          className="w-full h-8 opacity-0 absolute inset-0 cursor-pointer z-20 touch-none"
                        />

                        {/* Visual Slider Thumb and Active track overlay */}
                        <div 
                          className="absolute pointer-events-none transition-all duration-75" 
                          style={{ left: `calc(${focusSliderValue}% - 14px)`, width: '28px', height: '28px' }}
                        >
                          {/* Inner bronze wheel knob with subtle shadow */}
                          <div 
                            className="w-7 h-7 bg-[#FFFDF9] border-[2px] border-[#5C4D3E] shadow-sm flex items-center justify-center transform group-hover:scale-105 active:scale-95 transition-transform" 
                            style={{ 
                              borderRadius: '48% 52% 43% 57% / 57% 43% 57% 43%' 
                            }}
                          >
                            <span className="text-[8px] font-black text-[#5C4D3E]">
                              {focusSliderValue === 0 ? '●' : '||'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Clickable Quick-Focus Marks and Depth Tags */}
                      <div className="grid grid-cols-5 text-[8.5px] text-stone-400 font-mono text-center font-bold border-t border-dashed border-[#5C4D3C]/20 pt-2 mt-1">
                        <button 
                          onClick={() => handleFocusSliderChange(0)} 
                          className={`hover:text-[#BF564E] cursor-pointer text-left ${focusSliderValue === 0 ? 'text-[#BF564E] font-black scale-105 transition-all' : 'text-[#8C765C]'}`}
                        >
                          1m 完美合焦
                        </button>
                        <button 
                          onClick={() => handleFocusSliderChange(20)} 
                          className={`hover:text-amber-800 cursor-pointer ${focusSliderValue === 20 ? 'text-amber-800 font-black scale-105 transition-all' : ''}`}
                        >
                          5m
                        </button>
                        <button 
                          onClick={() => handleFocusSliderChange(50)} 
                          className={`hover:text-amber-800 cursor-pointer ${focusSliderValue === 50 ? 'text-amber-800 font-black scale-105 transition-all' : ''}`}
                        >
                          15m
                        </button>
                        <button 
                          onClick={() => handleFocusSliderChange(80)} 
                          className={`hover:text-amber-800 cursor-pointer ${focusSliderValue === 80 ? 'text-amber-800 font-black scale-105 transition-all' : ''}`}
                        >
                          50m
                        </button>
                        <button 
                          onClick={() => handleFocusSliderChange(100)} 
                          className={`hover:text-stone-800 text-right cursor-pointer ${focusSliderValue === 100 ? 'text-stone-800 font-black scale-105 transition-all' : ''}`}
                        >
                          ∞ 無限遠
                        </button>
                      </div>

                      {/* Short informative tip under it */}
                      <div className="text-[9px] text-[#8C765C] font-serif text-center mt-1 leading-normal opacity-75">
                        滑動調焦環至最左側「1m 完美合焦」或直按觀景窗，使鳥類清晰呈現，方可按下快門記錄。
                      </div>

                    </div>
                  </div>

                  {/* VINTAGE Tactile Woodblock Shutter Trigger Button & Creator Drawing Trigger */}
                  <div className="w-full mt-6 flex flex-col gap-2.5">
                    {isCurrentlyObserved ? (
                      /* State 1: Already Observed - Retake Shot (Elegantly Hand-Sketched) */
                      <button
                        onClick={handleCaptureSnapshot}
                        className="group relative flex items-center justify-center w-full py-3.5 px-6 bg-[#FCFAF5] border-2 border-[#8C765C] text-[#8C765C] hover:bg-[#8C765C] hover:text-[#FCFAF5] font-serif font-black shadow-[3px_3.5px_0px_rgba(140,118,92,0.25)] select-none transition-all duration-150 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs uppercase tracking-wider"
                        style={{
                          borderRadius: '12px 6px 14px 8px/8px 14px 6px 12px'
                        }}
                        id="shutter-trigger-btn"
                        title="鳥種已捕獲。點此重新拍攝更好的合焦照片"
                      >
                        <span>重新按下快門 Refocus & Take Shot</span>
                      </button>
                    ) : isFocusLocked ? (
                      /* State 2: Focus Perfect & Locked - Ready to Save Specimen */
                      <button
                        onClick={handleCaptureSnapshot}
                        className="group relative flex items-center justify-center w-full py-4 px-6 bg-[#FCFAF5] border-[3px] border-[#BF564E] text-[#BF564E] hover:bg-[#BF564E]/10 font-serif font-black text-sm tracking-wide shadow-[4px_4.5px_0px_rgba(191,86,78,0.25)] animate-pulse select-none transition-all duration-150 active:translate-y-0.5 active:shadow-none cursor-pointer"
                        style={{
                          borderRadius: '14px 105px 12px 95px/95px 12px 105px 14px'
                        }}
                        id="shutter-trigger-btn"
                        title="焦點已完美吻合！點此正式採集，收錄至您的考察手記！"
                      >
                        <div className="absolute top-1 left-3 text-[7.5px] text-[#BF564E]/30 font-mono tracking-widest pointer-events-none select-none font-bold">FOCUS LOCKED</div>
                        <span>採集並收錄至觀測手札 Record Specimen</span>
                      </button>
                    ) : (
                      /* State 3: Blurry Focus - Auto-adjust to Perfect & Save */
                      <button
                        onClick={handleCaptureSnapshot}
                        className="group relative flex items-center justify-center w-full py-3.5 px-6 bg-[#FCFAF5] text-[#5C4D3E] border-2 border-[#5C4D3E] hover:bg-[#EFEAE2] font-serif font-black text-xs shadow-[3px_3.5px_0px_rgba(92,77,62,0.25)] select-none transition-all duration-150 active:translate-y-0.5 active:shadow-none cursor-pointer"
                        style={{
                          borderRadius: '8px 12px 6px 14px/14px 6px 12px 8px'
                        }}
                        id="shutter-trigger-btn"
                        title="手動釋放快門將自動對焦並收錄此鳥種標本"
                      >
                        <span>按下快門記錄 Auto-Track & Capture</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        triggerClickSound();
                        setIsDrawingMode(true);
                       }}
                      className="group relative flex items-center justify-center w-full py-3.5 px-6 bg-[#FCFAF5] border-2 border-[#8C765C] text-[#8C765C] hover:bg-[#8C765C] hover:text-[#FCFAF5] font-serif font-black shadow-[3px_3.5px_0px_rgba(140,118,92,0.25)] select-none transition-all duration-150 active:translate-y-0.5 active:shadow-none cursor-pointer text-xs uppercase tracking-wider"
                      style={{
                        borderRadius: '12px 6px 14px 8px/8px 14px 6px 12px'
                      }}
                      id="enter-drawing-mode-btn"
                    >
                      <span>
                        {customDrawings[activeBird.id] ? "編輯手稿創作 Edit Hand Drawing" : "親手繪製這隻鳥 Draw This Bird"}
                      </span>
                    </button>

                    {customDrawings[activeBird.id] && (
                      <div className="flex flex-col items-center gap-1 mt-1 justify-center width-full">
                        {resetDrawingConfirmBirdId === activeBird.id ? (
                          <div className="flex flex-col items-center gap-1.5 p-2 bg-red-50 rounded-xl border border-red-200 text-center transition-all w-full select-none">
                            <span className="text-[10px] text-red-800 font-bold leading-tight">
                              確定要永久捨棄您的手繪並還原嗎？
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  saveDrawing(activeBird.id, null);
                                  triggerClickSound();
                                  setResetDrawingConfirmBirdId(null);
                                }}
                                className="py-0.5 px-2.5 text-[10px] bg-red-600 hover:bg-red-700 text-stone-50 rounded font-bold transition-all cursor-pointer shadow-xs"
                              >
                                確定捨棄
                              </button>
                              <button
                                onClick={() => {
                                  triggerClickSound();
                                  setResetDrawingConfirmBirdId(null);
                                }}
                                className="py-0.5 px-2 text-[10px] bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-medium transition-all cursor-pointer"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              triggerClickSound();
                              setResetDrawingConfirmBirdId(activeBird.id);
                            }}
                            className="text-[10px] text-red-700 hover:text-red-950 font-bold underline text-center cursor-pointer"
                          >
                            捨棄我的手繪，還原成原本圖鑑羽翼
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Historical Taiwan Endemic Bird Study Map Frame */
            <div 
              id="taiwan-coordinate-map-frame"
              className="sketch-border-lg bg-white w-full max-w-md p-5 pb-6 relative flex flex-col justify-start min-h-[500px]"
            >
              <TaiwanMap
                birdsList={birdsList}
                activeBird={activeBird}
                onSelectBird={(index) => {
                  handleSelectBird(index);
                }}
                observedList={observedList}
                isMuted={isMuted}
              />
            </div>
          )}

          {/* Quick jump step selectors */}
          <div className="flex justify-between items-center w-full max-w-md mt-4 px-2">
            <button
              onClick={() => {
                const currentFilteredIndex = filteredBirds.findIndex(b => b.id === birdsList[activeBirdIndex].id);
                if (currentFilteredIndex !== -1) {
                  const prevFilteredIndex = Math.max(0, currentFilteredIndex - 1);
                  const prevBird = filteredBirds[prevFilteredIndex];
                  if (prevBird) {
                    const fullIndex = birdsList.findIndex(b => b.id === prevBird.id);
                    handleSelectBird(fullIndex);
                  }
                }
              }}
              disabled={filteredBirds.length <= 1 || filteredBirds.findIndex(b => b.id === birdsList[activeBirdIndex].id) <= 0}
              className="sketch-button-secondary text-xs py-1 px-3.5 flex items-center gap-1.5 disabled:opacity-40 font-bold"
              id="prev-bird-arrow"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 上一種 Prev (L)
            </button>
            <span className="text-xs font-serif font-bold text-stone-500">
              第 {activeBirdIndex + 1} 種 共有 32 種
            </span>
            <button
              onClick={() => {
                const currentFilteredIndex = filteredBirds.findIndex(b => b.id === birdsList[activeBirdIndex].id);
                if (currentFilteredIndex !== -1) {
                  const nextFilteredIndex = Math.min(filteredBirds.length - 1, currentFilteredIndex + 1);
                  const nextBird = filteredBirds[nextFilteredIndex];
                  if (nextBird) {
                    const fullIndex = birdsList.findIndex(b => b.id === nextBird.id);
                    handleSelectBird(fullIndex);
                  }
                }
              }}
              disabled={filteredBirds.length <= 1 || filteredBirds.findIndex(b => b.id === birdsList[activeBirdIndex].id) >= filteredBirds.length - 1}
              className="sketch-button-secondary text-xs py-1 px-3.5 flex items-center gap-1.5 disabled:opacity-40 font-bold"
              id="next-bird-arrow"
            >
              下一種 Next (R) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </section>

        {/* RIGHT COLUMN: REVEALED FIELD NOTEBOOK CARD (7 Cols) */}
        <section className="lg:col-span-7 w-full h-full flex flex-col">
          
          <div 
            id="ecosystem-journal-sheet"
            className="sketch-border-lg bg-[#FDFBF7] flex-1 p-6 relative flex flex-col justify-between min-h-[480px] overflow-hidden"
          >
            {/* Lined Notebook Pattern Sheet Background */}
            <div 
              className="absolute inset-0 opacity-[0.25] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(#e5dbcb 1px, transparent 1px)',
                backgroundSize: '100% 24px',
                backgroundPosition: '0 16px'
              }}
            />

            {/* RED WAX PRINTED / RECORDED INK STAMP BADGE */}
            {isCurrentlyObserved && (
              <div 
                id="recorded-stamp-badge"
                className="absolute top-10 right-8 transform rotate-12 scale-110 z-20 pointer-events-none animate-ping-once"
              >
                {customDrawings[activeBird.id] ? (
                  <div className="border-[4px] border-double border-amber-800 rounded-xl px-3.5 py-1.5 flex flex-col items-center justify-center bg-[#FDFBF7]/98 shadow p-1">
                    <span className="text-amber-800 font-serif font-black tracking-wide text-xs leading-tight">
                      著者手稿
                    </span>
                    <span className="text-[8px] text-amber-900 font-mono leading-none mt-0.5">AUTHOR ORIGINAL</span>
                  </div>
                ) : (
                  <div className="border-[4px] border-double border-red-700/80 rounded-xl px-4 py-1 flex flex-col items-center justify-center bg-[#FDFBF7]/95 shadow p-1">
                    <span className="text-red-700 font-serif font-black tracking-widest text-sm leading-tight">已觀測</span>
                    <span className="text-[9px] text-[#A30000] font-mono leading-none mt-0.5">FORMOSA RECORD</span>
                  </div>
                )}
              </div>
            )}

            {/* Core Card Section info */}
            <div className="z-10 w-full flex flex-col justify-between h-full">
              
              {/* Card Meta Stamp */}
              <div className="flex justify-between items-start border-b border-[#E1D8CB] pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#B08A5E] block">
                    BIOLOGICAL INVESTIGATION RECORD REGISTERED
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                    <span className="text-xs font-mono bg-[#9c8470] text-stone-100 px-2 py-0.5 rounded font-black">
                      No. {activeBird.id.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xl md:text-2xl font-bold font-serif text-[#4A3C31]">
                      {renderAnnotatedName(activeBird.name)}
                    </span>

                    {/* Interactive Real-Time Endemic Bird Sound Call Generator */}
                    <button
                      onClick={() => playBirdSound(activeBird.id)}
                      className="bg-[#EFE6D5] hover:bg-[#E5DBC7] text-[#5C4D3C] text-[11px] font-sans font-bold py-1 px-2.5 rounded-full flex items-center gap-1 border border-[#D2C5AF] transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                      title="點擊模擬聆聽該特有種鳥類的清脆野外啼鳴叫聲"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#A0522D]" />
                      <span>聆聽鳴聲 Call</span>
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-stone-400 font-bold block">COLLECTED INDEX</span>
                  <span className="text-xs font-mono font-extrabold text-[#756858]">
                    {isCurrentlyObserved ? 'SUCCESSFUL (已歸檔)' : 'UNLOCKED PENDING (待拍攝)'}
                  </span>
                </div>
              </div>

              {/* Taxonomic Standardized Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                
                <div className="bg-[#FAF7F0] p-2 sketch-border-sm shadow-none">
                  <span className="text-[9px] text-stone-400 font-mono block">LATIN 學名</span>
                  <span className="text-xs font-serif font-bold italic text-stone-700 block truncate" title={activeBird.scientificName}>
                    {activeBird.scientificName}
                  </span>
                </div>

                <div className="bg-[#FAF7F0] p-2 sketch-border-sm shadow-none">
                  <span className="text-[9px] text-stone-400 font-mono block">ENGLISH 英文</span>
                  <span className="text-xs font-serif font-bold text-stone-700 block truncate" title={activeBird.englishName}>
                    {activeBird.englishName}
                  </span>
                </div>

                <div className="bg-[#FAF7F0] p-2 sketch-border-sm shadow-none">
                  <span className="text-[9px] text-stone-400 font-mono block">CONSERVATION 等級</span>
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <span 
                      className="w-1.5 h-1.5 rounded-full inline-block shrink-0" 
                      style={{
                        backgroundColor: activeBird.conservation.includes("第二級") ? "#D97706" : activeBird.conservation.includes("第三級") ? "#BF7356" : "#65A30D"
                      }}
                    />
                    <span className="truncate">{activeBird.conservation}</span>
                  </span>
                </div>

                <div className="bg-[#FAF7F0] p-2 sketch-border-sm shadow-none">
                  <span className="text-[9px] text-stone-400 font-mono block">HABITAT CORRIDOR</span>
                  <span className="text-xs font-serif font-bold text-stone-700 block truncate">
                    {activeBird.elevation}
                  </span>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5 items-stretch font-serif">
                
                {/* STORY & COLD TRIVIA */}
                <div className="md:col-span-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-wider text-[#A0522D] mb-1.5 flex flex-col items-start leading-tight">
                      <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 fill-[#DF5D50]/20" /> 生態冷知識</span>
                      <span className="text-[9px] font-sans text-stone-400 font-normal ml-5">Ecological Trivia</span>
                    </h3>
                    <div className="text-sm text-stone-600 font-serif leading-relaxed bg-[#FFFDFC] p-3 sketch-border-sm min-h-[100px] shadow-none">
                      {isCurrentlyObserved ? (
                        <>
                          <p className="mb-2">{activeBird.trivia}</p>
                          <p className="text-xs text-stone-500 font-sans border-t border-dotted border-stone-200 pt-1.5 leading-relaxed">{BIRD_TRANSLATIONS_EN[activeBird.id]?.trivia}</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 text-[#C0564C] font-bold">【偵測未啟用 Sighting Locked】</p>
                          <p className="mb-1">請先將相機鏡頭手動對焦在鳥羽上並按下快門，採集成功後即可解鎖此特有種鳥類的特色野外冷知識與家族故事。</p>
                          <p className="text-xs text-stone-400 font-sans leading-relaxed">Adjust your lens focus ring in the viewfinder until the avian details are crisp, then capture the shot to unlock the species' rich family story and ecological trivia.</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-[#A0522D] mb-1.5 flex flex-col items-start leading-tight">
                      <span className="flex items-center gap-1"><Compass className="w-3.5 h-3.5" /> 實地觀察指南</span>
                      <span className="text-[9px] font-sans text-stone-400 font-normal ml-5">Field Sighting Guide</span>
                    </h3>
                    <div className="text-sm text-stone-600 font-serif leading-relaxed bg-[#FFFDFC] p-3 sketch-border-sm min-h-[90px] shadow-none">
                      {isCurrentlyObserved ? (
                        <>
                          <p className="mb-2">{activeBird.guide}</p>
                          <p className="text-xs text-stone-500 font-sans border-t border-dotted border-stone-200 pt-1.5 leading-relaxed">{BIRD_TRANSLATIONS_EN[activeBird.id]?.guide}</p>
                        </>
                      ) : (
                        <>
                          <p className="mb-2 text-[#C0564C] font-bold">【觀測未解碼 Sighting Locked】</p>
                          <p className="mb-1">成功按下快門擷取照片後，此處將解密呈現賞鳥達人所撰寫的臺灣山林實地觀察指南，揭示最佳尋蹤點位、氣象條件與鳴叫旋律特徵。</p>
                          <p className="text-xs text-stone-400 font-sans leading-relaxed">Capture a clear snapshot of this bird to read field sighting coordinates, weather conditions, forest calling whistles, and micro-behavior insights curated by expert ornithologists.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* VISUAL ALTITUDE CORRIDOR GRAPH (4 Cols) */}
                <div className="md:col-span-4 bg-[#FAF7F0] sketch-border-sm p-3.5 flex flex-col justify-between relative overflow-hidden shadow-none min-h-[220px]">
                  
                  {/* Contour Topographical lines & mountain silhouette watermark background */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.22] overflow-hidden mix-blend-multiply z-0">
                    <svg className="w-full h-full" viewBox="0 0 300 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Mountain silhouettes */}
                      <path d="M 0,220 L 0,150 Q 50,110 100,140 T 200,90 T 300,70 L 300,220 Z" fill="#D9CEBC" opacity="0.35" />
                      <path d="M 0,220 L 0,175 Q 70,135 140,155 T 280,105 T 300,115 L 300,220 Z" fill="#CBBFAC" opacity="0.45" />
                      
                      {/* Stylized topographic contour lines */}
                      <path d="M -20,200 C 60,180 120,230 320,190" fill="none" stroke="#8C765C" strokeWidth="0.8" strokeDasharray="3 4" />
                      <path d="M -20,165 C 50,135 150,195 320,145" fill="none" stroke="#8C765C" strokeWidth="0.6" />
                      <path d="M -20,125 C 70,85 130,155 320,105" fill="none" stroke="#8C765C" strokeWidth="0.6" strokeDasharray="1 3" />
                      <path d="M -20,85 C 80,45 170,115 320,55" fill="none" stroke="#8C765C" strokeWidth="0.5" />
                      <path d="M -20,45 C 90,15 160,75 320,25" fill="none" stroke="#8C765C" strokeWidth="0.4" strokeDasharray="2 2" />
                      
                      {/* Minimalist Topo elevations label */}
                      <text x="15" y="25" fill="#8C765C" fontSize="5px" fontFamily="monospace" opacity="0.6">CONTOUR INT: 100m</text>
                      
                      {/* Little decorative compass or peaks indicator */}
                      <g transform="translate(265, 40)" opacity="0.5">
                        <circle cx="0" cy="0" r="10" fill="none" stroke="#8C765C" strokeWidth="0.6" strokeDasharray="2 1" />
                        <line x1="0" y1="-14" x2="0" y2="14" stroke="#8C765C" strokeWidth="0.4" />
                        <line x1="-14" y1="0" x2="14" y2="0" stroke="#8C765C" strokeWidth="0.4" />
                        <text x="-2.5" y="-15" fill="#8C765C" fontSize="6px" fontFamily="serif" fontWeight="bold">N</text>
                      </g>
                    </svg>
                  </div>

                  <div className="mb-2 relative z-10">
                    <span className="text-[9px] text-[#A08568] font-mono leading-none font-bold flex flex-col items-start gap-0.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 山川海拔分佈圖</span>
                      <span className="text-[8px] text-stone-400 font-sans font-normal ml-4">Habitat Elevation Chart</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-serif block mt-1">Habitat Elevation Corridor</span>
                  </div>

                  {/* Visual mountain wireframe column bars */}
                  <div className="relative z-10 flex-1 flex flex-col justify-between px-1 border-l-2 border-[#D9CEBC]/60 py-1.5 text-[9px] font-mono">
                    <div className="flex justify-between items-center text-stone-400">
                      <span>3,900m 雪線高山 Alpine</span>
                      <span>雪山主峰 Mt. Xue Peak</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-stone-400">
                      <span>2,800m 針葉鐵杉 Subalpine</span>
                      <span>合歡山大雪山 Mt. Hehuan & Daxue</span>
                    </div>

                    <div className="flex justify-between items-center text-[#907A65]">
                      <span>1,500m 溫帶檜木 Montane</span>
                      <span>溪頭阿里山 Xitou & Alishan</span>
                    </div>

                    <div className="flex justify-between items-center text-stone-400">
                      <span>500m 闊葉疏林 Lowland</span>
                      <span>陽明山平原 Yangmingshan & Plains</span>
                    </div>

                    {/* Indicator Active Altitude Zone Shimmer block */}
                    {renderAltitudeIndicatorBar(activeBird.elevation)}
                  </div>

                  <div className="text-[10px] text-stone-500 font-serif mt-2 border-t border-stone-200/60 pt-2 text-center flex flex-col gap-0.5 relative z-10">
                    <div>主要棲息地層 Primary Habitat:</div>
                    <div className="font-extrabold text-[#78350F] leading-snug">{activeBird.habitat}</div>
                    <div className="text-[9px] text-stone-400 font-sans leading-tight mt-0.5">{BIRD_TRANSLATIONS_EN[activeBird.id]?.habitat}</div>
                  </div>
                </div>

              </div>

              {/* CARD FOOTER NOTATIONS */}
              <div className="border-t border-[#E5DACB] pt-3 mt-2 flex justify-center text-[10px] font-mono text-stone-400">
                <span>FIELD JOURNAL OF TAIWAN’S ENDEMIC BIRDS</span>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* BOTTOM INSTRUCTION HEADER */}
      <section className="max-w-6xl mx-auto w-full mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#D9D0C1]/75 pt-3.5 px-2">
        <div className="flex gap-2.5 items-start">
          <Eye className="w-5 h-5 text-[#BF7356] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs font-serif font-black text-stone-700 leading-snug">
              觀測手卷列陣 左右拖動與滾動即可快速切換鳥類
            </h4>
            <p className="text-[10px] text-stone-400 font-sans font-medium">
              Drag or scroll to select species and unlock observation
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 items-start md:justify-end text-left md:text-right">
          <div className="flex flex-col gap-0.5 md:items-end">
            <h4 className="text-xs font-serif font-bold text-stone-600 leading-snug">
              提示：可使用鍵盤 ◄ ► 鍵切換，按空白鍵可快速對焦拍照
            </h4>
            <p className="text-[10px] text-stone-400 font-sans font-medium">
              Tip: Use keyboard ◄ ► to switch, Spacebar to trigger shutter
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM SCROLL SNAP CAROUSEL */}
      <section className="max-w-6xl mx-auto w-full z-10 p-1">
        <div className="relative">
          
          {/* Edge fading gradient mask overlays to make the carousel look like a rolls-of-parchment ledger scroll */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F3ECE0] via-[#F3ECE0]/70 to-transparent pointer-events-none z-20" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F3ECE0] via-[#F3ECE0]/70 to-transparent pointer-events-none z-20" />

          {/* Scroll List View Wrapper */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className="flex gap-4 overflow-x-auto pb-4 pt-2 scroll-smooth snap-x snap-mandatory focus:outline-none select-none scrollbar-thin scrollbar-thumb-stone-300 cursor-grab active:cursor-grabbing"
            style={{
              scrollbarWidth: 'thin',
              // Dynamic inline styling to allow easy horizontal scroll
            }}
            id="snap-carousel-slider"
          >
            {/* INVISIBLE PADDING SPACERS AT START (so first bird can be centered) */}
            <div className="shrink-0 w-[42%] md:w-[46%]" />

            {/* Render 32 Birds Carousel Card elements */}
            {filteredBirds.length === 0 ? (
              <div 
                className="carousel-item shrink-0 w-64 md:w-72 snap-center bg-[#FFFDFC] border border-[#D2C6B6] p-4 text-center flex flex-col justify-center items-center font-serif text-[#4A3C31] shadow-none"
                style={{ borderRadius: '12px 140px 15px 130px/110px 15px 140px 12px' }}
              >
                <div className="bg-[#FAF6EE] p-2.5 rounded-full border border-[#8C765C]/20 mb-2">
                  <Compass className="w-6 h-6 text-amber-800 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <h5 className="text-xs font-black text-[#5C4D3E]">無符合條件的飛羽紀錄</h5>
                <p className="text-[10px] text-stone-400 mt-1 font-sans leading-relaxed max-w-[200px]">
                  {filterMode === 'observed' 
                    ? '您尚未採集任何鳥類圖鑑。請在觀景窗中手動調焦並按下快門，或點擊下方按鈕切換回「全部」。' 
                    : filterMode === 'unobserved' 
                      ? '恭喜！您已完成並解鎖全部 32 種特有種野生飛羽手札記錄！' 
                      : '未找到相符俗名、學名或海拔。請清空搜尋框再試。'}
                </p>
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => {
                      triggerClickSound();
                      setFilterMode('all');
                      setSearchQuery('');
                    }}
                    className="text-[9.5px] px-3 py-1.5 bg-[#8C765C] hover:bg-[#78644e] text-white rounded-md font-sans font-bold transition-all cursor-pointer shadow-none"
                  >
                    切換至全部觀看 View All
                  </button>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        triggerClickSound();
                        setSearchQuery('');
                      }}
                      className="text-[9.5px] px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 rounded-md font-sans font-bold transition-all cursor-pointer"
                    >
                      清除搜尋 Clear Search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredBirds.map((bird, idx) => {
                const isBirdActive = birdsList[activeBirdIndex].id === bird.id;
                const isBirdObserved = observedList.includes(bird.id);
                
                // Determine tilting layout for each unselected Polaroid to make them look naturally scattered!
                const tiltClass = isBirdActive 
                  ? 'scale-110 -translate-y-2.5 z-20 rotate-0 shadow-none' 
                  : `${
                      bird.id % 4 === 0 
                        ? '-rotate-3 hover:rotate-0' 
                        : bird.id % 4 === 1 
                          ? 'rotate-2 hover:rotate-0' 
                          : bird.id % 4 === 2 
                            ? '-rotate-1' 
                            : 'rotate-3 hover:rotate-0'
                    } opacity-75 hover:opacity-100 hover:scale-105 z-10 shadow-none`;

                return (
                  <div
                    key={bird.id}
                    onClick={() => {
                      const matchedIdx = birdsList.findIndex(b => b.id === bird.id);
                      if (matchedIdx !== -1) {
                        handleSelectBird(matchedIdx);
                      }
                    }}
                    className={`carousel-item shrink-0 w-24 md:w-28 snap-center cursor-pointer transition-all duration-300 transform select-none ${tiltClass}`}
                  >
                    {/* Polaroid Frame with narrow top/side boundaries and a wide bottom Sharpie-note area */}
                    <div 
                      className={`p-2 pb-5 transition-all duration-300 sketch-frame-polaroid ${
                        isBirdActive 
                          ? '!bg-[#FFFDF4] !border-2 !border-[#BF7356] shadow-[4px_5px_0px_rgba(191,115,86,0.25)]' 
                          : 'bg-white hover:border-stone-400 border border-[#D2C6B6]'
                      }`}
                    >
                      
                      {/* Thumbnail SVG representation */}
                      <div className={`aspect-square w-full rounded border overflow-hidden relative flex items-center justify-center p-0.5 transition-colors ${
                        isBirdActive 
                          ? 'bg-white border-[#BF7356]/30' 
                          : 'bg-[#FAF9F5] border-stone-200/80'
                      } shadow-[inset_1px_1.5px_3px_rgba(92,77,60,0.06)]`}>
                        <div className="w-11/12 h-11/12">
                          <BirdSvg 
                            bird={bird} 
                            isSilhouette={!isBirdObserved} 
                            customDrawingUrl={customDrawings[bird.id]}
                          />
                        </div>

                        {/* Micro Observed or Hand Drawing Indicator hook */}
                        {customDrawings[bird.id] ? (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-800 rounded font-serif text-[7.5px] text-white font-extrabold max-h-[14px] flex items-center justify-center scale-90 leading-none">
                            手稿
                          </div>
                        ) : isBirdObserved ? (
                          <div 
                            className="absolute top-1 right-1 w-5 h-5 bg-[#FAF6EE] border-2 border-[#BF4040] flex items-center justify-center text-[#BF4040] shadow-sm transform rotate-6 scale-95" 
                            style={{ borderRadius: '78px 12px 65px 15px/15px 70px 10px 85px' }}
                            title="已觀測 Unlocked"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
                          </div>
                        ) : null}
                      </div>

                      {/* Taxonomy Index & stamp */}
                      <div className="mt-2 text-center text-[10px]">
                        <span className={`font-mono px-1.5 py-0.5 rounded text-[8.5px] inline-block font-extrabold leading-none ${
                          isBirdActive 
                            ? 'bg-[#BF7356]/15 text-[#BF7356] font-black' 
                            : 'text-stone-400 font-bold'
                        }`}>
                          No. {bird.id.toString().padStart(2, '0')}
                        </span>
                        <span className={`font-serif block font-bold mt-1 text-[11px] leading-tight break-words whitespace-normal min-h-[1.5rem] flex items-center justify-center ${
                          isBirdActive ? 'text-[#BF7356] font-extrabold' : 'text-[#4A3C31]'
                        }`}>
                          {isBirdObserved ? renderAnnotatedName(bird.name) : '???'}
                        </span>
                        <span className="text-[8px] font-mono text-stone-400 block leading-none mt-1">
                          {bird.elevation.split('-')[0].trim()}
                        </span>
                      </div>

                    </div>
                  </div>
                );
              })
            )}

            {/* INVISIBLE PADDING SPACERS AT END (so last bird can be centered) */}
            <div className="shrink-0 w-[42%] md:w-[46%]" />

          </div>

          {/* Left / Right Carousel quick edge navigation indicators */}
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 pointer-events-none hidden md:flex items-center justify-center pl-1 z-30">
            <div className="bg-[#FAF6EE]/90 border border-stone-200/80 w-7 h-7 rounded-full shadow text-stone-500 flex items-center justify-center font-bold text-sm animate-pulse">
              ◄
            </div>
          </div>
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none hidden md:flex items-center justify-center pr-1 z-30">
            <div className="bg-[#FAF6EE]/90 border border-stone-200/80 w-7 h-7 rounded-full shadow text-stone-500 flex items-center justify-center font-bold text-sm animate-pulse">
              ►
            </div>
          </div>

        </div>
      </section>

      </>
      )}

      {/* FOOTER LICENSE STATEMENTS */}
       <footer className="max-w-6xl mx-auto w-full text-center text-[9px] font-mono text-stone-400/80 mt-6 border-t border-[#D9D0C1] pt-3 z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 臺灣特有種鳥類生態觀測局 | Formosan Endemic Birds Field Investigator</span>
      </footer>

      {/* CUSTOM 2-STEP RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-[#FAF6EE] max-w-md w-full rounded-2xl border-[3px] border-double border-[#8C765C] p-6 shadow-2xl relative font-serif text-[#453629] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Vintage notebook page border overlay */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-700 via-amber-800 to-[#8C765C]" />
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="bg-red-50 p-3 rounded-full border border-red-200/60 mb-4 animate-bounce">
                <AlertTriangle className="w-7 h-7 text-[#BF4040]" />
              </div>
              <h3 className="text-base font-black tracking-wide text-[#3D2C1F] mb-2 font-serif">
                本手札將遺忘所有探險歷程
              </h3>
              <p className="text-xs text-[#736353] leading-relaxed mb-6 font-sans">
                這項操作將會<b>完全清除</b>您辛苦觀測、對焦、拍攝的所有生態觀察相片與合焦紀錄，並<b>清空您親自創作的所有色鉛筆手寫羽毛手稿</b>。<br />
                <span className="text-red-700 font-bold block mt-2 text-[11px]">本動作具有不可逆性，您確定要重回新手狀態重新探索嗎？</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  triggerClickSound();
                  setShowResetConfirm(false);
                }}
                className="group w-full py-2.5 px-4 rounded-xl bg-[#DDD3C4]/60 hover:bg-[#D3C7B6] text-[#453629] border border-[#C6BBA8] transition-all text-xs cursor-pointer font-bold font-serif flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>再想想 (保留進度)</span>
              </button>
              <button
                onClick={executeResetProgress}
                className="group w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#BF4040] to-red-700 hover:from-[#A83232] hover:to-red-800 text-white border-b-4 border-red-900 transition-all text-xs cursor-pointer font-bold font-serif flex items-center justify-center shadow active:scale-95 active:border-b-0"
              >
                <span>確定二度確認（重置）</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Altitude highlighter bounding generator based on coordinates mapping representation
function renderAltitudeIndicatorBar(elevationStr: string) {
  // Parse ranges like "1,800m - 3,300m" or "300m - 1,200m"
  const digits = elevationStr.replace(/,/g, '').match(/\d+/g);
  if (!digits || digits.length < 2) return null;

  const min = parseInt(digits[0], 10);
  const max = parseInt(digits[1], 10);

  // Map elevation scale: 0 meters (bottom = 100%) to 3950 meters (top = 0%)
  const topPercent = Math.max(0, Math.min(95, (1 - (max / 3950)) * 100));
  const bottomPercent = Math.max(0, Math.min(95, (1 - (min / 3950)) * 100));

  const heightPercent = Math.max(6, bottomPercent - topPercent);

  return (
    <div 
      className="absolute left-0 w-2.5 rounded-r bg-gradient-to-b from-[#DF7F60]/90 to-[#BF4040]/90 shadow-sm animate-pulse"
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        borderLeft: '2px solid #9A3412',
      }}
      title={`活躍海拔分佈: ${elevationStr}`}
    />
  );
}