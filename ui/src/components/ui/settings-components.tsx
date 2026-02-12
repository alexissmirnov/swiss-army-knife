import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Types
export interface SaveButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
}

export interface SettingsSwitchProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

// Reusable Components
export function SaveButton({
  onClick,
  isLoading,
  disabled,
  className,
}: SaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="sm"
      className={cn(
        isLoading &&
          "bg-ds-gray-100 text-ds-gray-800 border-ds-gray-alpha-400 disabled:bg-ds-gray-100 disabled:text-ds-gray-800 disabled:border-ds-gray-alpha-400 border transition-all duration-300",
        className
      )}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      Save
    </Button>
  );
}

export function SettingsSwitch({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: SettingsSwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// Settings Card Components
export function SettingsCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn("", className)}
      {...props}
    />
  );
}

export function SettingsCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <CardContent
      className={cn("flex flex-col gap-4 py-6", className)}
      {...props}
    />
  );
}

export function SettingsCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <CardTitle
      className={cn("", className)}
      {...props}
    />
  );
}

export function SettingsCardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("", className)}
      {...props}
    />
  );
}

export function SettingsCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-6", className)}
      {...props}
    />
  );
}

export function SettingsCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <CardFooter
      className={cn("justify-end px-6 py-3", className)}
      {...props}
    />
  );
}

export function SettingsCardActions({ 
  onSave, 
  isLoading, 
  disabled,
  className,
  ...props 
}: { 
  onSave: () => void | Promise<void>; 
  isLoading: boolean; 
  disabled?: boolean;
  className?: string;
} & React.ComponentProps<"div">) {
  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className={cn("flex gap-2 items-center", className)} {...props}>
      <SaveButton onClick={handleSave} isLoading={isLoading} disabled={disabled} />
    </div>
  );
}