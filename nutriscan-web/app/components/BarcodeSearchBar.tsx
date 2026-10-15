'use client';

import React, { useRef, useState } from 'react';
import { ScanBarcode, AlertCircle, ArrowRight, X } from 'lucide-react';

interface BarcodeSearchBarProps {
  barcode: string;
  setBarcode: (val: string) => void;
  onSearch: (code?: string) => void;
  onOpenScannerModal: () => void;
  loading: boolean;
  // Shown once there is something to clear (typed text or a result on the page)
  showClear?: boolean;
  onClear?: () => void;
}

export default function BarcodeSearchBar({
  barcode,
  setBarcode,
  onSearch,
  onOpenScannerModal,
  loading,
  showClear = false,
  onClear,
}: BarcodeSearchBarProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    setValidationError(null);
    onClear?.();
    inputRef.current?.focus();
  };

  const isValidLength = (len: number) => len === 8 || len === 12 || len === 13;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    setBarcode(numericValue.slice(0, 13));

    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = barcode.trim();

    if (!cleanCode) {
      setValidationError('Enter a barcode first, or tap the camera to scan one.');
      return;
    }

    if (!isValidLength(cleanCode.length)) {
      setValidationError(
        `That's ${cleanCode.length} digits. Retail barcodes have 8, 12 or 13.`
      );
      return;
    }

    setValidationError(null);
    onSearch();
  };

  return (
    <div className="w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 p-1.5 rounded-full bg-surface border-2 transition-colors focus-within:ring-4 ${
          validationError
            ? 'border-clay focus-within:ring-clay/15'
            : 'border-fg/80 focus-within:border-leaf focus-within:ring-leaf/15'
        }`}
      >
        <button
          type="button"
          onClick={onOpenScannerModal}
          title="Scan with camera or upload a photo"
          aria-label="Scan with camera or upload a photo"
          className="w-11 h-11 rounded-full bg-sage flex items-center justify-center text-leaf hover:bg-leaf hover:text-bg transition-colors cursor-pointer shrink-0"
        >
          <ScanBarcode className="w-5 h-5" />
        </button>

        <label className="flex-1 min-w-0 flex items-center">
          <span className="sr-only">Barcode number</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={13}
            value={barcode}
            onChange={handleInputChange}
            placeholder="Type a barcode"
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? 'barcode-error' : undefined}
            className="w-full min-w-0 h-11 bg-transparent outline-none font-mono text-[17px] tracking-[0.1em] placeholder:tracking-normal placeholder:font-sans placeholder:text-dim"
          />
          <span className="font-mono text-[11px] text-dim tabular-nums px-2 hidden sm:inline">
            {barcode.length}/13
          </span>
        </label>

        {(showClear || barcode.length > 0) && onClear && (
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="h-11 px-3 sm:px-4 rounded-full flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-clay hover:bg-clay/10 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        {/* Enabled even when the length is wrong, so submitting explains what's missing */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary h-11 px-5 sm:px-6 shrink-0"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
              <span className="hidden sm:inline">Checking</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Check it</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {validationError && (
        <p id="barcode-error" className="flex items-center gap-1.5 text-clay text-[13px] font-medium mt-3 pl-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {validationError}
        </p>
      )}
    </div>
  );
}
