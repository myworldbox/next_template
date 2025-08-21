"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlassIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { CoreEnum } from '../../core/core_enum';

const Step = CoreEnum.Step;
const limit = 100;
const canvasSize = 5000;
const cellSize = 160;
const nodeRadius = 40;
const center = { x: canvasSize / 2, y: canvasSize / 2 };

const pairHash = (a, b) => {
  const s = [a, b].sort().join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

const factorial = (n) => {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
};

const permute = (arr) => {
  const results = [];
  const generate = (arr, m = []) => {
    if (arr.length === 0) results.push(m);
    else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        generate(curr, m.concat(next));
      }
    }
  };
  generate(arr);
  return results;
};

const generatePermutations = (layer) => {
  const n = layer.length;
  if (factorial(n) <= limit) {
    return permute(layer);
  } else {
    const results = [layer.slice()];
    for (let i = 1; i < limit; i++) {
      const perm = layer.slice();
      for (let j = n - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [perm[j], perm[k]] = [perm[k], perm[j]];
      }
      results.push(perm);
    }
    return results;
  }
};

const generateMultiLayerPermutations = (layers, indices, limit) => {
  const perms = [];
  const layerPerms = indices.map(i => generatePermutations(layers[i]));
  const totalPerms = layerPerms.reduce((acc, p) => acc * p.length, 1);
  
  if (totalPerms <= limit) {
    // Generate all combinations
    const combine = (current, layerIdx) => {
      if (layerIdx === indices.length) {
        perms.push(current);
        return;
      }
      for (const perm of layerPerms[layerIdx]) {
        combine([...current, perm], layerIdx + 1);
      }
    };
    combine([], 0);
  } else {
    // Sample permutations
    for (let i = 0; i < limit; i++) {
      const combination = indices.map(idx => {
        const perms = layerPerms[indices.indexOf(idx)];
        return perms[Math.floor(Math.random() * perms.length)];
      });
      perms.push(combination);
    }
  }
  return perms;
};

const countCrossings = (layers, graph, relations) => {
  let sameDepthCrossings = 0;
  let diffDepthCrossings = 0;
  const nodeToPos = new Map();
  layers.forEach((layer, depth) => {
    layer.forEach((node, idx) => {
      nodeToPos.set(node, { depth, x: idx });
    });
  });

  const segmentsIntersect = (p1, p2, q1, q2) => {
    const orientation = (p, q, r) => {
      const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
      return val === 0 ? 0 : val > 0 ? 1 : 2;
    };

    const onSegment = (p, q, r) => {
      return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
    };

    const o1 = orientation(p1, p2, q1);
    const o2 = orientation(p1, p2, q2);
    const o3 = orientation(q1, q2, p1);
    const o4 = orientation(q1, q2, p2);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, q1, p2)) return true;
    if (o2 === 0 && onSegment(p1, q2, p2)) return true;
    if (o3 === 0 && onSegment(q1, p1, q2)) return true;
    if (o4 === 0 && onSegment(q1, p2, q2)) return true;

    return false;
  };

  for (let i = 0; i < relations.length; i++) {
    for (let j = i + 1; j < relations.length; j++) {
      const edge1 = relations[i];
      const edge2 = relations[j];

      const p1 = nodeToPos.get(edge1.from);
      const p2 = nodeToPos.get(edge1.to);
      const q1 = nodeToPos.get(edge2.from);
      const q2 = nodeToPos.get(edge2.to);
      if (!p1 || !p2 || !q1 || !q2) continue;

      if (edge1.from === edge2.from || edge1.from === edge2.to ||
        edge1.to === edge2.from || edge1.to === edge2.to) continue;

      const p1Coord = { x: p1.x, y: p1.depth };
      const p2Coord = { x: p2.x, y: p2.depth };
      const q1Coord = { x: q1.x, y: q1.depth };
      const q2Coord = { x: q2.x, y: q2.depth };

      let u1 = p1, v1 = p2;
      if (edge1.type === Step.parallel && p1.depth === p2.depth) {
        [u1, v1] = p1.x <= p2.x ? [p1, p2] : [p2, p1];
      } else if (p1.depth > p2.depth && edge1.type !== Step.parallel) {
        [u1, v1] = [p2, p1];
      }

      let u2 = q1, v2 = q2;
      if (edge2.type === Step.parallel && q1.depth === q2.depth) {
        [u2, v2] = q1.x <= q2.x ? [q1, q2] : [q2, q1];
      } else if (q1.depth > q2.depth && edge2.type !== Step.parallel) {
        [u2, v2] = [q2, q1];
      }

      const u1Coord = { x: u1.x, y: u1.depth };
      const v1Coord = { x: v1.x, y: v1.depth };
      const u2Coord = { x: u2.x, y: u2.depth };
      const v2Coord = { x: v2.x, y: v2.depth };

      if (u1.depth === v1.depth && u2.depth === v2.depth && u1.depth === u2.depth) {
        const positions = [u1.x, v1.x, u2.x, v2.x].sort((a, b) => a - b);
        const u1Idx = positions.indexOf(u1.x);
        const v1Idx = positions.indexOf(v1.x);
        const u2Idx = positions.indexOf(u2.x);
        const v2Idx = positions.indexOf(v2.x);
        const isNonCrossing = (Math.abs(u1Idx - v1Idx) === 1 && Math.abs(u2Idx - v2Idx) === 1) &&
          (Math.max(u1Idx, v1Idx) < Math.min(u2Idx, v2Idx) ||
            Math.max(u2Idx, v2Idx) < Math.min(u1Idx, v1Idx));
        if (!isNonCrossing) {
          sameDepthCrossings++;
        }
      } else {
        if (segmentsIntersect(u1Coord, v1Coord, u2Coord, v2Coord)) {
          diffDepthCrossings++;
        }
      }
    }
  }

  return { sameDepthCrossings, diffDepthCrossings };
};

