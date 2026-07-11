"use client";
import React, { useEffect, useState, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, Loader2, RefreshCw, Keyboard, Camera, ShieldCheck } from 'lucide-react';
import jsQR from 'jsqr';

export default function ScannerPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'environment' | 'user'>('environment');

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Stop active camera streams and tracks cleanly
  const stopMediaStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error("Failed to stop track:", e);
        }
      });
      streamRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let active = true;

    const startScanning = async () => {
      // Small delay to ensure container mount
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!active) return;

      const video = videoRef.current;
      if (!video) return;

      // 1. Cleanly terminate previous stream tracks before switching cameras
      stopMediaStream();

      // 2. Set strict media stream constraints with fallback handling
      const strictConstraints = {
        video: { facingMode: { exact: cameraMode } }
      };

      const looseConstraints = {
        video: { facingMode: cameraMode }
      };

      try {
        let stream: MediaStream;
        try {
          // Attempt strict hardware constraint matching (for back camera: {exact: "environment"})
          stream = await navigator.mediaDevices.getUserMedia(strictConstraints);
        } catch (strictErr) {
          console.warn("Strict facingMode constraint rejected, attempting fallback constraints:", strictErr);
          // Safe fallback for devices with matching quirks
          stream = await navigator.mediaDevices.getUserMedia(looseConstraints);
        }

        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        video.srcObject = stream;
        
        // Autoplay attributes required by iOS Safari and Android Chrome to play stream inline
        video.setAttribute("playsinline", "true");
        video.setAttribute("autoplay", "true");
        video.setAttribute("muted", "true");
        
        await video.play();

        // 3. Initiate frame scanning loop
        const tick = () => {
          if (!active) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const canvas = canvasRef.current || document.createElement('canvas');
            canvasRef.current = canvas;
            
            const width = video.videoWidth;
            const height = video.videoHeight;
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert"
              });

              if (decoded) {
                stopMediaStream();
                setUseCamera(false);
                handleScan(decoded.data);
                return; // Stop animation loop
              }
            }
          }
          requestRef.current = requestAnimationFrame(tick);
        };
        
        requestRef.current = requestAnimationFrame(tick);

      } catch (err: any) {
        console.error("Camera access failed:", err);
        if (active) {
          // 4. Muted, professional permissions helper message
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError("Camera access was denied. Please go to your browser settings, grant camera permissions for this site, and try again.");
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setError("No compatible camera device found on this system.");
          } else {
            setError("Unable to initiate camera stream. Please check system permissions.");
          }
          setUseCamera(false);
        }
      }
    };

    if (useCamera && !loading && !scanResult && !error) {
      startScanning();
    }

    return () => {
      active = false;
      stopMediaStream();
    };
  }, [useCamera, loading, scanResult, error, cameraMode]);

  const handleScan = async (rawScannedString: string) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    // 1. Sanitize whitespaces, newlines, and carriage returns
    const sanitized = rawScannedString.replace(/[\r\n]+/g, "").trim();

    let payload: any = {};

    // 2. Check if the scanned string is a cryptographically signed Base64 token
    if (sanitized.includes('.') && sanitized.split('.').length === 2) {
      payload = { qrToken: sanitized };
    } else {
      // 3. Extract alphanumeric Booking ID sequence using Regex (e.g. from URLs or raw text)
      // Matches RES- followed by 6 to 10 alphanumeric characters
      const match = sanitized.toUpperCase().match(/(RES-[A-Z0-9]{6,10})/);
      const extractedId = match ? match[1] : sanitized.toUpperCase();
      
      payload = { bookingRef: extractedId };
    }

    try {
      const res = await fetch('/api/admin/reservations/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

    // Sanitize manual code entry
    const sanitizedCode = manualCode.replace(/[\r\n]+/g, "").trim().toUpperCase();

    try {
      const res = await fetch('/api/admin/reservations/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: sanitizedCode })
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
    stopMediaStream();
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
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
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
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 ml-1">
                      Enter Ticket / Booking Reference Code
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. RES-042382"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-4 px-5 text-center text-lg font-mono font-black text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-900 text-white font-bold uppercase tracking-widest rounded-2xl shadow-sm border border-zinc-700 transition-all"
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
                <h2 className="text-2xl font-display font-black text-zinc-800">Ticket Verified!</h2>
                <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest mt-1">10% discount applied successfully</p>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 text-left w-full max-w-sm space-y-3 shadow-inner">
                <div className="flex justify-between border-b border-zinc-200 pb-2 text-xs">
                  <span className="font-bold text-zinc-400 uppercase">Booking ID</span>
                  <span className="font-mono font-bold text-zinc-800">{scanResult.reservation.bookingRef}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2 text-xs">
                  <span className="font-bold text-zinc-400 uppercase">Customer</span>
                  <span className="font-bold text-zinc-800">{scanResult.reservation.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2 text-xs">
                  <span className="font-bold text-zinc-400 uppercase">Guests</span>
                  <span className="font-bold text-zinc-800">{scanResult.reservation.guests} persons</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="font-bold text-zinc-400 uppercase">Claim Status</span>
                  <span className="font-black text-green-700 bg-green-100 px-2 py-0.5 rounded uppercase text-[10px]">Verified</span>
                </div>
              </div>

              <button 
                onClick={resetScanner}
                className="w-full max-w-xs py-3.5 bg-zinc-800 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-900 border border-zinc-700 transition-colors shadow-sm"
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
                <h2 className="text-2xl font-display font-black text-zinc-800">Invalid Ticket</h2>
                <p className="text-red-500 font-bold text-xs uppercase tracking-widest mt-1">Verification Failed</p>
              </div>
              <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">{error}</p>
              
              <button 
                onClick={resetScanner}
                className="w-full max-w-xs py-3.5 bg-zinc-800 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-900 border border-zinc-700 transition-colors shadow-sm"
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
