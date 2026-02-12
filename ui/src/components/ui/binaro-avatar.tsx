"use client";

import { useMemo } from "react";

interface BinaroAvatarProps {
  id: string;
  size?: number;
  className?: string;
}

export default function BinaroAvatar({
  id,
  size = 32,
  className = "",
}: BinaroAvatarProps) {
  const pixelData = useMemo(() => {
    // Generate a simple hash from the ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use the hash to generate a 5x5 grid with only center 3x3 active
    const grid: boolean[][] = [];
    const gridSize = 5;

    for (let y = 0; y < gridSize; y++) {
      grid[y] = [];
      for (let x = 0; x < gridSize; x++) {
        // Only allow pixels in the center 3x3 area (positions 1, 2, 3)
        if (y >= 1 && y <= 3 && x >= 1 && x <= 3) {
          // Map to 3x3 coordinates for bit position
          const innerY = y - 1;
          const innerX = x - 1;

          // Only process left half and center for symmetry
          if (innerX <= 1) {
            const bitPosition = (innerY * 2 + innerX) % 32;
            const isActive = (Math.abs(hash) >> bitPosition) & 1;
            grid[y][x] = isActive === 1;

            // Mirror horizontally for symmetry (1 mirrors to 3)
            if (innerX < 1) {
              grid[y][3] = grid[y][x];
            }
          }
        } else {
          // Outer border remains empty
          grid[y][x] = false;
        }
      }
    }

    return grid;
  }, [id]);

  const pixelSize = size / 5;

  // Define color palette with light, medium, and dark shades
  const colorPalette = {
    dark: "#1F2937", // ds-gray-800
    medium: "#4B5563", // ds-gray-600
    light: "#6B7280", // ds-gray-500
  };

  // Function to get color based on position and hash
  const getPixelColor = (x: number, y: number, hash: number) => {
    // Use position and hash to deterministically select a shade
    const colorHash = Math.abs(hash + x * 7 + y * 13);
    const colorChoice = colorHash % 3;

    switch (colorChoice) {
      case 0:
        return colorPalette.dark;
      case 1:
        return colorPalette.medium;
      case 2:
        return colorPalette.light;
      default:
        return colorPalette.medium;
    }
  };

  return (
    <div
      className={`bg-ds-background-100 border-ds-gray-alpha-400 relative overflow-hidden rounded border ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background grid lines for subtle structure */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`grid-${i}`}
            x1={i * pixelSize}
            y1={0}
            x2={i * pixelSize}
            y2={size}
            stroke="#E5E7EB"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`grid-h-${i}`}
            x1={0}
            y1={i * pixelSize}
            x2={size}
            y2={i * pixelSize}
            stroke="#E5E7EB"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {/* Pixel blocks */}
        {pixelData.map((row, y) =>
          row.map(
            (isActive, x) =>
              isActive && (
                <rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={getPixelColor(
                    x,
                    y,
                    Math.abs(
                      id
                        .split("")
                        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
                    )
                  )}
                  opacity={0.95} // Consistent high opacity for better contrast
                />
              )
          )
        )}
      </svg>
    </div>
  );
}
