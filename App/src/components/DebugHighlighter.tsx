import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readDir, remove, mkdir, exists } from '@tauri-apps/plugin-fs';

// --- Types ---

type EventType = 'hover' | 'click' | 'select' | 'focus';

interface ElementInfo {
  tag: string;
  id: string;
  className: string;
  timestamp: number;
  path: string;
  eventType: EventType;
  computed: {
    outline: string;
    boxShadow: string;
    border: string;
    backgroundColor: string;
    backgroundImage: string;
    filter: string;
    backdropFilter: string;
    transform: string;
    zIndex: string;
    position: string;
    opacity: string;
    display: string;
  };
}

interface Symptom {
  id: string;
  label: string;
  description: string;
  recommendedToggles: string[];
}

const SYMPTOMS: Symptom[] = [
  { id: 'glow', label: 'Glowing / Shining', description: 'Elements have a halo, fuzzy edge, or light emitting from them.', recommendedToggles: ['shadow', 'filter', 'ring'] },
  { id: 'border', label: 'Lines / Borders', description: 'Sharp lines, rectangles, or outlines appear around elements.', recommendedToggles: ['outline', 'border', 'ring'] },
  { id: 'flash', label: 'Flashing / Colors', description: 'Backgrounds change color, flash blue/grey, or highlight on tap.', recommendedToggles: ['tap', 'background', 'selection'] },
  { id: 'glass', label: 'Glass / Blur', description: 'Backgrounds get blurry, frosted, or semi-transparent.', recommendedToggles: ['backdrop', 'filter', 'background'] },
  { id: 'ghost', label: 'Ghost / Highlights', description: 'Faint white/colored backgrounds appearing on elements.', recommendedToggles: ['background', 'selection'] },
  { id: 'move', label: 'Movement / Size', description: 'Elements grow, shrink, bounce, or shift position.', recommendedToggles: ['transform'] },
  { id: 'overlay', label: 'Overlays / Blockers', description: 'Invisible layers blocking clicks or covering content.', recommendedToggles: ['background', 'backdrop'] },
];

const STORAGE_KEY = 'debug_highlighter_config_v5';

// --- Component ---

