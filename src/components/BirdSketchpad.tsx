/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Bird } from '../types';
import { BirdSvg } from '../BirdSvg';
import { 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Check, 
  Eye, 
  EyeOff, 
  Info,
  ChevronDown
} from 'lucide-react';

interface BirdSketchpadProps {
  bird: Bird;
  onSave: (dataUrl: string | null) => void;
  onClose: () => void;
  initialDrawing: string | null;
}

const PENCIL_SWATCHES = [
  // ── 炭黑與岩礦泥色 ──
  { name: '石墨炭黑 (Graphite Black)', value: '#1C1917' },
  { name: '暖石泥灰 (Slate Gray)', value: '#57534E' },
  { name: '枯木深褐 (Bark Brown)', value: '#451A03' },
  { name: '秋栗黃棕 (Chestnut Brown)', value: '#78350F' },
  { name: '拿鐵赭石 (Ochre Brown)', value: '#B45309' },
  { name: '荒漠黃砂 (Desert Ochre)', value: '#D97706' },

  // ── 花卉與暖陽系 ──
  { name: '硃砂緋紅 (Cinnabar Red)', value: '#EF4444' },
  { name: '胭脂深紅 (Crimson Red)', value: '#B91C1C' },
  { name: '櫻花粉紅 (Sakura Pink)', value: '#FBCFE8' },
  { name: '秋烈落橘 (Warm Orange)', value: '#F97316' },
  { name: '金盞花黃 (Marigold Yellow)', value: '#FBBF24' },
  { name: '晨曦亮黃 (Lemon Yellow)', value: '#FEF08A' },

  // ── 山林與草木翠色 ──
  { name: '春芽嫩綠 (Sprout Green)', value: '#4ADE80' },
  { name: '玉山青苔 (Moss Green)', value: '#10B981' },
  { name: '冷杉深綠 (Deep Forest)', value: '#064E3B' },
  { name: '薄荷湖綠 (Mint Teal)', value: '#2DD4BF' },
  { name: '山林葉綠 (Olive Green)', value: '#4D7C0F' },
  { name: '竹青淺綠 (Bamboo)', value: '#A3E635' },

  // ── 晴風天空與藍夜 ──
  { name: '清晨晴空 (Sky Blue)', value: '#38BDF8' },
  { name: '高山湖水 (Mountain Lake)', value: '#06B6D4' },
  { name: '群青深海 (Ultramarine Blue)', value: '#1D4ED8' },
  { name: '靛藍星空 (Indigo Night)', value: '#1E3A8A' },
  { name: '紫藤花紫 (Wisteria Violet)', value: '#A78BFA' },
  { name: '野薑粉白 (Paper White)', value: '#F5F5F4' },
];

