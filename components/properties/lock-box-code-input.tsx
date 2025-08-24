"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconEye, IconEyeOff, IconCopy, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface LockBoxCodeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  showCopyButton?: boolean;
  label?: string;
}

export function LockBoxCodeInput({
  value = "",
  onChange,
  placeholder = "Enter lock box code",
  className,
  readOnly = false,
  showCopyButton = false,
  label
}: LockBoxCodeInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const displayValue = isVisible ? value : '•'.repeat(value.length);

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{label}</label>
          {value && (
            <Badge variant="secondary" className="text-xs">
              {value.length} characters
            </Badge>
          )}
        </div>
      )}
      <div className="relative">
        <Input
          type="text"
          value={isVisible ? value : displayValue}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn("pr-16", className)}
          readOnly={readOnly}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {showCopyButton && value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
              title="Copy code"
            >
              {copied ? (
                <IconCheck className="h-4 w-4 text-green-600" />
              ) : (
                <IconCopy className="h-4 w-4" />
              )}
            </Button>
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsVisible(!isVisible)}
              title={isVisible ? "Hide code" : "Show code"}
            >
              {isVisible ? (
                <IconEyeOff className="h-4 w-4" />
              ) : (
                <IconEye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Code will be masked by default for security
        </p>
      )}
    </div>
  );
}