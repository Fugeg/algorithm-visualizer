/**
 * @fileoverview 图可视化展示组件（GraphVisualizer）- D3.js 力导向图实现
 *
 * 本组件使用 D3.js 的力导向图（Force-Directed Graph）算法将图数据渲染为交互式可视化。
 *
 * 可视化原理：
 * - 使用 D3.js 的力模拟系统自动计算节点的最优布局位置
 * - 力的类型包括：
 *   1. 链接力（Link Force）：连接的节点相互吸引
 *   2. 电荷力（Charge Force）：所有节点相互排斥（防止重叠）
 *   3. 中心力（Center Force）：将节点拉向画布中心
 *   4. 碰撞力（Collision Force）：防止节点重叠
 *
 * 渲染技术：
 * - 使用 SVG <circle> 绘制节点，<line> 绘制边
 * - 支持箭头标记（marker）表示有向边
 * - 支持拖拽交互（drag behavior）
 * - 高亮节点使用蓝色填充，高亮边使用蓝色加粗
 *
 * 与简单SVG实现的区别：
 * - 节点位置由物理模拟自动计算，无需手动指定坐标
 * - 支持动态布局调整和拖拽交互
 * - 更适合展示复杂的图结构
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/** 图节点接口定义（扩展D3的SimulationNodeDatum） */
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
}

/** 图边接口定义（扩展D3的SimulationLinkDatum） */
interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string;
  target: string;
  weight?: number;
}

/** GraphVisualizer 组件的 Props 接口定义 */
interface GraphVisualizerProps {
  nodes: GraphNode[];
  edges: GraphLink[];
  highlightNodes: string[];
  highlightEdges: GraphLink[];
  width?: number;
  height?: number;
}

/**
 * 图可视化组件（D3.js 力导向图）
 */

const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  nodes,
  edges,
  highlightNodes,
  highlightEdges,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulation = useRef<d3.Simulation<GraphNode, GraphLink>>();

  useEffect(() => {
    if (!svgRef.current) return;

    // 清除旧的内容
    d3.select(svgRef.current).selectAll("*").remove();

    // 创建SVG容器
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "100%");

    // 创建箭头标记
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // 创建连接线
    const links = svg.append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", d => 
        highlightEdges.some(e => 
          (e.source === d.source && e.target === d.target) ||
          (e.source === d.target && e.target === d.source)
        ) ? "#4299e1" : "#999"
      )
      .attr("stroke-width", d => 
        highlightEdges.some(e => 
          (e.source === d.source && e.target === d.target) ||
          (e.source === d.target && e.target === d.source)
        ) ? 2 : 1
      );

    // 创建节点
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g");

    // 节点圆圈
    nodeGroup.append("circle")
      .attr("r", 20)
      .attr("fill", d => highlightNodes.includes(d.id) ? "#4299e1" : "#fff")
      .attr("stroke", d => highlightNodes.includes(d.id) ? "#2b6cb0" : "#999")
      .attr("stroke-width", 2);

    // 节点标签
    nodeGroup.append("text")
      .text(d => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", d => highlightNodes.includes(d.id) ? "#fff" : "#333")
      .style("font-size", "12px");

    // 创建力导向图模拟
    simulation.current = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(edges).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // 更新位置
    simulation.current.on("tick", () => {
      links
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      nodeGroup
        .attr("transform", d => `translate(${(d as any).x},${(d as any).y})`);
    });

    // 添加拖拽行为
    nodeGroup.call(d3.drag<SVGGElement, GraphNode>()
      .on("start", (event) => {
        if (!event.active && simulation.current) 
          simulation.current.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active && simulation.current) 
          simulation.current.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }));

    // 清理函数
    return () => {
      if (simulation.current) simulation.current.stop();
    };
  }, [nodes, edges, highlightNodes, highlightEdges, width, height]);

  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
};

export default GraphVisualizer;
