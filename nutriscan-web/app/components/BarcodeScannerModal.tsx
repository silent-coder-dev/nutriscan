'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, ImageUp, AlertCircle, RefreshCw } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
}

// Supported retail barcode formats
const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
];

const CAMERA_REGION_ID = 'barcode-reader-region';
const FILE_REGION_ID = 'barcode-file-region';

async function stopScanner(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
    scanner.clear();
  } catch (err) {
    console.warn('Scanner stop error:', err);
  }
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Latest callbacks, so the camera effect does not restart when the parent re-renders
  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onCloseRef.current = onClose;
  });

  // Live camera: runs while the modal is open on the camera tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return;

    let scanner: Html5Qrcode | null = null;
    let cancelled = false;
    let handled = false; // the decoder can fire several times before stop() completes

    // Wait for the reader element to mount
    const timer = setTimeout(async () => {
      try {
        scanner = new Html5Qrcode(CAMERA_REGION_ID, { formatsToSupport: BARCODE_FORMATS, verbose: false });
        await scanner.start(
          { facingMode: 'environment' }, // Prefer the back camera on phones
          { fps: 10, qrbox: { width: 260, height: 160 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (handled) return;
            handled = true;
            stopScanner(scanner);
            onScanSuccessRef.current(decodedText.trim());
            onCloseRef.current();
          },
          () => {
            // Frame without a readable code
          }
        );
        // Closed while the camera was still starting
        if (cancelled) stopScanner(scanner);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setScannerError('Camera access was blocked. Allow it in your browser settings and try again.');
        } else if (msg.includes('NotFoundError')) {
          setScannerError('No camera found on this device.');
        } else {
          setScannerError("Couldn't start the camera. Try uploading a photo instead.");
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner(scanner);
    };
  }, [isOpen, activeTab]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const switchTab = (tab: 'camera' | 'upload') => {
    setScannerError(null);
    setActiveTab(tab);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScannerError(null);

    const fileScanner = new Html5Qrcode(FILE_REGION_ID, { formatsToSupport: BARCODE_FORMATS, verbose: false });
    try {
      const decodedText = await fileScanner.scanFile(file, false);
      onScanSuccess(decodedText.trim());
      onClose();
    } catch {
      setScannerError("No barcode found in that photo. Make sure the lines are sharp and well lit.");
    } finally {
      try {
        fileScanner.clear();
      } catch {
        // Nothing rendered to clear
      }
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fg/45" onClick={onClose}>
      <div
        className="panel shadow-[0_30px_80px_-30px_rgb(31_45_36/0.55)] w-full max-w-md flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 id="scan-title" className="display text-2xl leading-none">
              Scan a barcode
            </h3>
            <p className="text-[13px] text-muted mt-1">Hold it steady, or upload a photo.</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-line-strong flex items-center justify-center hover:bg-clay hover:text-bg hover:border-clay transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 p-1 rounded-full border border-line bg-bg text-[13px] font-semibold" role="tablist">
            {([
              ['camera', Camera, 'Live camera'],
              ['upload', ImageUp, 'Upload photo'],
            ] as const).map(([tab, Icon, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => switchTab(tab)}
                className={`h-9 rounded-full flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  activeTab === tab ? 'bg-leaf text-bg' : 'text-muted hover:text-fg'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === 'camera' && (
            <div className="mt-4">
              <div className="w-full h-64 bg-black rounded-2xl overflow-hidden relative">
                <div id={CAMERA_REGION_ID} className="w-full h-full" />

                <div className="absolute inset-x-10 inset-y-14 pointer-events-none">
                  {['top-0 left-0 border-t-[3px] border-l-[3px]', 'top-0 right-0 border-t-[3px] border-r-[3px]', 'bottom-0 left-0 border-b-[3px] border-l-[3px]', 'bottom-0 right-0 border-b-[3px] border-r-[3px]'].map((c) => (
                    <span key={c} className={`absolute w-6 h-6 border-leaf ${c}`} />
                  ))}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-x-0 top-1/2 h-[2px] bg-sprout animate-sweep" />
                  </div>
                </div>
              </div>
              <p className="font-mono text-[11px] text-muted mt-3 text-center uppercase tracking-wider">
                Line up the bars inside the frame
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="mt-4">
              <div id={FILE_REGION_ID} className="hidden" />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="w-full h-52 rounded-xl border-2 border-dashed border-line-strong hover:border-leaf bg-bg hover:bg-leaf/5 transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer disabled:opacity-60"
              >
                <span className="w-12 h-12 rounded-xl bg-leaf/15 text-leaf flex items-center justify-center mb-3">
                  <ImageUp className="w-5 h-5" />
                </span>
                <span className="font-semibold">Choose a photo of the barcode</span>
                <span className="text-[13px] text-muted mt-1">PNG, JPG or WebP</span>
              </button>

              {isProcessingFile && (
                <p className="flex items-center justify-center gap-2 text-[13px] font-semibold mt-3">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reading the image…
                </p>
              )}
            </div>
          )}

          {scannerError && (
            <div className="mt-4 notice-error" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-clay mt-0.5" />
              <span>{scannerError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
