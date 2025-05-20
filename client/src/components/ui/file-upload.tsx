import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  [key: string]: any;
}

export function FileUpload({
  value,
  onChange,
  accept = "*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  ...props
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    setError(null);

    if (!file) {
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`File size exceeds the limit (${(maxSize / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }

    // Simulate upload delay for UX
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onChange(file);
    }, 500);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {!value && !isUploading ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-md py-6 px-4 flex flex-col items-center justify-center cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary dark:border-gray-700 dark:hover:border-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {accept.split(",").map(ext => ext.replace(".", "")).join(", ").toUpperCase()} (Max {(maxSize / (1024 * 1024)).toFixed(2)}MB)
          </p>
          <Input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            {...props}
          />
        </div>
      ) : (
        <div className="border rounded-md p-3">
          {isUploading ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
              <span className="text-sm">Uploading file...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {value?.name}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({(value?.size ? value.size / 1024 : 0).toFixed(2)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="flex items-center text-destructive text-sm mt-1">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
