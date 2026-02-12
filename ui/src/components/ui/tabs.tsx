"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

type TabsVariant = "default" | "underline";

const TabsContext = React.createContext<TabsVariant>("default");

function Tabs({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & {
  variant?: TabsVariant;
}) {
  return (
    <TabsContext.Provider value={variant}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const variant = React.useContext(TabsContext);

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        variant === "default"
          ? "bg-ds-gray-100 border-ds-gray-alpha-400 text-ds-gray-900 inline-flex h-10 w-fit items-center justify-center rounded-lg border p-[3px]"
          : "flex items-center gap-1 overflow-x-auto",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsContext);

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        variant === "default"
          ? "data-[state=active]:bg-ds-gray-100 focus-visible:border-ds-gray-alpha-600 focus-visible:ring-ds-gray-alpha-400 focus-visible:outline-ds-gray-alpha-600 text-ds-gray-1000 dark:text-ds-gray-900 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-sm border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-2 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
          : "data-[state=active]:text-ds-gray-1000 focus-visible:ring-ds-gray-alpha-400 text-ds-gray-900 data-[state=active]:after:bg-ds-gray-1000 data-[state=inactive]:text-ds-gray-900 data-[state=inactive]:hover:text-ds-gray-1000 relative mb-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:after:absolute data-[state=active]:after:right-0 data-[state=active]:after:bottom-[-8px] data-[state=active]:after:left-0 data-[state=active]:after:h-0.5",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
