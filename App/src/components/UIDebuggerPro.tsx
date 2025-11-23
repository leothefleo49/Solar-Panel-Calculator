// @ts-nocheck
// UI Debugger Pro v5.2
// Overhauled for Pip/Python integration with Deep Scan & Simulator

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// --- Types ---
// (Types are stripped by Babel, but kept for reference/IDE)
/*
type EventType = 'hover' | 'click' | 'select' | 'focus';
interface ElementInfo { ... }
*/

const SYMPTOMS = [
  { id: 'glow', label: 'Glowing / Shining', description: 'Elements have a halo, fuzzy edge, or light emitting from them.', recommendedToggles: ['shadow', 'filter', 'ring'] },
  { id: 'border', label: 'Lines / Borders', description: 'Sharp lines, rectangles, or outlines appear around elements.', recommendedToggles: ['outline', 'border', 'ring'] },
  { id: 'flash', label: 'Flashing / Colors', description: 'Backgrounds change color, flash blue/grey, or highlight on tap.', recommendedToggles: ['tap', 'background', 'selection'] },
  { id: 'glass', label: 'Glass / Blur', description: 'Backgrounds get blurry, frosted, or semi-transparent.', recommendedToggles: ['backdrop', 'filter', 'background'] },
  { id: 'ghost', label: 'Ghost / Highlights', description: 'Faint white/colored backgrounds appearing on elements.', recommendedToggles: ['background', 'selection'] },
  { id: 'move', label: 'Movement / Size', description: 'Elements grow, shrink, bounce, or shift position.', recommendedToggles: ['transform'] },
  { id: 'overlay', label: 'Overlays / Blockers', description: 'Invisible layers blocking clicks or covering content.', recommendedToggles: ['background', 'backdrop'] },
];

const THEMES = {
  dark: { bg: 'bg-slate-900', text: 'text-slate-200', border: 'border-indigo-500', accent: 'indigo' },
  light: { bg: 'bg-white', text: 'text-slate-800', border: 'border-blue-500', accent: 'blue' },
  hacker: { bg: 'bg-black', text: 'text-green-400', border: 'border-green-500', accent: 'green' },
  cyber: { bg: 'bg-zinc-900', text: 'text-pink-400', border: 'border-yellow-400', accent: 'pink' },
};

const STORAGE_KEY = 'ui_debugger_pro_config_v5_2';