export const BirdSketchpad: React.FC<BirdSketchpadProps> = ({ 
  bird, 
  onSave, 
  onClose,
  initialDrawing 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(bird.accentColor || '#1C1917');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  
  // Custom colors storage loaded from localStorage (persists drawings colors)
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sketchpad_saved_colors');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Fallback
    }
    // Pre-populate with beautiful, natural specimen watercolor tones
    return ['#BF564E', '#4E8CBF', '#6EBF4E', '#D1A334', '#7D5BA6'];
  });

  // Undo dynamic canvas state states
  const [history, setHistory] = useState<string[]>([]);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Dynamic bird plumage custom color palettes
  const birdPlumages = [
    { name: '身體羽色', value: bird.bodyColor },
    { name: '胸腹羽色', value: bird.chestColor },
    { name: '翅翼羽色', value: bird.wingColor },
    { name: '特有飾色', value: bird.accentColor }
  ].filter((v, i, a) => v.value && a.findIndex(t => t.value === v.value) === i);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal square canvas dimension coordinates
    canvas.width = 480;
    canvas.height = 480;

    // Default configuration for smoother drawing paths
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load initial drawing image if exists
    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 480, 480);
      };
      img.src = initialDrawing;
    }
  }, [initialDrawing, bird.id]);

  // Save current selected color to custom list
  const handleSaveCustomColor = (colorToSave: string) => {
    const cleanColor = colorToSave.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/i.test(cleanColor)) return;
    
    if (savedColors.includes(cleanColor)) return;
    const newColors = [cleanColor, ...savedColors.slice(0, 11)]; // keep max 12
    setSavedColors(newColors);
    try {
      localStorage.setItem('sketchpad_saved_colors', JSON.stringify(newColors));
    } catch (e) {
      // ignore
    }
  };

  // Push present state to undo history stack
  const saveToHistory = (c: HTMLCanvasElement) => {
    const dataUrl = c.toDataURL();
    setHistory(prev => [...prev.slice(-15), dataUrl]); // Max 15 undos
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 480, 480);

    const prevStates = [...history];
    const targetState = prevStates.pop(); // Pop latest state
    setHistory(prevStates);

    if (targetState) {
      const img = new Image();
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, 480, 480);
      };
      img.src = targetState;
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveToHistory(canvas);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 480, 480);
    }
    setShowConfirmClear(false);
  };

  // Coordinates mapping
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  // Drawing event triggers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getCoords(e);
    if (!pos || !canvasRef.current) return;

    setIsDrawing(true);
    setLastPos(pos);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      saveToHistory(canvas);

      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        // High fidelity colored pencil spot on click/tap init
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        
        // 1. Draw a soft base circle represent wax anchor
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, brushSize * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // 2. Sprinkle grainy lead spots to emulate rough paper texture
        ctx.globalAlpha = 0.45;
        const count = brushSize < 6 ? 4 : brushSize < 12 ? 8 : 14;
        for (let p = 0; p < count; p++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.pow(Math.random(), 1.4) * (brushSize * 0.5);
          const px = pos.x + Math.cos(angle) * dist;
          const py = pos.y + Math.sin(angle) * dist;
          const size = Math.random() * 1.3 + 0.4; // tiny granular grains
          
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCoords(e);
    if (!pos || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else {
        // High Fidelity Textured Colored Pencil (色鉛筆) line logic:
        ctx.globalCompositeOperation = 'source-over';
        
        // 1. Draw a very light transparent lead binder core
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 0.75;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.25; 
        ctx.beginPath();
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        // 2. Draw textured sketchy grains along the line segment
        const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
        const stepSize = Math.max(1.5, brushSize * 0.2); 
        const steps = Math.floor(dist / stepSize);
        
        ctx.globalAlpha = 0.48; // crisp look
        for (let i = 0; i <= steps; i++) {
          const t = steps === 0 ? 0 : i / steps;
          const cx = lastPos.x + (pos.x - lastPos.x) * t;
          const cy = lastPos.y + (pos.y - lastPos.y) * t;
          
          // Random scatter points around the stroke path dependent on brush thickness
          const sprinkleCount = brushSize < 6 ? 2 : brushSize < 12 ? 4 : 7;
          for (let p = 0; p < sprinkleCount; p++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.pow(Math.random(), 1.6) * (brushSize * 0.52);
            const px = cx + Math.cos(angle) * distance;
            const py = cy + Math.sin(angle) * distance;
            const size = Math.random() * 1.35 + 0.45; // paper tooth lead grain
            
            ctx.fillStyle = brushColor;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      setLastPos(pos);
    }
  };

  const handleEnd = () => {
    setIsDrawing(false);
  };

  // Export
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if the canvas is empty (to see if they drew anything)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dataUrl = canvas.toDataURL();
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* 1. Drawing Canvas Area with Tracer Guide Layer under */}
      <div 
        className="aspect-square w-full sketch-border-md relative overflow-hidden bg-[#FAF9F5]"
        style={{ touchAction: 'none' }}
      >
        {/* Underlay Guide Silhouette */}
        {showGuide && (
          <div className="absolute inset-0 opacity-[0.14] pointer-events-none flex items-center justify-center scale-[0.88] select-none transition-opacity">
            <BirdSvg bird={bird} isSilhouette={false} />
          </div>
        )}

        {/* Paper texture overlay under painting */}
        <div 
          className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Dynamic Crayon Sketch filter applied directly to the rendering canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full cursor-pencil"
          style={{ filter: 'url(#crayon-sketch)' }}
        />

        {/* Mini Outline Toggle */}
        <button
          onClick={() => setShowGuide(prev => !prev)}
          className="absolute top-2.5 right-2.5 bg-white/95 text-stone-700 hover:bg-stone-50 text-[10.5px] font-sans font-bold py-1 px-2.5 rounded shadow-sm border border-stone-200 transition-all cursor-pointer flex items-center"
          title={showGuide ? "隱藏描圖導引" : "開啟描圖導引"}
        >
          <span>{showGuide ? "隱藏底圖" : "顯示底圖"}</span>
        </button>

        {/* Quick Help Pop in Corner */}
        <div className="absolute bottom-2.5 left-2.5 opacity-90 font-sans pointer-events-none bg-stone-900/10 scale-90 text-[10px] text-stone-600 px-2 py-0.5 rounded flex items-center">
          <span>仿色鉛筆顆粒筆觸（支援數壓與滑鼠）</span>
        </div>
      </div>

      {/* 2. Controls Section */}
      <div className="mt-3 flex flex-col gap-2 bg-[#FAF6EE] p-3 sketch-border-md font-sans">
        
        {/* Colors Picker */}
        <div>
          <div className="flex justify-between items-center text-[11px] text-stone-500 font-medium mb-1.5 flex-wrap gap-1">
            <span className="flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 inline-block" />
              山林野羽學色鉛筆組 (Fine Colored Pencils)
            </span>
            <span className="text-stone-400">極細色芯與仿真顆粒質感</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {/* Standard Pencils grid */}
            <div className="grid grid-cols-12 gap-1 h-auto bg-stone-100/60 p-1.5 sketch-border-sm">
              {PENCIL_SWATCHES.map(swatch => (
                <button
                  key={swatch.value}
                  onClick={() => {
                    setBrushColor(swatch.value);
                    setIsEraser(false);
                  }}
                  className={`w-5 h-5 rounded-full border shadow-sm transition-all relative shrink-0 ${
                    brushColor === swatch.value && !isEraser
                      ? 'scale-110 border-stone-800 ring-2 ring-stone-950/20'
                      : 'border-stone-300 hover:scale-110'
                  }`}
                  style={{ backgroundColor: swatch.value }}
                  title={swatch.name}
                >
                  {brushColor === swatch.value && !isEraser && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${swatch.value === '#F5F5F4' ? 'bg-stone-900' : 'bg-white'}`} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* COLOR WHEEL & SAVED CUSTOM COLORS BAR (色彩輪與儲存色彩) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-1 bg-[#FAF4E5] p-2 rounded-lg border border-[#E9DFCB]">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-black text-[#8C765C] shrink-0">🎨 色彩輪:</span>
                <div className="relative flex items-center gap-1.5">
                  <label className="relative cursor-pointer group flex items-center justify-center shrink-0">
                    <input 
                      type="color" 
                      value={brushColor}
                      onChange={(e) => {
                        setBrushColor(e.target.value);
                        setIsEraser(false);
                      }}
                      className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                    />
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-stone-400 shadow-sm group-hover:scale-105 transition-all" 
                      style={{ 
                        background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' 
                      }} 
                      title="點此打開色彩調色輪 (Choose Custom Color)"
                    />
                  </label>
                  
                  <input 
                    type="text"
                    value={brushColor}
                    onChange={(e) => {
                      setBrushColor(e.target.value);
                      setIsEraser(false);
                    }}
                    className="w-15 text-[9.5px] uppercase font-mono px-1 py-0.5 rounded border border-stone-300 bg-white text-stone-700 font-bold"
                    title="輸入顏色代碼 HEX code"
                  />

                  <button
                    onClick={() => handleSaveCustomColor(brushColor)}
                    className="px-1.5 py-0.5 bg-[#8C765C] hover:bg-[#745E49] text-[#FAF6EE] text-[9px] font-bold rounded shadow-sm transition-all cursor-pointer whitespace-nowrap active:translate-y-0.5"
                    title="儲存此自訂色至右側珍藏列中"
                  >
                    儲存此色
                  </button>
                </div>
              </div>

              {/* Saved Colors Box */}
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-[9.5px] text-stone-400 font-medium whitespace-nowrap">珍藏色庫:</span>
                <div className="flex gap-1 overflow-x-auto py-0.5 max-w-[170px] sm:max-w-[210px] scrollbar-none">
                  {savedColors.map((color, idx) => (
                    <button
                      key={`${color}-${idx}`}
                      onClick={() => {
                        setBrushColor(color);
                        setIsEraser(false);
                      }}
                      className={`w-4 h-4 rounded-full border shadow-xs relative shrink-0 transition-transform ${
                        brushColor === color && !isEraser
                          ? 'scale-110 border-stone-700 ring-2 ring-stone-900/10'
                          : 'border-stone-250 hover:scale-115'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`使用珍藏色: ${color}`}
                    >
                      {brushColor === color && !isEraser && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white shadow-xs" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Exclusive Plumage matching color row if exists */}
            {birdPlumages.length > 0 && (
              <div className="flex items-center gap-2 mt-1 border-t border-stone-200/60 pt-1.5">
                <span className="text-[10px] text-[#A08568] font-bold shrink-0">這隻鳥的專屬飾色:</span>
                <div className="flex gap-1.5">
                  {birdPlumages.map(plumage => (
                    <button
                      key={plumage.value}
                      onClick={() => {
                        setBrushColor(plumage.value);
                        setIsEraser(false);
                      }}
                      className={`h-5 px-1.5 rounded border text-[9px] font-bold flex items-center gap-1 transition-all ${
                        brushColor === plumage.value && !isEraser
                          ? 'border-stone-800 bg-stone-900 text-white shadow-sm ring-1 ring-stone-950/20'
                          : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: plumage.value }} />
                      {plumage.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Brush config & Action utilities */}
        <div className="flex items-center justify-between gap-3 mt-1.5 border-t border-stone-200/60 pt-2.5">
          
          {/* Sizes and Eraser switches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Draw mode */}
            <button
              onClick={() => setIsEraser(false)}
              className={`py-1 px-2.5 text-xs sketch-button-secondary shrink-0 ${!isEraser ? 'bg-[#8C765C] text-white font-black' : ''}`}
              title="色鉛筆筆刷"
            >
              <span>筆刷</span>
            </button>

            {/* Eraser */}
            <button
              onClick={() => setIsEraser(true)}
              className={`py-1 px-2.5 text-xs sketch-button-secondary shrink-0 ${isEraser ? 'bg-orange-700 text-white font-black' : ''}`}
              title="橡皮擦"
            >
              <span>橡皮擦</span>
            </button>

            <span className="w-[1px] h-4 bg-stone-300 mx-1" />

            {/* Sizes */}
            <div className="flex items-center gap-1 bg-white p-0.5 sketch-border-sm text-xs text-stone-500">
              <button
                onClick={() => setBrushSize(4)}
                className={`px-1.5 py-0.5 rounded font-mono ${brushSize === 4 ? 'bg-stone-200 font-bold text-stone-800' : 'hover:bg-stone-50'}`}
                title="細筆尖"
              >
                細
              </button>
              <button
                onClick={() => setBrushSize(8)}
                className={`px-1.5 py-0.5 rounded font-mono ${brushSize === 8 ? 'bg-stone-200 font-bold text-stone-800' : 'hover:bg-stone-50'}`}
                title="中筆尖"
              >
                中
              </button>
              <button
                onClick={() => setBrushSize(16)}
                className={`px-1.5 py-0.5 rounded font-mono ${brushSize === 16 ? 'bg-stone-200 font-bold text-stone-800' : 'hover:bg-stone-50'}`}
                title="粗筆尖"
              >
                粗
              </button>
            </div>
          </div>

          {/* Undo and Clean canvas */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="py-1 px-2.5 text-xs sketch-button-secondary shrink-0 disabled:opacity-40 text-[#4A3C31]"
              title="遺忘上一步 (Undo)"
            >
              <span>復原</span>
            </button>
            
            {showConfirmClear ? (
              <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded border border-red-200 transition-all shrink-0">
                <span className="text-[9.5px] text-red-700 font-bold px-1 select-none">清除？</span>
                <button
                  onClick={handleClear}
                  className="py-0.5 px-2 text-[9.5px] bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors cursor-pointer"
                  title="確定要全部清除並重新開始"
                >
                  確認
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="py-0.5 px-1.5 text-[9.5px] bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="py-1 px-2.5 text-xs sketch-button-secondary shrink-0 hover:text-red-600 hover:border-red-200 text-stone-600 font-bold"
                title="全部清除"
              >
                <span>清除</span>
              </button>
            )}
          </div>

        </div>

        {/* Close & Finalize row */}
        <div className="grid grid-cols-2 gap-2.5 mt-2 pt-1 border-t border-stone-200/60">
          <button
            onClick={onClose}
            className="py-1.5 sketch-button-secondary text-xs flex items-center justify-center gap-1 font-bold text-stone-700"
          >
            返回觀察
          </button>
          <button
            onClick={handleSave}
            className="py-1.5 sketch-button-primary bg-[#BF7356] hover:bg-[#A86348] text-stone-50 text-xs flex items-center justify-center gap-1 font-black"
          >
            儲存畫作 Save Art
          </button>
        </div>

      </div>

    </div>
  );
};
