"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  alpha: number;
}

interface Line {
  points: Point[];
  isActive: boolean;
}

export function MouseTrail({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linesRef = useRef<Line[]>([]);
  const isDrawingRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const getPointerPosition = (e: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e instanceof MouseEvent) {
        isDrawingRef.current = true;
        mousePositionRef.current = getPointerPosition(e);
        // Add new line
        linesRef.current.push({
          points: [{ ...mousePositionRef.current, alpha: 1 }],
          isActive: true
        });
      } else {
        if (e.touches.length === 1) {
          e.preventDefault();
          isDrawingRef.current = true;
          const touch = e.touches[0];
          mousePositionRef.current = getPointerPosition(touch);
          linesRef.current.push({
            points: [{ ...mousePositionRef.current, alpha: 1 }],
            isActive: true
          });
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;

      if (e instanceof MouseEvent) {
        mousePositionRef.current = getPointerPosition(e);
        const currentLine = linesRef.current[linesRef.current.length - 1];
        if (currentLine && currentLine.isActive) {
          currentLine.points.push({
            x: mousePositionRef.current.x,
            y: mousePositionRef.current.y,
            alpha: 1
          });
        }
      } else {
        if (e.touches.length === 1) {
          e.preventDefault();
          const touch = e.touches[0];
          mousePositionRef.current = getPointerPosition(touch);
          const currentLine = linesRef.current[linesRef.current.length - 1];
          if (currentLine && currentLine.isActive) {
            currentLine.points.push({
              x: mousePositionRef.current.x,
              y: mousePositionRef.current.y,
              alpha: 1
            });
          }
        }
      }
    };

    const handleEnd = () => {
      isDrawingRef.current = false;
      // Mark current line as inactive
      const currentLine = linesRef.current[linesRef.current.length - 1];
      if (currentLine) {
        currentLine.isActive = false;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all lines
      linesRef.current = linesRef.current.filter(line => {
        drawTrail(line.points);
        // Update alpha for all points in the line
        line.points = line.points
          .map(point => ({ ...point, alpha: point.alpha * 0.95 }))
          .filter(point => point.alpha > 0.01);
        return line.points.length > 0;
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const drawTrail = (points: Point[]) => {
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(255, 255, 255, ${point.alpha * 0.5})`;
        
        // Main stroke
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${point.alpha})`; // White color
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        if (i > 0) {
          const prevPoint = points[i - 1];
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
        
        // Reset shadow for next iteration
        ctx.shadowBlur = 0;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Mouse events
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);

    // Touch events
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd);
    canvas.addEventListener("touchcancel", handleEnd);

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
      canvas.removeEventListener("touchcancel", handleEnd);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-auto absolute inset-0 -z-10"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
