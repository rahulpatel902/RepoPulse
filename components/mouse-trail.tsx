"use client";

import { useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
  alpha: number;
  touchId?: number;
}

interface TouchTrail {
  points: Point[];
  touchId: number;
}

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchTrailsRef = useRef<TouchTrail[]>([]);
  const mouseTrailRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>();
  const lastTouchTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
        mouseTrailRef.current = [];
      } else {
        // For touch events, handle each touch point
        if (e.touches.length >= 2) {
          e.preventDefault(); // Prevent scrolling with multiple fingers
          isDrawingRef.current = true;
          
          // Create a new trail for each touch point
          Array.from(e.touches).forEach(touch => {
            const position = getPointerPosition(touch);
            touchTrailsRef.current.push({
              points: [{
                x: position.x,
                y: position.y,
                alpha: 1,
                touchId: touch.identifier
              }],
              touchId: touch.identifier
            });
          });
        } else {
          lastTouchTimeRef.current = Date.now();
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current && e instanceof TouchEvent && e.touches.length >= 2) {
        // Start drawing if multiple fingers are added during move
        e.preventDefault();
        isDrawingRef.current = true;
        touchTrailsRef.current = [];
      }

      if (!isDrawingRef.current) return;

      if (e instanceof MouseEvent) {
        mousePositionRef.current = getPointerPosition(e);
        mouseTrailRef.current.push({
          x: mousePositionRef.current.x,
          y: mousePositionRef.current.y,
          alpha: 1
        });
      } else {
        e.preventDefault(); // Prevent scrolling while drawing
        
        // Update each touch trail
        Array.from(e.touches).forEach(touch => {
          const position = getPointerPosition(touch);
          let trail = touchTrailsRef.current.find(t => t.touchId === touch.identifier);
          
          if (!trail) {
            // Create new trail if it doesn't exist
            trail = {
              points: [],
              touchId: touch.identifier
            };
            touchTrailsRef.current.push(trail);
          }
          
          trail.points.push({
            x: position.x,
            y: position.y,
            alpha: 1,
            touchId: touch.identifier
          });
        });
      }
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (e instanceof TouchEvent) {
        // Handle touch end for specific touch points
        if (e.changedTouches) {
          Array.from(e.changedTouches).forEach(touch => {
            // Keep the trail but stop adding new points
            const trailIndex = touchTrailsRef.current.findIndex(t => t.touchId === touch.identifier);
            if (trailIndex !== -1) {
              // Let the trail fade out naturally
              touchTrailsRef.current[trailIndex].points = [...touchTrailsRef.current[trailIndex].points];
            }
          });
        }
        
        // If no more touches, stop drawing
        if (e.touches.length < 2) {
          isDrawingRef.current = false;
        }
      } else {
        isDrawingRef.current = false;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw mouse trail
      if (mouseTrailRef.current.length > 0) {
        drawTrail(mouseTrailRef.current);
        // Update alpha and filter out faded points
        mouseTrailRef.current = mouseTrailRef.current
          .map(point => ({ ...point, alpha: point.alpha * 0.95 }))
          .filter(point => point.alpha > 0.01);
      }

      // Draw all touch trails
      touchTrailsRef.current.forEach((trail, index) => {
        drawTrail(trail.points);
        // Update alpha and filter out faded points
        trail.points = trail.points
          .map(point => ({ ...point, alpha: point.alpha * 0.95 }))
          .filter(point => point.alpha > 0.01);
        
        // Remove trail if all points have faded
        if (trail.points.length === 0) {
          touchTrailsRef.current.splice(index, 1);
        }
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    const drawTrail = (points: Point[]) => {
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(147, 51, 234, ${point.alpha})`; // Purple color
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        if (i > 0) {
          const prevPoint = points[i - 1];
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
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
    canvas.addEventListener("touchend", handleEnd, { passive: false });
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-auto absolute inset-0 -z-10"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