export default function GraphMatrix({ focus, relations }) {
  const [positions, setPositions] = useState(new Map());
  const [graph, setGraph] = useState(new Map());
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [minCrossings, setMinCrossings] = useState(Infinity);
  const containerRef = useRef(null);
  const optimizedLayersRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e) => e.preventDefault();
    container.addEventListener('wheel', preventScroll, { passive: false });

    return () => container.removeEventListener('wheel', preventScroll);
  }, []);

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

  useEffect(() => {
    if (!graph.size) return;

    if (optimizedLayersRef.current) {
      const { sameDepthCrossings, diffDepthCrossings } = countCrossings(optimizedLayersRef.current, graph, relations);
      const totalCrossings = sameDepthCrossings + diffDepthCrossings;
      if (totalCrossings === 0) {
        const pos = new Map();
        optimizedLayersRef.current.forEach((layer, i) => {
          const half = Math.floor(layer.length / 2);
          layer.forEach((node, idx) => {
            pos.set(node, { x: idx - half, y: i });
          });
        });
        setPositions(pos);
        setMinCrossings(0);
        return;
      }
    }

    // Assign nodes to layers based on depth from focus
    const levels = new Map();
    const visited = new Set();
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

    // Initialize with degree-based sorting
    const sortLayerByDegree = (layer) => {
      return layer.sort((a, b) => {
        const aDeg = (graph.get(a)?.[Step.next]?.size || 0) +
                     (graph.get(a)?.[Step.prev]?.size || 0) +
                     (graph.get(a)?.[Step.parallel]?.size || 0);
        const bDeg = (graph.get(b)?.[Step.next]?.size || 0) +
                     (graph.get(b)?.[Step.prev]?.size || 0) +
                     (graph.get(b)?.[Step.parallel]?.size || 0);
        return bDeg - aDeg;
      });
    };

    layers.forEach(sortLayerByDegree);

    let bestLayers = layers.map(l => l.slice());
    let minCrossingsLocal = Infinity;
    let { sameDepthCrossings, diffDepthCrossings } = countCrossings(bestLayers, graph, relations);
    minCrossingsLocal = sameDepthCrossings + diffDepthCrossings;

    // Multi-layer permutation optimization
    for (let numLayers = 1; numLayers <= layers.length; numLayers++) {
      // Optimize the first numLayers together
      const indices = Array.from({ length: numLayers }, (_, i) => i);
      const multiPerms = generateMultiLayerPermutations(layers, indices, limit);
      let localMin = minCrossingsLocal;
      let localBestLayers = bestLayers.map(l => l.slice());

      for (const permSet of multiPerms) {
        const tempLayers = bestLayers.map(l => l.slice());
        indices.forEach((idx, i) => {
          tempLayers[idx] = permSet[i].slice();
        });
        const { sameDepthCrossings, diffDepthCrossings } = countCrossings(tempLayers, graph, relations);
        const total = sameDepthCrossings + diffDepthCrossings;
        if (total < localMin) {
          localMin = total;
          localBestLayers = tempLayers.map(l => l.slice());
        }
        if (total === 0) break;
      }

      if (localMin < minCrossingsLocal) {
        bestLayers = localBestLayers;
        minCrossingsLocal = localMin;
      }

      if (minCrossingsLocal === 0) break;
    }

    // Final single-layer refinement if crossings remain
    if (minCrossingsLocal > 0) {
      for (let li = 0; li < bestLayers.length; li++) {
        const perms = generatePermutations(bestLayers[li]);
        let finalMin = minCrossingsLocal;
        let finalBestPerm = bestLayers[li];

        for (const perm of perms) {
          const tempLayers = [...bestLayers.slice(0, li), perm, ...bestLayers.slice(li + 1)];
          const { sameDepthCrossings, diffDepthCrossings } = countCrossings(tempLayers, graph, relations);
          const total = sameDepthCrossings + diffDepthCrossings;
          if (total < finalMin) {
            finalMin = total;
            finalBestPerm = perm.slice();
          }
          if (total === 0) break;
        }

        if (finalMin < minCrossingsLocal) {
          bestLayers[li] = finalBestPerm;
          minCrossingsLocal = finalMin;
        }
        if (finalMin === 0) break;
      }
    }

    const pos = new Map();
    bestLayers.forEach((layer, i) => {
      const half = Math.floor(layer.length / 2);
      layer.forEach((node, idx) => {
        pos.set(node, { x: idx - half, y: i });
      });
    });
    setPositions(pos);
    setMinCrossings(minCrossingsLocal);
    optimizedLayersRef.current = bestLayers;
  }, [graph, focus, relations]);

  useEffect(() => {
    if (!containerRef.current || !positions.has(focus)) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = positions.get(focus);
    setOffset({
      x: rect.width / 2 - scale * (center.x + x * cellSize),
      y: rect.height / 2 - scale * (center.y - y * cellSize),
    });
  }, [positions, focus, scale]);

  const handleWheel = (e) => {
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
  };

  const handleMouseDown = (e) => {
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
  };

  const getVisibleNodes = () => {
    if (!focusMode || !hoveredNode) return null;
    const visible = new Set([hoveredNode]);
    const gNode = graph.get(hoveredNode);
    if (gNode) {
      gNode[Step.prev].forEach(n => visible.add(n));
      gNode[Step.next].forEach(n => visible.add(n));
      gNode[Step.parallel].forEach(n => visible.add(n));
    }
    return visible;
  };

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
              top: `${center.y - y * cellSize - nodeRadius}px`,
            }}
            onMouseEnter={() => setHoveredNode(n)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {n}
          </div>
        );
      });
  }, [positions, focus, hoveredNode, isDarkMode]);

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
      const fromYpx = center.y - fromPos.y * cellSize;
      const toXpx = center.x + toPos.x * cellSize;
      const toYpx = center.y - toPos.y * cellSize;

      const drawEdge = (color, key, markerEnd, dashArray) => {
        let d;
        if (type === Step.parallel) {
          const midY = (fromYpx + toYpx) / 2;
          let c1x = fromXpx;
          let c2x = toXpx;
          let ctrlY = midY;

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
              bendY = dir * Math.max(cellSize * 0.6, nodeRadius * 2 + 16);
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

          d = `M${fromXpx},${fromYpx} C${c1x},${ctrlY} ${c2x},${ctrlY} ${toXpx},${toYpx}`;
        } else {
          const midY = fromYpx + (toYpx - fromYpx) / 2;
          d = `M${fromXpx},${fromYpx} L${fromXpx},${midY} L${toXpx},${midY} L${toXpx},${toYpx}`;
        }

        segs.push(
          <path
            key={`${key}-${from}-${to}`}
            d={d}
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
        drawEdge(isDarkMode ? '#f87171' : '#dc2626', 'prev', 'url(#arrow-prev)', null);
      } else if (type === Step.next) {
        drawEdge(isDarkMode ? '#34d399' : '#16a34a', 'next', 'url(#arrow-next)', null);
      } else if (type === Step.parallel) {
        const k = [from, to].sort().join('|');
        if (!drawnPar.has(k)) {
          drawnPar.add(k);
          drawEdge(isDarkMode ? '#60a5fa' : '#2563eb', 'parallel', null, '6 6');
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
      <div className="absolute top-4 left-4 z-30 flex space-x-2">
        <button
          className={`p-2 rounded-lg transition-all duration-200
                     ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'}
                     border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} shadow-lg`}
          onClick={() => setFocusMode(prev => !prev)}
        >
          {focusMode ? (
            <svg className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
            </svg>
          ) : (
            <svg className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
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

      <div className={`absolute bottom-4 left-4 z-30 p-3 rounded-lg shadow-lg transition-all duration-200
                       ${isDarkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-900'}
                       border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        <div className="flex items-center space-x-2">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={isDarkMode ? '#34d399' : '#16a34a'} strokeWidth="2" markerEnd="url(#arrow-legend-next)" /></svg>
          <span>Next</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={isDarkMode ? '#f87171' : '#dc2626'} strokeWidth="2" markerEnd="url(#arrow-legend-prev)" /></svg>
          <span>Prev</span>
        </div>
        <div className="flex items-center space-x-2">
          <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={isDarkMode ? '#60a5fa' : '#2563eb'} strokeWidth="2" strokeDasharray="3 3" /></svg>
          <span>Parallel</span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <span>Edge Crossings: {minCrossings}</span>
        </div>
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
            <marker id="arrow-next" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#34d399' : '#16a34a'} />
            </marker>
            <marker id="arrow-prev" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#f87171' : '#dc2626'} />
            </marker>
            <marker id="arrow-legend-next" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={isDarkMode ? '#34d399' : '#16a34a'} />
            </marker>
            <marker id="arrow-legend-prev" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
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