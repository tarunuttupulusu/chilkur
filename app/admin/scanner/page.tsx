"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, CheckCircle, XCircle, Loader2, RefreshCw, Keyboard, Camera, ShieldCheck } from 'lucide-react';

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let active = true;
    let scannerInstance: Html5Qrcode | null = null;

    const startScanning = async () => {
      // Small delay to ensure container mount
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!active) return;

      const element = document.getElementById("reader");
      if (!element) return;

      try {
        // Clean up any running instances and release tracks first
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
          } catch (_) {}
          scannerRef.current.clear();
        }

        scannerInstance = new Html5Qrcode("reader");
        scannerRef.current = scannerInstance;

        // Strict facingMode matching: try environment (rear) exact constraint first
        const constraints = cameraMode === 'environment'
          ? { facingMode: { exact: "environment" } }
          : { facingMode: "user" };

        await scannerInstance.start(
          constraints,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            if (active) {
              setScanning(false);
              setUseCamera(false);
              handleScan(decodedText);
              scannerInstance?.stop().catch(console.error);
            }
          },
          () => {} // Silent errors during scanning
        );
      } catch (err) {
        console.warn("Camera exact facingMode failed, attempting fallback:", err);
        
        // Fallback constraint if exact environment mode is rejected by the device browser
        if (active && cameraMode === 'environment') {
          try {
            await scannerInstance?.start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 }
              },
              (decodedText) => {
                if (active) {
                  setScanning(false);
                  setUseCamera(false);
                  handleScan(decodedText);
                  scannerInstance?.stop().catch(console.error);
                }
              },
              () => {}
            );
            return;
          } catch (fallbackErr) {
            console.error("Camera fallback constraint failed:", fallbackErr);
          }
        }

        if (active) {
          setError("Could not access the selected camera. Please verify camera permissions in your browser settings.");
          setUseCamera(false);
        }
      }
    };

    if (useCamera && !loading && !scanResult && !error) {
      startScanning();
    }

    return () => {
      active = false;
      if (scannerInstance) {
        try {
          if (scannerInstance.isScanning) {
            scannerInstance.stop().catch(console.error);
          }
        } catch (_) {}
      }
    };
  }, [useCamera, loading, scanResult, error, cameraMode]);

  const handleScan = async (qrToken: string) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/admin/reservations/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate QR Code signature.');
      }

      setScanResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await fetch('/api/admin/reservations/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: manualCode.trim().toUpperCase() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid Ticket/Booking Reference Number.');
      }

      setScanResult(data);
      setManualCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setUseCamera(false);
    setManualCode('');
  };

  return (
    <div className="space-y-10 max-w-2xl mx-auto animate-fadeIn font-sans">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200 flex items-center gap-1.5 w-fit mx-auto">
          <ShieldCheck size={12} />
          Gatekeeper Claim Verification
        </span>
        <h1 className="text-3xl font-display font-black text-zinc-800">Ticket & QR Verification</h1>
        <p className="text-zinc-500 font-sans text-xs">Validate the customer's dining discount code via live camera scan or manual code entry.</p>
      </div>

      {/* Main verification panel */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
        <div className="p-8 flex flex-col items-center">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="animate-spin text-zinc-500" size={48} />
              <p className="font-bold text-zinc-600 text-xs tracking-wider uppercase">Checking Records...</p>
            </div>
          )}

          {!loading && !scanResult && !error && (
            <div className="w-full space-y-8">
              
              {/* Selector Tabs: Camera vs Manual */}
              <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <button
                  onClick={() => setUseCamera(true)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    useCamera 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Camera size={14} />
                  <span>Use Live Camera</span>
                </button>
                <button
                  onClick={() => setUseCamera(false)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    !useCamera 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Keyboard size={14} />
                  <span>Manual Ticket Code</span>
                </button>
              </div>

              {useCamera ? (
                /* Visual Camera Canvas */
                <div className="flex flex-col items-center space-y-6">
                  {/* Camera Toggle Button */}
                  <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 w-full max-w-sm justify-center mb-2">
                    <button
                      type="button"
                      onClick={() => setCameraMode('environment')}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        cameraMode === 'environment'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Rear Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraMode('user')}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        cameraMode === 'user'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Front/Selfie
                    </button>
                  </div>

                  <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-sm border border-zinc-200 aspect-square flex items-center justify-center bg-black">
                    <div id="reader" className="absolute inset-0 w-full h-full object-cover" />
                    
                    {/* HUD Overlay Frame */}
                    <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-zinc-400" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-zinc-400" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-zinc-400" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-zinc-400" />
                      <div className="w-full h-0.5 bg-zinc-500 absolute animate-[bounce_3s_infinite_linear]" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200">
                    <RefreshCw size={12} className="animate-spin text-zinc-400" />
                    <span>Camera scanner is active</span>
                  </div>
                </div>
              ) : (
                /* Manual Ticket Input Form */
                <form onSubmit={handleManualVerify} className="space-y-6 max-w-md mx-auto py-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 ml-1">
                      Enter Ticket / Booking Reference Code
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. RES-042382"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-dark/10 rounded-2xl py-4 px-5 text-center text-lg font-mono font-black text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-dark hover:bg-brand-dark/95 text-[#F6EFE3] font-bold uppercase tracking-widest rounded-2xl shadow-lg transition-all"
                  >
                    Verify Ticket Number
                  </button>
                </form>
              )}

            </div>
          )}

          {/* Success popup */}
          {!loading && scanResult && (
            <div className="w-full py-6 flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-green-50 rounded-full border border-green-100 shadow-md">
                <CheckCircle className="text-green-500" size={56} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-black text-brand-dark">Ticket Verified!</h2>
                <p className="text-[#C1440E] font-bold text-xs uppercase tracking-widest mt-1">10% discount applied successfully</p>
              </div>
              
              <div className="bg-[#F6EFE3]/80 border border-brand-gold/25 rounded-2xl p-6 text-left w-full max-w-sm space-y-3 shadow-inner">
                <div className="flex justify-between border-b border-brand-dark/5 pb-2 text-xs">
                  <span className="font-bold text-brand-dark/50 uppercase">Booking ID</span>
                  <span className="font-mono font-bold text-brand-dark">{scanResult.reservation.bookingRef}</span>
                </div>
                <div className="flex justify-between border-b border-brand-dark/5 pb-2 text-xs">
                  <span className="font-bold text-brand-dark/50 uppercase">Customer</span>
                  <span className="font-bold text-brand-dark">{scanResult.reservation.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-brand-dark/5 pb-2 text-xs">
                  <span className="font-bold text-brand-dark/50 uppercase">Guests</span>
                  <span className="font-bold text-brand-dark">{scanResult.reservation.guests} persons</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="font-bold text-brand-dark/50 uppercase">Claim Status</span>
                  <span className="font-black text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase text-[10px]">Verified</span>
                </div>
              </div>

              <button 
                onClick={resetScanner}
                className="w-full max-w-xs py-3.5 bg-brand-dark text-white font-bold uppercase tracking-widest rounded-xl hover:bg-brand-accent transition-colors shadow-md"
              >
                Verify Another Ticket
              </button>
            </div>
          )}

          {/* Failure popup */}
          {!loading && error && (
            <div className="w-full py-6 flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-red-50 rounded-full border border-red-100 shadow-md">
                <XCircle className="text-red-500" size={56} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-black text-brand-dark">Invalid Ticket</h2>
                <p className="text-red-500 font-bold text-xs uppercase tracking-widest mt-1">Verification Failed</p>
              </div>
              <p className="text-brand-dark/70 text-sm max-w-sm leading-relaxed">{error}</p>
              
              <button 
                onClick={resetScanner}
                className="w-full max-w-xs py-3.5 bg-brand-dark text-white font-bold uppercase tracking-widest rounded-xl hover:bg-brand-accent transition-colors shadow-md"
              >
                Try Again
              </button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
