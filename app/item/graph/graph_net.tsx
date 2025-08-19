"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MagnifyingGlassIcon, ArrowsPointingOutIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { CoreEnum } from '../../core/core_enum';

const Step = CoreEnum.Step;
const canvasSize = 3000;
const cellSize = 160;
const center = { x: canvasSize / 2, y: canvasSize / 2 };
const nodeRadius = 40;

const pairHash = (a, b) => {
  const s = [a, b].sort().join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

export default function GraphNet({ focus, relations }: { focus: string; relations: Array<{ from: string; to: string; type: CoreEnum.Step }> }) {
  const [positions, setPositions] = useState(new Map());
  const [graph, setGraph] = useState(new Map());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const containerRef = useRef(null);

  // Prevent default page scrolling on wheel events over the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('wheel', preventScroll);
    };
  }, []);

  // Build graph adjacency structure
  useEffect(() => {
    const g = new Map();
    for (const { from, to, type } of relations) {
      if (!g.has(from)) g.set(from, { [Step.prev]: new Set(), [Step.next]: new Set(), [Step.parallel]: new Set() });
      if (!g.has(to)) g.set(to, { [Step.prev]: new Set(), [Step.next]: new Set(), [Step.parallel]: new Set() });

      const f = g.get(from);
      const t = g.get(to);

      if (type === Step.next) {
        f[Step.next].add(to);
        t[Step.prev].add(from);
      } else if (type === Step.prev) {
        f[Step.prev].add(to);
        t[Step.next].add(from);
      } else if (type === Step.parallel) {
        f[Step.parallel].add(to);
        t[Step.parallel].add(from);
      }
    }
    setGraph(g);
  }, [relations]);

  // Compute node positions using layered layout
  useEffect(() => {
    if (!graph.size) return;
    const pos = new Map();
    const visited = new Set();
    const levels = new Map();
    const queue = [[focus, 0]];
    while (queue.length) {
      const [node, depth] = queue.shift();
      if (visited.has(node)) continue;
      visited.add(node);
      levels.set(node, depth);
      const gNode = graph.get(node);
      if (!gNode) continue;
      gNode[Step.next].forEach(n => queue.push([n, depth - 1]));
      gNode[Step.prev].forEach(n => queue.push([n, depth + 1]));
      gNode[Step.parallel].forEach(n => queue.push([n, depth]));
    }

    const layerMap = new Map();
    for (const [node, depth] of levels.entries()) {
      if (!layerMap.has(depth)) layerMap.set(depth, []);
      layerMap.get(depth).push(node);
    }

    const depths = Array.from(layerMap.keys()).sort((a, b) => a - b);
    let layers = depths.map(d => layerMap.get(d).slice());

    const maxIter = 10;
    for (let iter = 0; iter < maxIter; iter++) {
      // Down sweep
      for (let i = 1; i < depths.length; i++) {
        const prevLayer = layers[i - 1];
        const currLayer = layers[i];
        const baryList = currLayer.map((node, currIdx) => {
          const neighbors = [...(graph.get(node)?.[Step.prev] || []), ...(graph.get(node)?.[Step.next] || [])];
          const parents = neighbors.filter(p => levels.get(p) === depths[i - 1]);
          let sum = 0;
          let count = 0;
          parents.forEach(p => {
            sum += prevLayer.indexOf(p);
            count++;
          });
          return { node, bary: count ? sum / count : currIdx, idx: currIdx };
        });
        baryList.sort((a, b) => a.bary - b.bary || a.idx - b.idx);
        layers[i] = baryList.map(({ node }) => node);
      }

      // Up sweep
      for (let i = depths.length - 2; i >= 0; i--) {
        const nextLayer = layers[i + 1];
        const currLayer = layers[i];
        const baryList = currLayer.map((node, currIdx) => {
          const neighbors = [...(graph.get(node)?.[Step.prev] || []), ...(graph.get(node)?.[Step.next] || [])];
          const children = neighbors.filter(c => levels.get(c) === depths[i + 1]);
          let sum = 0;
          let count = 0;
          children.forEach(c => {
            sum += nextLayer.indexOf(c);
            count++;
          });
          return { node, bary: count ? sum / count : currIdx, idx: currIdx };
        });
        baryList.sort((a, b) => a.bary - b.bary || a.idx - b.idx);
        layers[i] = baryList.map(({ node }) => node);
      }
    }

    for (let i = 0; i < depths.length; i++) {
      const nodesAtLevel = layers[i];
      const half = Math.floor(nodesAtLevel.length / 2);
      nodesAtLevel.forEach((node, idx) => {
        pos.set(node, {
          x: idx - half,
          y: depths[i],
        });
      });
    }
    setPositions(pos);
  }, [graph, focus]);

  // Center view on focus node (UPDATED)
  useEffect(() => {
    if (!containerRef.current || !positions.has(focus)) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = positions.get(focus);
    setOffset({
      x: rect.width / 2 - scale * (center.x + x * cellSize),
      y: rect.height / 2 - scale * (center.y - y * cellSize), // MINUS instead of PLUS
    });
  }, [positions, focus, scale]);

  const handleWheel = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const ns = Math.max(0.2, Math.min(2, scale + (e.deltaY > 0 ? -0.1 : 0.1)));
    if (ns === scale) return;
    const r = ns / scale;
    setOffset({
      x: mouse.x - r * (mouse.x - offset.x),
      y: mouse.y - r * (mouse.y - offset.y),
    });
    setScale(ns);
  }, [scale, offset]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    const so = { ...offset };
    const move = (ev) =>
      setOffset({ x: so.x + (ev.clientX - start.x), y: so.y + (ev.clientY - start.y) });
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [offset]);

  const getVisibleNodes = useCallback(() => {
    if (!focusMode || !hoveredNode) return null;
    const visible = new Set([hoveredNode]);
    const gNode = graph.get(hoveredNode);
    if (gNode) {
      gNode[Step.prev].forEach(n => visible.add(n));
      gNode[Step.next].forEach(n => visible.add(n));
      gNode[Step.parallel].forEach(n => visible.add(n));
    }
    return visible;
  }, [graph, hoveredNode, focusMode]);

  const nodes = useMemo(() => {
    const visibleNodes = getVisibleNodes();

    return [...positions.entries()]
      .filter(([n]) => !visibleNodes || visibleNodes.has(n))
      .map(([n, { x, y }]) => {
        const isFocused = n === focus;
        const isHovered = n === hoveredNode;
        const isNeighbor = visibleNodes && n !== hoveredNode && visibleNodes.has(n);

        const bgColor = isFocused
          ? isDarkMode ? 'bg-red-600/80' : 'bg-red-400/80'
          : isHovered
            ? isDarkMode ? 'bg-yellow-500/80' : 'bg-yellow-300/80'
            : isNeighbor
              ? isDarkMode ? 'bg-green-600/80' : 'bg-green-300/80'
              : isDarkMode ? 'bg-gray-700/80' : 'bg-white/80';

        const borderColor = isFocused
          ? isDarkMode ? 'border-red-400' : 'border-red-500'
          : isDarkMode ? 'border-gray-400' : 'border-gray-600';

        const zIndex = isFocused || isHovered ? 'z-20' : isNeighbor ? 'z-15' : 'z-10';

        return (
          <div
            key={n}
            className={`absolute w-20 h-20 rounded-full border-2 flex items-center justify-center font-semibold text-sm
              ${bgColor} ${borderColor} ${zIndex} transition-all duration-300 ease-in-out transform hover:scale-110
              ${isDarkMode ? 'text-white shadow-lg shadow-black/30' : 'text-gray-900 shadow-lg shadow-gray-400/30'}
              backdrop-blur-sm`}
            style={{
              left: `${center.x + x * cellSize - nodeRadius}px`,
              top: `${center.y - y * cellSize - nodeRadius}px`, // MINUS instead of PLUS
            }}
            onMouseEnter={() => setHoveredNode(n)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {n}
          </div>
        );
      });
  }, [positions, focus, hoveredNode, getVisibleNodes, isDarkMode]);

  const lines = useMemo(() => {
    const segs = [];
    const drawnPar = new Set();
    const visibleNodes = getVisibleNodes();

    const isVisibleEdge = (a, b) => {
      if (!visibleNodes) return true;
      return visibleNodes.has(a) && visibleNodes.has(b);
    };

    relations.forEach(({ from, to, type }) => {
      if (!positions.has(from) || !positions.has(to) || !isVisibleEdge(from, to)) return;

      const fromPos = positions.get(from);
      const toPos = positions.get(to);
      const fromXpx = center.x + fromPos.x * cellSize;
      const fromYpx = center.y - fromPos.y * cellSize; // MINUS
      const toXpx = center.x + toPos.x * cellSize;
      const toYpx = center.y - toPos.y * cellSize; // MINUS

      const drawCubic = (color, key, markerEnd, dashArray) => {
        const midY = (fromYpx + toYpx) / 2;
        let c1x = fromXpx;
        let c2x = toXpx;
        let ctrlY = midY;

        if (type === Step.parallel) {
          const sameRow = fromPos.y === toPos.y;
          const sameCol = fromPos.x === toPos.x;
          const dir = (pairHash(from, to) & 1) ? 1 : -1;
          let bendX = 0;
          let bendY = 0;

          if (sameRow) {
            bendY = dir * 40;
            const minX = Math.min(fromPos.x, toPos.x);
            const maxX = Math.max(fromPos.x, toPos.x);
            const hasNodeBetween = [...positions.entries()].some(
              ([_, pos]) => pos.y === fromPos.y && pos.x > minX && pos.x < maxX
            );
            if (hasNodeBetween) {
              bendX = dir * Math.max(cellSize * 0.6, nodeRadius * 2 + 16);
            }
          } else if (sameCol) {
            bendX = dir * 40;
            const minY = Math.min(fromPos.y, toPos.y);
            const maxY = Math.max(fromPos.y, toPos.y);
            const hasNodeBetween = [...positions.entries()].some(
              ([_, pos]) => pos.x === fromPos.x && pos.y > minY && pos.y < maxY
            );
            if (hasNodeBetween) {
              bendX = dir * Math.max(cellSize * 0.6, nodeRadius * 2 + 16);
            }
          }
          c1x = fromXpx + bendX;
          c2x = toXpx + bendX;
          ctrlY = (fromYpx + toYpx) / 2 + bendY;
        }

        segs.push(
          <path
            key={`${key}-${from}-${to}`}
            d={`M${fromXpx},${fromYpx} C${c1x},${ctrlY} ${c2x},${ctrlY} ${toXpx},${toYpx}`}
            stroke={color}
            strokeWidth="3"
            fill="none"
            markerEnd={markerEnd || undefined}
            strokeDasharray={dashArray || undefined}
            className="transition-all duration-300"
            style={{ filter: isDarkMode ? 'drop-shadow(0 0 4px rgba(255,255,255,0.3))' : 'drop-shadow(0 0 4px rgba(0,0,0,0.2))' }}
          />
        );
      };

      if (type === Step.prev) {
        drawCubic(isDarkMode ? '#f87171' : '#dc2626', 'prev', 'url(#arrow-prev)', null);
      } else if (type === Step.next) {
        drawCubic(isDarkMode ? '#34d399' : '#16a34a', 'next', 'url(#arrow-next)', null);
      } else if (type === Step.parallel) {
        const k = [from, to].sort().join('|');
        if (!drawnPar.has(k)) {
          drawnPar.add(k);
          drawCubic(isDarkMode ? '#60a5fa' : '#2563eb', 'parallel', null, '6 6');
        }
      }
    });

    return segs;
  }, [positions, relations, getVisibleNodes, isDarkMode]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden transition-colors duration-300
        ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Toggle Buttons */}
      <div className="absolute top-4 left-4 z-30 flex space-x-2">
        <button
          className={`p-2 rounded-lg transition-all duration-200
            ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'}
            border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} shadow-lg`}
          onClick={() => setFocusMode(prev => !prev)}
        >
          {focusMode ? (
            <ArrowsPointingOutIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          ) : (
            <MagnifyingGlassIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          )}
        </button>
        <button
          className={`p-2 rounded-lg transition-all duration-200
            ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'}
            border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} shadow-lg`}
          onClick={() => setIsDarkMode(prev => !prev)}
        >
          {isDarkMode ? (
            <SunIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          ) : (
            <MoonIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          )}
        </button>
      </div>

      {/* Legend */}
      <div className={`absolute bottom-4 left-4 z-30 p-3 rounded-lg shadow-lg transition-all duration-200
        ${isDarkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-900'}
        border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        <div className="flex items-center space-x-2">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={isDarkMode ? '#34d399' : '#16a34a'} strokeWidth="2" markerEnd="url(#arrow-legend-next)" /></svg>
          <span>Next</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={isDarkMode ? '#f87171' : '#dc2626'} strokeWidth="2" markerEnd="url(#arrow-legend-prev)" /></svg>
          <span>prev</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={isDarkMode ? '#60a5fa' : '#2563eb'} strokeWidth="2" strokeDasharray="3 3" /></svg>
          <span>Parallel</span>
        </div>
        <defs>
          <marker id="arrow-legend-next" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#34d399' : '#16a34a'} />
          </marker>
          <marker id="arrow-legend-prev" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#f87171' : '#dc2626'} />
          </marker>
        </defs>
      </div>

      <div
        className="absolute top-0 left-0"
        style={{
          width: canvasSize,
          height: canvasSize,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: 'transform 0.2s ease-out',
        }}
      >
        <svg className="absolute top-0 left-0" width={canvasSize} height={canvasSize}>
          <defs>
            <marker
              id="arrow-next"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#34d399' : '#16a34a'} />
            </marker>
            <marker
              id="arrow-prev"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#f87171' : '#dc2626'} />
            </marker>
          </defs>
          {lines}
        </svg>
        <div className="relative z-10">{nodes}</div>
      </div>
    </div>
  );
}