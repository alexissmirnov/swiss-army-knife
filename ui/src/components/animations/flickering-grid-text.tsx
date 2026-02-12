"use client";

import { cn } from "@/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface FlickeringGridTextProps extends React.HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  maxOpacity?: number;
  text?: string;
  textBrightness?: number;
  fontSize?: number | string; // Font size in pixels, or CSS units like "4vw", "10%"
  responsiveFontSize?: boolean; // Automatically scale font based on container size
  minFontSize?: number; // Minimum font size when using responsive sizing
  maxFontSize?: number; // Maximum font size when using responsive sizing
  textOffsetY?: number; // Vertical offset from center in pixels
  fontFamily?: string; // Font family
  fontWeight?: string | number; // Font weight (e.g., 'bold', 'normal', 400, 700)
  fontStyle?: string; // Font style (e.g., 'normal', 'italic')
  textAlign?: 'left' | 'center' | 'right'; // Text alignment
  mobileText?: string; // Text to display on mobile devices
  mobileBreakpoint?: number; // Breakpoint for mobile in pixels
}

export const FlickeringGridText: React.FC<FlickeringGridTextProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = "rgb(0, 0, 0)",
  width,
  height,
  className,
  maxOpacity = 0.3,
  text = "pwno",
  textBrightness = 0.8,
  fontSize = 48, // Default font size in pixels
  responsiveFontSize = false,
  minFontSize = 16,
  maxFontSize = 120,
  textOffsetY = 0, // Default no offset
  fontFamily = "sans-serif",
  fontWeight = "bold",
  fontStyle = "normal",
  textAlign = "center",
  mobileText,
  mobileBreakpoint = 768,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Determine current text based on screen size
  const currentText = useMemo(() => {
    if (mobileText && isMobile) {
      return mobileText;
    }
    return text;
  }, [text, mobileText, isMobile]);

  // Check screen size and update mobile state
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };

    // Check initial screen size
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [mobileBreakpoint]);

  const memoizedColor = useMemo(() => {
    const toRGBA = (color: string) => {
      if (typeof window === "undefined") {
        return `rgba(0, 0, 0,`;
      }
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return "rgba(255, 0, 0,";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      return `rgba(${r}, ${g}, ${b},`;
    };
    return toRGBA(color);
  }, [color]);

  const calculateFontSize = useCallback(
    (canvasWidth: number, canvasHeight: number): number => {
      if (responsiveFontSize) {
        // Calculate responsive font size based on container dimensions
        const baseSize = Math.min(canvasWidth, canvasHeight) * 0.08; // 8% of smaller dimension
        return Math.max(minFontSize, Math.min(maxFontSize, baseSize));
      }
      
      if (typeof fontSize === 'string') {
        // Handle CSS units (vw, vh, %, em, rem)
        if (fontSize.includes('vw')) {
          const value = parseFloat(fontSize);
          return (value / 100) * window.innerWidth;
        } else if (fontSize.includes('vh')) {
          const value = parseFloat(fontSize);
          return (value / 100) * window.innerHeight;
        } else if (fontSize.includes('%')) {
          const value = parseFloat(fontSize);
          return (value / 100) * Math.min(canvasWidth, canvasHeight);
        }
        // For other units, return parsed value or fallback
        return parseFloat(fontSize) || 48;
      }
      
      return fontSize as number;
    },
    [fontSize, responsiveFontSize, minFontSize, maxFontSize]
  );

  const getTextCoveredSquares = useCallback(
    (
      canvas: HTMLCanvasElement,
      cols: number,
      rows: number,
      dpr: number
    ): Set<number> => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return new Set();

      // Create a temporary canvas for text detection
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return new Set();

      // Clear and set up text rendering
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Calculate responsive font size
      const actualFontSize = calculateFontSize(tempCanvas.width / dpr, tempCanvas.height / dpr);
      
      // Use the provided font styles
      tempCtx.font = `${fontStyle} ${fontWeight} ${actualFontSize}px ${fontFamily}`;
      tempCtx.fillStyle = "white";
      tempCtx.textAlign = textAlign;
      tempCtx.textBaseline = "middle";
      
      // Draw text with vertical offset and alignment
      const textX = textAlign === 'left' ? 0 : 
                   textAlign === 'right' ? tempCanvas.width : 
                   tempCanvas.width / 2;
      tempCtx.fillText(
        currentText,
        textX,
        tempCanvas.height / 2 + textOffsetY * dpr
      );

      // Get image data to detect text pixels
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      const coveredSquares = new Set<number>();

      // Check each square to see if it overlaps with text
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const squareIndex = i * rows + j;
          
          // Calculate square bounds in canvas pixels
          const startX = i * (squareSize + gridGap) * dpr;
          const endX = startX + squareSize * dpr;
          const startY = j * (squareSize + gridGap) * dpr;
          const endY = startY + squareSize * dpr;

          // Sample pixels in this square to see if any are part of the text
          let hasTextPixel = false;
          const sampleStep = Math.max(1, Math.floor(squareSize * dpr / 4));
          
          for (let x = startX; x < endX && !hasTextPixel; x += sampleStep) {
            for (let y = startY; y < endY && !hasTextPixel; y += sampleStep) {
              const pixelIndex = (Math.floor(y) * tempCanvas.width + Math.floor(x)) * 4;
              // Check if pixel has any white content (text)
              if (data[pixelIndex + 3] > 0) { // Alpha channel > 0
                hasTextPixel = true;
              }
            }
          }

          if (hasTextPixel) {
            coveredSquares.add(squareIndex);
          }
        }
      }

      return coveredSquares;
    },
    [squareSize, gridGap, currentText, calculateFontSize, textOffsetY, fontFamily, fontWeight, fontStyle, textAlign]
  );

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const cols = Math.floor(width / (squareSize + gridGap));
      const rows = Math.floor(height / (squareSize + gridGap));

      const textCoveredSquares = getTextCoveredSquares(canvas, cols, rows, dpr);
      
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) {
        const baseOpacity = Math.random() * maxOpacity;
        // Make squares covered by text always brighter
        squares[i] = textCoveredSquares.has(i) 
          ? Math.min(1, baseOpacity + textBrightness) 
          : baseOpacity;
      }

      return { cols, rows, squares, dpr, textCoveredSquares };
    },
    [squareSize, gridGap, maxOpacity, textBrightness, getTextCoveredSquares],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number, textCoveredSquares: Set<number>) => {
      for (let i = 0; i < squares.length; i++) {
        if (Math.random() < flickerChance * deltaTime) {
          const baseOpacity = Math.random() * maxOpacity;
          // Make squares covered by text brighter
          squares[i] = textCoveredSquares.has(i) 
            ? Math.min(1, baseOpacity + textBrightness) 
            : baseOpacity;
        }
      }
    },
    [flickerChance, maxOpacity, textBrightness],
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const opacity = squares[i * rows + j];
          ctx.fillStyle = `${memoizedColor}${opacity})`;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }
    },
    [memoizedColor, squareSize, gridGap],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let gridParams: ReturnType<typeof setupCanvas>;

    const updateCanvasSize = () => {
      const newWidth = width || container.clientWidth;
      const newHeight = height || container.clientHeight;
      setCanvasSize({ width: newWidth, height: newHeight });
      gridParams = setupCanvas(canvas, newWidth, newHeight);
    };

    updateCanvasSize();

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;

      updateSquares(gridParams.squares, deltaTime, gridParams.textCoveredSquares);
      drawGrid(
        ctx,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      );
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [setupCanvas, updateSquares, drawGrid, width, height, isInView]);

  return (
    <div
      ref={containerRef}
      className={cn(`h-full w-full ${className}`)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
}; 