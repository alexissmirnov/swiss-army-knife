"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollerProps {
  height?: string | number;
  width?: string | number;
  overflow: "x" | "y" | "both";
  withButtons?: boolean;
  childrenContainerClassName?: string;
  children: React.ReactNode;
  className?: string;
  hideScrollbar?: boolean;
}

export function Scroller({
  height,
  width = "100%",
  overflow,
  withButtons = false,
  childrenContainerClassName,
  children,
  className,
  hideScrollbar = false,
}: ScrollerProps) {
  const [scrollState, setScrollState] = React.useState({
    canScrollUp: false,
    canScrollDown: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const checkScrollState = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = container;

    setScrollState({
      canScrollUp: scrollTop > 0,
      canScrollDown: scrollTop + clientHeight < scrollHeight - 1,
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft + clientWidth < scrollWidth - 1,
    });
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollState();
    container.addEventListener("scroll", checkScrollState);
    
    // Check on resize
    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollState);
      resizeObserver.disconnect();
    };
  }, [checkScrollState]);

  const scrollTo = (direction: "up" | "down" | "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = direction === "up" || direction === "down" 
      ? container.clientHeight * 0.8 
      : container.clientWidth * 0.8;

    const scrollOptions: ScrollToOptions = {
      behavior: "smooth",
    };

    switch (direction) {
      case "up":
        scrollOptions.top = container.scrollTop - scrollAmount;
        break;
      case "down":
        scrollOptions.top = container.scrollTop + scrollAmount;
        break;
      case "left":
        scrollOptions.left = container.scrollLeft - scrollAmount;
        break;
      case "right":
        scrollOptions.left = container.scrollLeft + scrollAmount;
        break;
    }

    container.scrollTo(scrollOptions);
  };

  const containerStyle: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: typeof width === "number" ? `${width}px` : width,
  };

  const showVerticalGradients = overflow === "y" || overflow === "both";
  const showHorizontalGradients = overflow === "x" || overflow === "both";
  const showVerticalButtons = withButtons && (overflow === "y" || overflow === "both");
  const showHorizontalButtons = withButtons && (overflow === "x" || overflow === "both");

  return (
    <div className={cn("relative", className)} style={containerStyle}>
      {/* Vertical scroll buttons */}
      {showVerticalButtons && (
        <>
          <button
            onClick={() => scrollTo("up")}
            className={cn(
              "absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-ds-gray-alpha-400 bg-ds-background-100 p-2 shadow-sm transition-all",
              "hover:bg-ds-gray-100 hover:border-ds-gray-alpha-500",
              !scrollState.canScrollUp && "opacity-50 cursor-not-allowed"
            )}
            disabled={!scrollState.canScrollUp}
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollTo("down")}
            className={cn(
              "absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-ds-gray-alpha-400 bg-ds-background-100 p-2 shadow-sm transition-all",
              "hover:bg-ds-gray-100 hover:border-ds-gray-alpha-500",
              !scrollState.canScrollDown && "opacity-50 cursor-not-allowed"
            )}
            disabled={!scrollState.canScrollDown}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Horizontal scroll buttons */}
      {showHorizontalButtons && (
        <>
          <button
            onClick={() => scrollTo("left")}
            className={cn(
              "absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ds-gray-alpha-400 bg-ds-background-100 p-2 shadow-sm transition-all",
              "hover:bg-ds-gray-100 hover:border-ds-gray-alpha-500",
              !scrollState.canScrollLeft && "opacity-50 cursor-not-allowed"
            )}
            disabled={!scrollState.canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scrollTo("right")}
            className={cn(
              "absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ds-gray-alpha-400 bg-ds-background-100 p-2 shadow-sm transition-all",
              "hover:bg-ds-gray-100 hover:border-ds-gray-alpha-500",
              !scrollState.canScrollRight && "opacity-50 cursor-not-allowed"
            )}
            disabled={!scrollState.canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Vertical gradients */}
      {showVerticalGradients && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-ds-background-200 to-transparent transition-opacity duration-300 ease-in-out z-10",
              scrollState.canScrollUp ? "opacity-100" : "opacity-0"
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-ds-background-200 to-transparent transition-opacity duration-300 ease-in-out z-10",
              scrollState.canScrollDown ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      )}

      {/* Horizontal gradients */}
      {showHorizontalGradients && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-ds-background-200 to-transparent transition-opacity duration-300 ease-in-out z-10",
              scrollState.canScrollLeft ? "opacity-100" : "opacity-0"
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-ds-background-200 to-transparent transition-opacity duration-300 ease-in-out z-10",
              scrollState.canScrollRight ? "opacity-100" : "opacity-0"
            )}
          />
        </>
      )}

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "h-full w-full",
          !hideScrollbar && "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ds-gray-alpha-400 hover:scrollbar-thumb-ds-gray-alpha-500",
          hideScrollbar && "scrollbar-hide",
          overflow === "x" && "overflow-x-auto overflow-y-hidden",
          overflow === "y" && "overflow-y-auto overflow-x-hidden",
          overflow === "both" && "overflow-auto"
        )}
      >
        <div
          className={cn(
            overflow === "x" && "flex",
            overflow === "y" && "flex flex-col",
            overflow === "both" && "w-max",
            childrenContainerClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}