export default function DebugHighlighter() {
  // --- State: Wizard ---
  const [showWizard, setShowWizard] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).showWizard : true;
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // --- State: Panel Size ---
  const [panelSize, setPanelSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).panelSize || { width: 800, height: 400 } : { width: 800, height: 400 };
  });

  // --- State: Panel Position ---
  const [panelPosition, setPanelPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultPos = { x: 100, y: 100 };
    if (typeof window !== 'undefined') {
       defaultPos.x = (window.innerWidth - 800) / 2;
       defaultPos.y = window.innerHeight - 400;
    }
    return saved ? JSON.parse(saved).panelPosition || defaultPos : defaultPos;
  });

  // --- State: Toggles (Global) ---
  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).toggles : {
      outline: false,
      shadow: false,
      ring: false,
      border: false,
      selection: false,
      tap: false,
      filter: false,
      backdrop: false,
      transform: false,
      background: false,
    };
  });

  // --- State: Targeted Rules (Per-Element) ---
  const [targetedRules, setTargetedRules] = useState<Array<{ selector: string, property: string, value: string }>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).targetedRules : [];
  });

  // --- State: Tracking Config ---
  const [trackHover, setTrackHover] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).trackHover : true;
  });
  const [trackClick, setTrackClick] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).trackClick : true;
  });
  const [trackFocus, setTrackFocus] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).trackFocus : true;
  });
  const [trackSelect, setTrackSelect] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).trackSelect : true;
  });
  
  // --- State: Auto-Save Config ---
  const [logsPath, setLogsPath] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).logsPath : 'C:\\Users\\User\\Solar Panel Calculator\\App\\ui-debug-logs';
  });
  const [maxLogs, setMaxLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).maxLogs : 50;
  });
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).autoSave : true;
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- State: History ---
  const [history, setHistory] = useState<ElementInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'suspects' | 'rules' | 'settings'>('live');

  // Refs
  const isPausedRef = useRef(isPaused);
  const configRef = useRef({ trackHover, trackClick, trackFocus, trackSelect });
  const historyRef = useRef(history);
  const logsPathRef = useRef(logsPath);
  const maxLogsRef = useRef(maxLogs);
  
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { configRef.current = { trackHover, trackClick, trackFocus, trackSelect }; }, [trackHover, trackClick, trackFocus, trackSelect]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { logsPathRef.current = logsPath; }, [logsPath]);
  useEffect(() => { maxLogsRef.current = maxLogs; }, [maxLogs]);

  // --- Persistence ---
  useEffect(() => {
    const config = {
      toggles,
      targetedRules,
      trackHover,
      trackClick,
      trackFocus,
      trackSelect,
      showWizard,
      logsPath,
      maxLogs,
      autoSave,
      panelSize,
      panelPosition
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [toggles, targetedRules, trackHover, trackClick, trackFocus, trackSelect, showWizard, logsPath, maxLogs, autoSave, panelSize, panelPosition]);

  // --- Helpers ---

  const fixGhosts = () => {
    const allElements = document.querySelectorAll('*');
    let count = 0;
    allElements.forEach(el => {
      if (el.closest('#debug-highlighter-panel')) return;
      
      const style = window.getComputedStyle(el);
      // Check for the specific milky background (rgba(255, 255, 255, 0.05))
      // We allow a small tolerance or exact match
      if (style.backgroundColor === 'rgba(255, 255, 255, 0.05)') {
        // Heuristic: If it has no border and is not a button/input, it's likely a ghost
        const hasBorder = style.borderWidth !== '0px' && style.borderStyle !== 'none' && style.borderWidth !== '';
        const isInteractive = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(el.tagName);
        
        if (!hasBorder && !isInteractive) {
           el.classList.add('debug-ghost-busted');
           count++;
        }
      }
    });
    alert(count > 0 ? `👻 Busted ${count} ghost backgrounds!` : 'No ghosts found!');
  };

  const cleanupOldLogs = async (path: string, max: number) => {
    try {
      // @ts-expect-error - Tauri check
      if (!window.__TAURI_INTERNALS__ && !window.__TAURI__) return;

      const entries = await readDir(path);
      const logFiles = entries
        .filter(e => e.name.startsWith('ui-debug-log-') && e.name.endsWith('.json'))
        .sort((a, b) => a.name.localeCompare(b.name)); // Oldest first

      if (logFiles.length > max) {
        const toDelete = logFiles.slice(0, logFiles.length - max);
        for (const file of toDelete) {
          await remove(`${path}\\${file.name}`);
        }
      }
    } catch (e) {
      console.warn('Failed to cleanup logs:', e);
    }
  };

  const saveLogsToDisk = useCallback(async (silent = false, data?: ElementInfo[], path?: string, max?: number) => {
    const dataToUse = data || historyRef.current;
    const pathToUse = path || logsPathRef.current;
    const maxToUse = max || maxLogsRef.current;

    const json = JSON.stringify(dataToUse, null, 2);
    const filename = `ui-debug-log-${Date.now()}.json`;

    try {
      // @ts-expect-error - Tauri check
      if (window.__TAURI_INTERNALS__ || window.__TAURI__) {
        // Auto-save to configured path
        if (pathToUse) {
          try {
            const dirExists = await exists(pathToUse);
            if (!dirExists) {
              await mkdir(pathToUse, { recursive: true });
            }
            await writeTextFile(`${pathToUse}\\${filename}`, json);
            await cleanupOldLogs(pathToUse, maxToUse);
            if (!silent) alert(`Saved to ${pathToUse}`);
            return;
          } catch (fsError) {
            console.warn('Auto-save failed (fs error):', fsError);
            if (!silent) alert(`Auto-save failed: ${fsError}`);
            // Fallthrough to dialog
          }
        }

        // Fallback to dialog
        const savePath = await save({
          defaultPath: filename,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        
        if (savePath) {
          await writeTextFile(savePath, json);
          if (!silent) alert('Logs saved successfully!');
          return;
        }
      }
    } catch (e) {
      console.warn('Tauri save failed, falling back to browser download', e);
    }

    if (!silent) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  // --- Auto-Save Logic ---
  useEffect(() => {
    if (!autoSave || isPaused) return;

    const interval = setInterval(async () => {
      if (historyRef.current.length === 0) return;
      await saveLogsToDisk(true);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [autoSave, isPaused, saveLogsToDisk]); // saveLogsToDisk is now stable

  const resetAll = () => {
    setHistory([]);
    setTargetedRules([]);
    setToggles({ outline: false, shadow: false, ring: false, border: false, selection: false, tap: false, filter: false, backdrop: false, transform: false, background: false });
    setShowWizard(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  const captureElement = (el: HTMLElement, type: EventType) => {
    if (isPausedRef.current) return;
    if (el.closest('#debug-highlighter-panel')) return;

    const style = window.getComputedStyle(el);
    
    // Filter out uninteresting elements to reduce noise
    if (type === 'hover' && style.pointerEvents === 'none') return;

    let path = el.tagName.toLowerCase();
    if (el.id) path += `#${el.id}`;
    if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const classes = el.className.trim().split(/\s+/).slice(0, 3).join('.');
      path += `.${classes}`;
    }

    const info: ElementInfo = {
      tag: el.tagName.toLowerCase(),
      id: el.id,
      className: typeof el.className === 'string' ? el.className : '',
      timestamp: Date.now(),
      path,
      eventType: type,
      computed: {
        outline: style.outline,
        boxShadow: style.boxShadow,
        border: style.border,
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        filter: style.filter,
        backdropFilter: style.backdropFilter,
        transform: style.transform,
        zIndex: style.zIndex,
        position: style.position,
        opacity: style.opacity,
        display: style.display,
      }
    };

    setHistory(prev => {
      if (prev.length > 0 && prev[0].path === info.path && prev[0].eventType === info.eventType) return prev;
      return [info, ...prev].slice(0, 300);
    });
  };

  const addTargetedRule = (selector: string, property: string, value: string) => {
    setTargetedRules(prev => {
      // Avoid duplicates
      if (prev.some(r => r.selector === selector && r.property === property)) return prev;
      return [...prev, { selector, property, value }];
    });
  };

  const removeTargetedRule = (index: number) => {
    setTargetedRules(prev => prev.filter((_, i) => i !== index));
  };

  // --- Listeners ---

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      if (configRef.current.trackHover) captureElement(e.target as HTMLElement, 'hover');
    };
    const handleClick = (e: MouseEvent) => {
      if (configRef.current.trackClick) captureElement(e.target as HTMLElement, 'click');
    };
    const handleFocus = (e: FocusEvent) => {
      if (configRef.current.trackFocus) captureElement(e.target as HTMLElement, 'focus');
    };
    const handleSelection = () => {
      if (!configRef.current.trackSelect) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.anchorNode) {
        const el = selection.anchorNode.parentElement;
        if (el) captureElement(el, 'select');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleClick);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, []);

  // --- Analysis ---

  const suspects = useMemo(() => {
    const counts: Record<string, { count: number, info: ElementInfo, types: Set<EventType> }> = {};
    
    history.forEach(item => {
      if (!counts[item.path]) {
        counts[item.path] = { count: 0, info: item, types: new Set() };
      }
      counts[item.path].count++;
      counts[item.path].types.add(item.eventType);
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [history]);

  // --- Resize & Move Logic ---

  const startMove = (e: React.MouseEvent) => {
    if (isExpanded) return;
    e.preventDefault();
    
    const startX = e.clientX - panelPosition.x;
    const startY = e.clientY - panelPosition.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;
      
      // Simple bounds
      const boundedX = Math.max(0, Math.min(window.innerWidth - 50, newX));
      const boundedY = Math.max(0, Math.min(window.innerHeight - 50, newY));

      setPanelPosition({ x: boundedX, y: boundedY });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelSize.width;
    const startHeight = panelSize.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newWidth = Math.max(400, startWidth + deltaX);
      const newHeight = Math.max(300, startHeight + deltaY);

      // Boundary checks
      const maxWidth = window.innerWidth - panelPosition.x - 10;
      const maxHeight = window.innerHeight - panelPosition.y - 10;

      setPanelSize({
        width: Math.min(newWidth, maxWidth),
        height: Math.min(newHeight, maxHeight)
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'se-resize';
  };

  // --- Wizard Logic ---

  const applyWizard = () => {
    const newToggles = { ...toggles };
    selectedSymptoms.forEach(id => {
      const symptom = SYMPTOMS.find(s => s.id === id);
      symptom?.recommendedToggles.forEach(t => {
        (newToggles as any)[t] = true;
      });
    });
    setToggles(newToggles);
    setShowWizard(false);
  };

  // --- Render ---

  if (showWizard) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-slate-900 border-2 border-indigo-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-700 bg-slate-800">
            <h2 className="text-2xl font-bold text-white mb-2">🕵️ Debugger Pro v5.0</h2>
            <p className="text-slate-300">What kind of visual bug are you hunting?</p>
          </div>
          <div className="p-6 overflow-y-auto space-y-3">
            {SYMPTOMS.map(s => (
              <label key={s.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition ${selectedSymptoms.includes(s.id) ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                <input 
                  type="checkbox" 
                  className="mt-1.5 w-5 h-5 rounded border-slate-500 text-indigo-500 focus:ring-indigo-500 bg-slate-700"
                  checked={selectedSymptoms.includes(s.id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedSymptoms(prev => [...prev, s.id]);
                    else setSelectedSymptoms(prev => prev.filter(id => id !== s.id));
                  }}
                />
                <div>
                  <div className="font-bold text-white">{s.label}</div>
                  <div className="text-sm text-slate-400">{s.description}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="p-6 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
            <button onClick={() => setShowWizard(false)} className="px-4 py-2 text-slate-400 hover:text-white">Skip Setup</button>
            <button onClick={applyWizard} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20">
              Start Debugging
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="debug-highlighter-panel"
      className={`fixed z-[9999] bg-slate-900/95 border-2 border-indigo-500 text-slate-200 rounded-xl text-xs font-mono shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-75 ease-out overflow-hidden`}
      style={{ 
        left: isExpanded ? 0 : panelPosition.x,
        top: isExpanded ? 0 : panelPosition.y,
        width: isExpanded ? '100vw' : panelSize.width, 
        height: isExpanded ? '100vh' : panelSize.height 
      }}
    >
      {/* Resize Handle */}
      {!isExpanded && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-center justify-center hover:bg-white/10 rounded-br-xl"
          onMouseDown={startResize}
          title="Drag to resize"
        >
          <div className="w-1.5 h-1.5 border-b-2 border-r-2 border-indigo-400/50"></div>
        </div>
      )}

      {/* Header */}
      <div 
        className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl shrink-0 cursor-move hover:bg-slate-800 transition select-none"
        onMouseDown={startMove}
        onDoubleClick={() => setIsExpanded(!isExpanded)}
        title="Drag to move, Double-click to expand"
      >
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} hover:text-white text-slate-400`}
          >
            🔼
          </button>
          <h3 className="font-bold text-indigo-400 text-sm">UI DEBUGGER PRO</h3>
          <button onClick={(e) => { e.stopPropagation(); setShowWizard(true); }} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded hover:bg-slate-600 ml-2 cursor-pointer">Wizard</button>
        </div>
        <div className="flex gap-2" onMouseDown={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 mr-2">
             <div className={`w-2 h-2 rounded-full ${autoSave ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} title={autoSave ? "Auto-save active" : "Auto-save off"}></div>
             <span className="text-[10px] text-slate-500">{history.length} events</span>
          </div>
          <button onClick={() => saveLogsToDisk(false)} className="bg-blue-900/80 px-2 py-1 rounded hover:bg-blue-800 text-[10px] text-blue-200">💾 SAVE</button>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className={`px-2 py-1 rounded text-[10px] font-bold ${isPaused ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button onClick={resetAll} className="bg-red-900/80 px-2 py-1 rounded hover:bg-red-800 text-[10px]">RESET</button>
        </div>
      </div>

      {/* Active Killers (Toggles) */}
      <div className="p-3 border-b border-slate-700 bg-slate-900 shrink-0">
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
          <span>Global Killers (Affects ALL Elements)</span>
          <span className="text-indigo-400">{Object.values(toggles).filter(Boolean).length} Active</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(toggles).map(([key, active]) => (
            <label key={key} className={`flex items-center gap-2 cursor-pointer p-1.5 rounded select-none border transition ${active ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-800 border-transparent hover:bg-slate-700'}`}>
              <input 
                type="checkbox" 
                checked={active as boolean} 
                onChange={e => setToggles((prev: any) => ({ ...prev, [key]: e.target.checked }))}
                className="w-3 h-3 rounded border-slate-500 text-red-500 focus:ring-red-500 bg-slate-900"
              />
              <span className={`capitalize truncate ${active ? 'text-red-200 font-bold' : 'text-slate-400'}`}>
                {key === 'backdrop' ? 'Backdrop Blur' : key}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/30 shrink-0">
        <button onClick={() => setActiveTab('live')} className={`flex-1 py-2 text-center hover:bg-white/10 transition ${activeTab === 'live' ? 'text-indigo-400 border-b-2 border-indigo-400 font-bold' : 'text-slate-500'}`}>Live Feed</button>
        <button onClick={() => setActiveTab('suspects')} className={`flex-1 py-2 text-center hover:bg-white/10 transition ${activeTab === 'suspects' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-slate-500'}`}>Suspects</button>
        <button onClick={() => setActiveTab('rules')} className={`flex-1 py-2 text-center hover:bg-white/10 transition ${activeTab === 'rules' ? 'text-red-400 border-b-2 border-red-400 font-bold' : 'text-slate-500'}`}>Targeted Rules ({targetedRules.length})</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 text-center hover:bg-white/10 transition ${activeTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400 font-bold' : 'text-slate-500'}`}>Config</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 bg-slate-900">
        {activeTab === 'live' && (
          <div className="space-y-1">
            {history.length === 0 && <div className="text-center text-slate-600 py-10 italic">Interact with the app to see events...</div>}
            {history.map((item, i) => (
              <div key={`${item.timestamp}-${i}`} className="bg-slate-800 p-2 rounded border border-slate-700 hover:border-indigo-500 transition group text-[10px]">
                <div className="flex justify-between mb-1">
                  <span className={`font-bold uppercase px-1.5 rounded ${
                    item.eventType === 'click' ? 'bg-green-900 text-green-300' : 
                    item.eventType === 'hover' ? 'bg-indigo-900 text-indigo-300' : 
                    item.eventType === 'focus' ? 'bg-amber-900 text-amber-300' : 'bg-blue-900 text-blue-300'
                  }`}>{item.eventType}</span>
                  <span className="text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="font-mono text-slate-300 break-all mb-1">
                  {item.tag}
                  {item.id && <span className="text-blue-400">#{item.id}</span>}
                  {item.className && <span className="text-green-400">.{item.className.split(' ').join('.')}</span>}
                </div>
                
                {/* Computed Styles Preview */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-500 border-t border-slate-700/50 pt-1 mt-1">
                  {item.computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && item.computed.backgroundColor !== 'transparent' && 
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full border border-slate-600" style={{ backgroundColor: item.computed.backgroundColor }}></div>
                      <span>Bg: {item.computed.backgroundColor}</span>
                    </div>
                  }
                  {item.computed.boxShadow !== 'none' && <div>Shadow: <span className="text-amber-500">Yes</span></div>}
                  {item.computed.outline !== '0px' && item.computed.outline !== 'none' && <div>Outline: <span className="text-red-500">{item.computed.outline}</span></div>}
                  {item.computed.zIndex !== 'auto' && <div>z-index: {item.computed.zIndex}</div>}
                  {item.computed.position !== 'static' && <div>pos: {item.computed.position}</div>}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => navigator.clipboard.writeText(item.path)} className="flex-1 bg-slate-700 hover:bg-indigo-600 text-white py-1 rounded">Copy Selector</button>
                  <button onClick={() => addTargetedRule(item.path, 'background', 'transparent !important')} className="flex-1 bg-slate-700 hover:bg-red-600 text-white py-1 rounded" title="Kill Background for THIS element only">Kill BG</button>
                  <button onClick={() => addTargetedRule(item.path, 'outline', 'none !important')} className="flex-1 bg-slate-700 hover:bg-red-600 text-white py-1 rounded" title="Kill Outline for THIS element only">Kill Outline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'suspects' && (
          <div className="space-y-2">
            <div className="bg-indigo-900/30 p-2 rounded border border-indigo-500/30 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-indigo-300">👻 Ghost Buster</h4>
                  <p className="text-[9px] text-slate-400">Fix "weird highlights" (bg-white/5) on non-card elements.</p>
                </div>
                <button onClick={fixGhosts} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded font-bold shadow-lg">
                  Auto-Fix
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Top 15 Most Frequent Elements</p>
            {suspects.map((suspect, i) => (
              <div key={i} className="bg-slate-800/50 p-2 rounded border border-amber-500/20 hover:border-amber-500/50 transition">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-amber-400 font-bold">#{i + 1}</span>
                  <div className="flex gap-1">
                    {Array.from(suspect.types).map(t => (
                      <span key={t} className="bg-slate-700 px-1 rounded text-[9px] uppercase">{t}</span>
                    ))}
                    <span className="bg-amber-900/30 text-amber-200 px-1.5 rounded text-[10px] font-bold">{suspect.count}</span>
                  </div>
                </div>
                <div className="font-mono text-[10px] break-all text-slate-300 mb-1">
                  {suspect.info.tag}
                  {suspect.info.id && <span className="text-blue-400">#{suspect.info.id}</span>}
                  {suspect.info.className && <span className="text-green-400">.{suspect.info.className.split(' ').join('.')}</span>}
                </div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => navigator.clipboard.writeText(suspect.info.path)} className="text-[9px] text-indigo-400 hover:text-indigo-300 underline">Copy Selector</button>
                  <span className="text-slate-600">|</span>
                  <button onClick={() => addTargetedRule(suspect.info.path, 'background', 'transparent !important')} className="text-[9px] text-red-400 hover:text-red-300 underline">Kill BG</button>
                  <span className="text-slate-600">|</span>
                  <button onClick={() => addTargetedRule(suspect.info.path, 'box-shadow', 'none !important')} className="text-[9px] text-red-400 hover:text-red-300 underline">Kill Shadow</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Active Targeted Rules</p>
            {targetedRules.length === 0 && <div className="text-center text-slate-600 py-8 italic">No targeted rules active. Use the Live Feed or Suspects tab to add rules.</div>}
            {targetedRules.map((rule, i) => (
              <div key={i} className="bg-slate-800 p-2 rounded border border-red-500/30 flex justify-between items-center">
                <div className="overflow-hidden">
                  <div className="font-mono text-[10px] text-slate-300 truncate" title={rule.selector}>{rule.selector}</div>
                  <div className="text-[9px] text-red-400 font-bold">{rule.property}: {rule.value}</div>
                </div>
                <button onClick={() => removeTargetedRule(i)} className="text-slate-500 hover:text-white px-2">✕</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 p-2">
            <div>
              <h4 className="font-bold text-slate-400 mb-2">Event Tracking</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={trackHover} onChange={e => setTrackHover(e.target.checked)} /> Track Hover</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={trackClick} onChange={e => setTrackClick(e.target.checked)} /> Track Click</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={trackFocus} onChange={e => setTrackFocus(e.target.checked)} /> Track Focus</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={trackSelect} onChange={e => setTrackSelect(e.target.checked)} /> Track Selection</label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h4 className="font-bold text-slate-400 mb-2">Auto-Save Logs</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={autoSave} onChange={e => setAutoSave(e.target.checked)} /> 
                  Enable Auto-Save (Every 30s)
                </label>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Logs Folder Path</label>
                  <input 
                    type="text" 
                    value={logsPath} 
                    onChange={e => setLogsPath(e.target.value)} 
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-500">Max Log Files to Keep</label>
                  <input 
                    type="number" 
                    value={maxLogs} 
                    onChange={e => setMaxLogs(Number(e.target.value))} 
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs w-20"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-[10px] text-slate-500">
                This tool injects `!important` styles to override common CSS properties. 
                Use "Global Killers" for broad sweeps, or "Targeted Rules" (via Live/Suspects tabs) to surgically remove styles from specific elements.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Global Style Injection */}
      {toggles.outline && <style>{`* { outline: none !important; }`}</style>}
      {toggles.shadow && <style>{`* { box-shadow: none !important; }`}</style>}
      {toggles.ring && <style>{`* { --tw-ring-color: transparent !important; --tw-ring-offset-width: 0px !important; box-shadow: none !important; }`}</style>}
      {toggles.border && <style>{`* { border-color: transparent !important; }`}</style>}
      {toggles.selection && <style>{`*::selection { background: transparent !important; }`}</style>}
      {toggles.tap && <style>{`* { -webkit-tap-highlight-color: transparent !important; }`}</style>}
      {toggles.filter && <style>{`* { filter: none !important; }`}</style>}
      {toggles.backdrop && <style>{`* { backdrop-filter: none !important; }`}</style>}
      {toggles.transform && <style>{`* { transform: none !important; }`}</style>}
      {toggles.background && <style>{`* { background-color: transparent !important; background: none !important; }`}</style>}
      
      {/* Ghost Buster Style */}
      <style>{`.debug-ghost-busted { background-color: transparent !important; background: none !important; }`}</style>

      {/* Targeted Style Injection */}
      <style>
        {targetedRules.map(r => `${r.selector} { ${r.property}: ${r.value}; }`).join('\n')}
      </style>
    </div>
  );
}