export default function UIDebuggerPro() {
  // --- State: Wizard ---
  const [showWizard, setShowWizard] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).showWizard : true;
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  // --- State: UI Config ---
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).theme || 'dark' : 'dark';
  });
  const [headlessMode, setHeadlessMode] = useState(false);

  // --- State: Panel Size ---
  const [panelSize, setPanelSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).panelSize || { width: 800, height: 400 } : { width: 800, height: 400 };
  });

  // --- State: Panel Position ---
  const [panelPosition, setPanelPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultPos = { x: 50, y: window.innerHeight - 450 };
    return saved ? JSON.parse(saved).panelPosition || defaultPos : defaultPos;
  });

  // --- State: Toggles (Global) ---
  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).toggles : {
      outline: false, shadow: false, ring: false, border: false,
      selection: false, tap: false, filter: false, backdrop: false,
      transform: false, background: false,
    };
  });

  // --- State: Targeted Rules ---
  const [targetedRules, setTargetedRules] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).targetedRules : [];
  });

  // --- State: Tracking Config ---
  const [trackHover, setTrackHover] = useState(true);
  const [trackClick, setTrackClick] = useState(true);
  const [trackFocus, setTrackFocus] = useState(true);
  const [trackSelect, setTrackSelect] = useState(true);
  
  // --- State: Auto-Save Config ---
  const [maxLogs, setMaxLogs] = useState(50);
  const [autoSave, setAutoSave] = useState(true);

  // --- State: Deep Scan & Simulator ---
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState(null); // null, 'mobile', 'tablet', 'desktop', 'custom'
  const [simScale, setSimScale] = useState(1);
  const [ignoredIssues, setIgnoredIssues] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).ignoredIssues || [] : [];
  });
  const [sensitivity, setSensitivity] = useState(0.5); // 0 to 1

  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- State: History ---
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('live');

  // Refs
  const isPausedRef = useRef(isPaused);
  const configRef = useRef({ trackHover, trackClick, trackFocus, trackSelect });
  const historyRef = useRef(history);
  
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { configRef.current = { trackHover, trackClick, trackFocus, trackSelect }; }, [trackHover, trackClick, trackFocus, trackSelect]);
  useEffect(() => { historyRef.current = history; }, [history]);

  // --- Persistence ---
  useEffect(() => {
    const config = {
      toggles, targetedRules, trackHover, trackClick, trackFocus, trackSelect,
      showWizard, maxLogs, autoSave, panelSize, panelPosition, theme, ignoredIssues
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [toggles, targetedRules, trackHover, trackClick, trackFocus, trackSelect, showWizard, maxLogs, autoSave, panelSize, panelPosition, theme, ignoredIssues]);

  // --- Server Communication ---
  const saveLogsToServer = useCallback(async (silent = false, data) => {
    const dataToUse = data || historyRef.current;
    if (dataToUse.length === 0) return;

    try {
      // In a pure React app, this endpoint won't exist. We can mock it or just log to console.
      console.log('Saving logs (mock):', dataToUse);
      // await fetch('/ui-debugger-pro/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(dataToUse)
      // });
      if (!silent) alert('Logs saved to console (Server not available in standalone mode)!');
    } catch (e) {
      console.error('Failed to save logs:', e);
      if (!silent) alert('Failed to save logs to server. Is the Python backend running?');
    }
  }, []);

  // --- Auto-Save Logic ---
  useEffect(() => {
    if (!autoSave || isPaused) return;
    const interval = setInterval(() => saveLogsToServer(true), 30000);
    return () => clearInterval(interval);
  }, [autoSave, isPaused, saveLogsToServer]);

  // --- Deep Scan Logic ---
  const runDeepScan = async () => {
    setIsScanning(true);
    setScanResults([]);
    const issues = [];
    const allElements = Array.from(document.querySelectorAll('*')).filter(el => !el.closest('#ui-debugger-pro-root'));

    // Sensitivity thresholds (0.0 to 1.0)
    // High sensitivity (1.0) = Strict (0px tolerance)
    // Low sensitivity (0.0) = Loose (10px tolerance)
    const tolerance = Math.round((1 - sensitivity) * 10); 

    // 1. Overlap Detection
    const visibleElements = allElements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    });

    const importantElements = visibleElements.filter(el => 
      ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'INPUT', 'SPAN'].includes(el.tagName)
    );

    for (let i = 0; i < importantElements.length; i++) {
      for (let j = i + 1; j < importantElements.length; j++) {
        const el1 = importantElements[i];
        const el2 = importantElements[j];
        
        if (el1.contains(el2) || el2.contains(el1)) continue;

        const r1 = el1.getBoundingClientRect();
        const r2 = el2.getBoundingClientRect();

        // Check overlap with tolerance
        const overlapX = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
        const overlapY = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
        
        if (overlapX > tolerance && overlapY > tolerance) {
          const z1 = window.getComputedStyle(el1).zIndex;
          const z2 = window.getComputedStyle(el2).zIndex;
          if (z1 === z2 && z1 === 'auto') {
             issues.push({ type: 'overlap', el: el1, el2: el2, message: `Overlap detected between <${el1.tagName}> and <${el2.tagName}>` });
          }
        }
      }
      if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // 2. Cutoff Detection
    visibleElements.forEach(el => {
      if (el.scrollWidth > el.clientWidth + tolerance || el.scrollHeight > el.clientHeight + tolerance) {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'hidden' || style.overflow === 'clip') {
           issues.push({ type: 'cutoff', el, message: `Content cut off in <${el.tagName}> (Scroll: ${el.scrollWidth}px > Client: ${el.clientWidth}px)` });
        }
      }
    });

    // 3. Theme Consistency (Colors)
    const colors = {};
    visibleElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const color = style.color;
      if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors[bg] = (colors[bg] || 0) + 1;
      if (color) colors[color] = (colors[color] || 0) + 1;
    });
    
    // Rare threshold based on sensitivity (Strict = 5, Loose = 2)
    const rareThreshold = Math.max(2, Math.round(sensitivity * 5));

    Object.entries(colors).forEach(([color, count]) => {
      if (count < rareThreshold) {
         const el = visibleElements.find(e => {
            const s = window.getComputedStyle(e);
            return s.backgroundColor === color || s.color === color;
         });
         if (el) issues.push({ type: 'theme', el, message: `Inconsistent color usage: ${color} (used only ${count} times)` });
      }
    });

    // 4. Unstylized Scrollbar Detection
    visibleElements.forEach(el => {
      if (el.tagName === 'BODY' || el.tagName === 'HTML') return;
      
      const hasVerticalScroll = el.scrollHeight > el.clientHeight;
      const hasHorizontalScroll = el.scrollWidth > el.clientWidth;
      
      if (hasVerticalScroll || hasHorizontalScroll) {
        const style = window.getComputedStyle(el);
        if (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') {
           // Heuristic: Check if scrollbar width is standard (approx 17px on desktop)
           // This is hard to detect perfectly without pseudo-element checking, but we can flag it for review.
           issues.push({ type: 'scrollbar', el, message: `Scrollbar detected on <${el.tagName}>. Verify if it is styled.` });
        }
      }
    });

    // 5. Alignment Detection (Symmetry/Centering)
    // Check siblings for slight misalignments (1-3px)
    const parents = new Set(visibleElements.map(el => el.parentElement).filter(p => p));
    parents.forEach(parent => {
      const children = Array.from(parent.children).filter(c => visibleElements.includes(c));
      if (children.length < 2) return;

      // Check Left Alignment
      const lefts = children.map(c => c.getBoundingClientRect().left);
      const minLeft = Math.min(...lefts);
      const maxLeft = Math.max(...lefts);
      if (maxLeft - minLeft > 0 && maxLeft - minLeft <= 3) { // 1-3px difference
         issues.push({ type: 'alignment', el: parent, message: `Possible misalignment in children of <${parent.tagName}> (Left diff: ${maxLeft - minLeft}px)` });
      }

      // Check Top Alignment (for rows)
      const tops = children.map(c => c.getBoundingClientRect().top);
      const minTop = Math.min(...tops);
      const maxTop = Math.max(...tops);
      if (maxTop - minTop > 0 && maxTop - minTop <= 3) {
         issues.push({ type: 'alignment', el: parent, message: `Possible misalignment in children of <${parent.tagName}> (Top diff: ${maxTop - minTop}px)` });
      }
    });

    // Filter ignored issues
    const filteredIssues = issues.filter(issue => {
      const sig = `${issue.type}|${issue.el.tagName}|${issue.el.className}`;
      return !ignoredIssues.includes(sig);
    });

    setScanResults(filteredIssues);
    setIsScanning(false);
  };

  const runMonkeyTest = async () => {
    if (!confirm("⚠️ WARNING: This will click random buttons on your page. \n\nEnsure you are in a SAFE environment (e.g., local dev) where data loss or random actions won't cause issues.\n\nContinue?")) return;
    
    const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]'))
      .filter(el => !el.closest('#ui-debugger-pro-root') && el.offsetParent !== null); // Visible only

    alert(`Found ${buttons.length} interactive elements. Starting test...`);

    for (const btn of buttons) {
      try {
        btn.style.outline = '2px solid red';
        await new Promise(r => setTimeout(r, 100)); // Visual feedback
        
        // Simulate Hover
        const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window });
        btn.dispatchEvent(mouseOverEvent);
        await new Promise(r => setTimeout(r, 100));

        // Simulate Click
        btn.click();
        
        btn.style.outline = '';
        await new Promise(r => setTimeout(r, 300)); // Wait for reaction
      } catch (e) {
        console.error('Monkey Test Error:', e);
      }
    }
    alert('Monkey Test Complete!');
  };

  // --- Simulator Auto-Cycle Logic ---
  useEffect(() => {
    let interval;
    if (simulatorMode === 'auto') {
      const modes = ['mobile', 'tablet', 'desktop'];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % modes.length;
        // We can't easily update state in interval without ref or functional update if we want to cycle specific values
        // But here we just want to cycle modes.
        // Actually, let's just pick random sizes for "Stress Test" if we add that.
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [simulatorMode]);

  // --- Extreme Ratio Test ---
  const [customSimSize, setCustomSimSize] = useState(null);
  
  const runExtremeRatioTest = () => {
     setSimulatorMode('custom');
     const ratios = [
       { w: 320, h: 480 }, { w: 480, h: 320 }, // Old phones
       { w: 1920, h: 1080 }, { w: 1080, h: 1920 }, // HD / Vertical Monitor
       { w: 2560, h: 1440 }, // 2K
       { w: 3840, h: 2160 }, // 4K
       { w: 500, h: 2000 }, // Tall thin
       { w: 2000, h: 500 }, // Wide short
       { w: 300, h: 300 }, // Small square
     ];
     
     let i = 0;
     const interval = setInterval(() => {
       if (i >= ratios.length) {
         clearInterval(interval);
         setSimulatorMode(null);
         setCustomSimSize(null);
         alert('Extreme Ratio Test Complete');
         return;
       }
       const r = ratios[i];
       setCustomSimSize(r);
       i++;
     }, 1500);
  };

  // --- Helpers ---
  const resetAll = () => {
    setHistory([]);
    setTargetedRules([]);
    setToggles({ outline: false, shadow: false, ring: false, border: false, selection: false, tap: false, filter: false, backdrop: false, transform: false, background: false });
    setShowWizard(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  const captureElement = (el, type) => {
    if (isPausedRef.current) return;
    if (el.closest('#ui-debugger-pro-root')) return;

    const style = window.getComputedStyle(el);
    if (type === 'hover' && style.pointerEvents === 'none') return;

    let path = el.tagName.toLowerCase();
    if (el.id) path += `#${el.id}`;
    if (el.className && typeof el.className === 'string' && el.className.trim()) {
      const classes = el.className.trim().split(/\s+/).slice(0, 3).join('.');
      path += `.${classes}`;
    }

    const info = {
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

  const addTargetedRule = (selector, property, value) => {
    setTargetedRules(prev => {
      if (prev.some(r => r.selector === selector && r.property === property)) return prev;
      return [...prev, { selector, property, value }];
    });
  };

  const removeTargetedRule = (index) => {
    setTargetedRules(prev => prev.filter((_, i) => i !== index));
  };

  // --- Listeners ---
  useEffect(() => {
    const handleMouseOver = (e) => configRef.current.trackHover && captureElement(e.target, 'hover');
    const handleClick = (e) => configRef.current.trackClick && captureElement(e.target, 'click');
    const handleFocus = (e) => configRef.current.trackFocus && captureElement(e.target, 'focus');
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
    const counts = {};
    history.forEach(item => {
      if (!counts[item.path]) counts[item.path] = { count: 0, info: item, types: new Set() };
      counts[item.path].count++;
      counts[item.path].types.add(item.eventType);
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [history]);

  // --- Resize & Move Logic ---
  const startMove = (e) => {
    if (isExpanded) return;
    e.preventDefault();
    const startX = e.clientX - panelPosition.x;
    const startY = e.clientY - panelPosition.y;
    const handleMouseMove = (moveEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - 50, moveEvent.clientX - startX));
      const newY = Math.max(0, Math.min(window.innerHeight - 50, moveEvent.clientY - startY));
      setPanelPosition({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const startResize = (e) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startY = e.clientY;
    const startWidth = panelSize.width; const startHeight = panelSize.height;
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.max(400, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(300, startHeight + (moveEvent.clientY - startY));
      setPanelSize({ width: newWidth, height: newHeight });
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // --- Wizard Logic ---
  const applyWizard = () => {
    const newToggles = { ...toggles };
    selectedSymptoms.forEach(id => {
      const symptom = SYMPTOMS.find(s => s.id === id);
      symptom?.recommendedToggles.forEach(t => { newToggles[t] = true; });
    });
    setToggles(newToggles);
    setShowWizard(false);
  };

  // --- Render ---
  const currentTheme = THEMES[theme];

  // Headless Mode (Terminal Mode)
  if (headlessMode) {
    return (
      <div className="fixed bottom-4 right-4 z-[10000]">
        <button 
          onClick={() => setHeadlessMode(false)}
          className="bg-red-600 text-white px-3 py-1 rounded shadow-lg font-mono text-xs hover:bg-red-500"
        >
          🔴 REC (UI Hidden)
        </button>
        {/* Styles still active */}
        <style>{toggles.outline && `* { outline: none !important; }`}</style>
        <style>{toggles.shadow && `* { box-shadow: none !important; }`}</style>
        {/* ... other styles ... */}
        <style>{targetedRules.map(r => `${r.selector} { ${r.property}: ${r.value}; }`).join('\n')}</style>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div id="ui-debugger-pro-root" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
        <div className={`w-full max-w-lg ${currentTheme.bg} border-2 ${currentTheme.border} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
          <div className="p-6 border-b border-slate-700">
            <h2 className={`text-2xl font-bold ${currentTheme.text} mb-2`}>🕵️ Debugger Pro v5.2</h2>
            <p className="text-slate-400">What kind of visual bug are you hunting?</p>
          </div>
          <div className="p-6 overflow-y-auto space-y-3">
            {SYMPTOMS.map(s => (
              <label key={s.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition ${selectedSymptoms.includes(s.id) ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                <input 
                  type="checkbox" 
                  className="mt-1.5 w-5 h-5"
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
          <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
            <button onClick={() => setShowWizard(false)} className="px-4 py-2 text-slate-400 hover:text-white">Skip Setup</button>
            <button onClick={applyWizard} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">Start Debugging</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="ui-debugger-pro-root"
      className={`fixed z-[9999] ${currentTheme.bg}/95 border-2 ${currentTheme.border} ${currentTheme.text} rounded-xl text-xs font-mono shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-75 ease-out overflow-hidden`}
      style={{ 
        left: isExpanded ? 0 : panelPosition.x,
        top: isExpanded ? 0 : panelPosition.y,
        width: isExpanded ? '100vw' : panelSize.width, 
        height: isExpanded ? '100vh' : panelSize.height 
      }}
    >
      {/* Tailwind CDN for styling if not present */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />

      {/* Resize Handle */}
      {!isExpanded && (
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50 flex items-center justify-center hover:bg-white/10 rounded-br-xl"
          onMouseDown={startResize}
        >
          <div className="w-1.5 h-1.5 border-b-2 border-r-2 border-indigo-400/50"></div>
        </div>
      )}

      {/* Header */}
      <div 
        className="flex justify-between items-center p-3 border-b border-slate-700 bg-slate-800/50 rounded-t-xl shrink-0 cursor-move select-none"
        onMouseDown={startMove}
        onDoubleClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-${currentTheme.accent}-400 text-sm`}>UI DEBUGGER PRO</h3>
          <button onClick={(e) => { e.stopPropagation(); setShowWizard(true); }} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded hover:bg-slate-600 ml-2">Wizard</button>
        </div>
        <div className="flex gap-2" onMouseDown={e => e.stopPropagation()}>
          <div className="flex items-center gap-1 mr-2">
             <div className={`w-2 h-2 rounded-full ${autoSave ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} title="Auto-save status"></div>
             <span className="text-[10px] text-slate-500">{history.length} events</span>
          </div>
          <button onClick={() => saveLogsToServer(false)} className="bg-blue-900/80 px-2 py-1 rounded hover:bg-blue-800 text-[10px] text-blue-200">💾 SAVE</button>
          <button onClick={() => setHeadlessMode(true)} className="bg-slate-700 px-2 py-1 rounded hover:bg-slate-600 text-[10px]">👁️ HIDE UI</button>
          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className={`px-2 py-1 rounded text-[10px] font-bold ${isPaused ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
          <button onClick={resetAll} className="bg-red-900/80 px-2 py-1 rounded hover:bg-red-800 text-[10px]">RESET</button>
        </div>
      </div>

      {/* Active Killers */}
      <div className="p-3 border-b border-slate-700 bg-slate-900 shrink-0">
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
          <span>Global Killers</span>
          <span className={`text-${currentTheme.accent}-400`}>{Object.values(toggles).filter(Boolean).length} Active</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(toggles).map(([key, active]) => (
            <label key={key} className={`flex items-center gap-2 cursor-pointer p-1.5 rounded select-none border transition ${active ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-800 border-transparent hover:bg-slate-700'}`}>
              <input 
                type="checkbox" 
                checked={active} 
                onChange={e => setToggles(prev => ({ ...prev, [key]: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className={`capitalize truncate ${active ? 'text-red-200 font-bold' : 'text-slate-400'}`}>{key}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/30 shrink-0">
        {['live', 'suspects', 'audit', 'rules', 'settings'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-2 text-center hover:bg-white/10 transition capitalize ${activeTab === tab ? `text-${currentTheme.accent}-400 border-b-2 border-${currentTheme.accent}-400 font-bold` : 'text-slate-500'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 bg-slate-900/50">
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
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => navigator.clipboard.writeText(item.path)} className="flex-1 bg-slate-700 hover:bg-indigo-600 text-white py-1 rounded">Copy Selector</button>
                  <button onClick={() => addTargetedRule(item.path, 'background', 'transparent !important')} className="flex-1 bg-slate-700 hover:bg-red-600 text-white py-1 rounded">Kill BG</button>
                  <button onClick={() => addTargetedRule(item.path, 'outline', 'none !important')} className="flex-1 bg-slate-700 hover:bg-red-600 text-white py-1 rounded">Kill Outline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'suspects' && (
          <div className="space-y-2">
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
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* --- Deep Scan & Monkey Test --- */}
            <div className="bg-slate-800 p-3 rounded border border-slate-700">
              <h4 className="font-bold text-white mb-2">Deep Scan & Automation</h4>
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={runDeepScan} 
                  disabled={isScanning}
                  className={`flex-1 py-2 rounded font-bold text-white ${isScanning ? 'bg-slate-600 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                  {isScanning ? 'Scanning...' : '🔍 Run Deep Scan'}
                </button>
                <button 
                  onClick={runMonkeyTest} 
                  className="flex-1 py-2 rounded font-bold text-white bg-amber-700 hover:bg-amber-600"
                >
                  🐒 Monkey Test
                </button>
              </div>
              
              {/* Sensitivity Slider */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Scan Sensitivity</span>
                  <span>{Math.round(sensitivity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={sensitivity} 
                  onChange={e => setSensitivity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* --- Simulator --- */}
            <div className="bg-slate-800 p-3 rounded border border-slate-700">
              <h4 className="font-bold text-white mb-2">Responsive Simulator</h4>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button onClick={() => setSimulatorMode('mobile')} className="bg-slate-700 hover:bg-slate-600 text-white py-1 rounded text-[10px]">📱 Mobile</button>
                <button onClick={() => setSimulatorMode('tablet')} className="bg-slate-700 hover:bg-slate-600 text-white py-1 rounded text-[10px]">📲 Tablet</button>
                <button onClick={() => setSimulatorMode('desktop')} className="bg-slate-700 hover:bg-slate-600 text-white py-1 rounded text-[10px]">💻 Desktop</button>
                <button onClick={() => setSimulatorMode('auto')} className="bg-purple-700 hover:bg-purple-600 text-white py-1 rounded text-[10px]">🔄 Auto-Cycle</button>
                <button onClick={runExtremeRatioTest} className="col-span-2 bg-red-900 hover:bg-red-800 text-white py-1 rounded text-[10px] font-bold">🔥 Extreme Ratio Test</button>
              </div>
            </div>

            {/* --- Results --- */}
            {scanResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h5 className="font-bold text-slate-300">Issues Found ({scanResults.length})</h5>
                  <button onClick={() => setScanResults([])} className="text-[10px] text-slate-500 hover:text-white">Clear</button>
                </div>
                {scanResults.map((issue, i) => (
                  <div key={i} className="bg-slate-800/50 p-2 rounded border border-red-500/20 hover:border-red-500/50">
                    <div className="flex justify-between">
                      <span className="uppercase text-[9px] font-bold text-red-400 bg-red-900/20 px-1 rounded">{issue.type}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            issue.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            issue.el.style.outline = '2px solid red';
                            setTimeout(() => issue.el.style.outline = '', 2000);
                          }}
                          className="text-[9px] text-indigo-400 hover:underline"
                        >
                          Locate
                        </button>
                        <button 
                          onClick={() => {
                            // Add to ignore list (simple signature based on tag + class + issue type)
                            const sig = `${issue.type}|${issue.el.tagName}|${issue.el.className}`;
                            setIgnoredIssues(prev => [...prev, sig]);
                            setScanResults(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="text-[9px] text-slate-500 hover:text-slate-300"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">{issue.message}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* --- Ignored Issues Toggle --- */}
            {ignoredIssues.length > 0 && (
               <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] text-slate-500">Ignored Issues: {ignoredIssues.length}</span>
                     <button onClick={() => setIgnoredIssues([])} className="text-[10px] text-red-400 hover:text-red-300">Reset Ignored</button>
                  </div>
               </div>
            )}
          </div>
        )}

        {/* --- Simulator Modal --- */}
        {simulatorMode && (
          <div className="fixed inset-0 z-[10001] bg-black/90 flex flex-col">
            <div className="h-10 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
              <span className="font-bold text-white">
                 Responsive Simulator: {simulatorMode === 'custom' ? (customSimSize ? `${customSimSize.w}x${customSimSize.h}` : 'Custom') : simulatorMode}
              </span>
              <button onClick={() => { setSimulatorMode(null); setCustomSimSize(null); }} className="text-slate-400 hover:text-white">✕ Close</button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <iframe 
                src={`${window.location.href}${window.location.href.includes('?') ? '&' : '?'}ui_debugger_ignore=true`}
                className="bg-white transition-all duration-500 shadow-2xl border-4 border-slate-700 rounded-lg"
                style={{
                  width: customSimSize ? `${customSimSize.w}px` : simulatorMode === 'mobile' ? '375px' : simulatorMode === 'tablet' ? '768px' : '100%',
                  height: customSimSize ? `${customSimSize.h}px` : simulatorMode === 'mobile' ? '667px' : simulatorMode === 'tablet' ? '1024px' : '100%',
                  transform: `scale(${simScale})`
                }}
              />
            </div>
            <div className="h-12 bg-slate-900 border-t border-slate-700 flex items-center justify-center gap-4">
               <button onClick={() => { setSimulatorMode('mobile'); setCustomSimSize(null); }} className={`px-3 py-1 rounded ${simulatorMode === 'mobile' ? 'bg-indigo-600' : 'bg-slate-700'}`}>Mobile</button>
               <button onClick={() => { setSimulatorMode('tablet'); setCustomSimSize(null); }} className={`px-3 py-1 rounded ${simulatorMode === 'tablet' ? 'bg-indigo-600' : 'bg-slate-700'}`}>Tablet</button>
               <button onClick={() => { setSimulatorMode('desktop'); setCustomSimSize(null); }} className={`px-3 py-1 rounded ${simulatorMode === 'desktop' ? 'bg-indigo-600' : 'bg-slate-700'}`}>Desktop</button>
               <div className="w-px h-6 bg-slate-700 mx-2"></div>
               <input type="range" min="0.2" max="1.5" step="0.1" value={simScale} onChange={e => setSimScale(e.target.value)} className="w-24" title="Zoom" />
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Active Targeted Rules</p>
            {targetedRules.length === 0 && <div className="text-center text-slate-600 py-8 italic">No targeted rules active.</div>}
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
              <h4 className="font-bold text-slate-400 mb-2">Theme</h4>
              <div className="flex gap-2">
                {Object.keys(THEMES).map(t => (
                  <button 
                    key={t} 
                    onClick={() => setTheme(t)}
                    className={`px-3 py-1 rounded capitalize text-xs ${theme === t ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
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
      
      {/* Targeted Style Injection */}
      <style>
        {targetedRules.map(r => `${r.selector} { ${r.property}: ${r.value}; }`).join('\n')}
      </style>
    </div>
  );
}
