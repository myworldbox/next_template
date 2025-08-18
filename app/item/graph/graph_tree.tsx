"use client"

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MagnifyingGlassIcon, ArrowsPointingOutIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { CoreEnum } from '../../core/core_enum';

import * as d3 from "d3";

export default function GraphTree({ data }) {
  const ref = useRef(null);

  useEffect(() => {
    const svg = d3.select(ref.current)
      .attr("width", 800)
      .attr("height", 600);

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([600, 400]);
    treeLayout(root);

    svg.selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", "black");

    svg.selectAll("circle")
      .data(root.descendants())
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 20)
      .attr("fill", "lightblue");

    svg.selectAll("text")
      .data(root.descendants())
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y - 25)
      .attr("text-anchor", "middle")
      .text(d => d.data.name);
  }, [data]);

  return <svg ref={ref}></svg>;
};

