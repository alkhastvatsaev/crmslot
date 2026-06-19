"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type TechnicianSignaturePadHandle = {
  clear: () => void;
  getPngDataUrl: () => string | null;
};

type Props = {
  /** Remplit la hauteur du conteneur parent (wizard clôture). */
  fillHeight?: boolean;
  className?: string;
  /** Signature déjà enregistrée (réouverture / amendement). */
  initialSignatureUrl?: string | null;
};

const TechnicianSignaturePad = forwardRef<TechnicianSignaturePadHandle, Props>(
  function TechnicianSignaturePad({ fillHeight = false, className, initialSignatureUrl }, ref) {
    const [mounted, setMounted] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Initialize canvas context and size once mounted
    useEffect(() => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      if (canvas) {
        // Set actual canvas resolution based on display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(255,255,255,1)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, [mounted]);

    useEffect(() => {
      if (!mounted || !initialSignatureUrl?.trim()) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const url = initialSignatureUrl.trim();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        setHasDrawn(true);
      };
      img.onerror = () => {
        setHasDrawn(false);
      };
      img.src = url;
    }, [mounted, initialSignatureUrl]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "rgba(255,255,255,1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
        setHasDrawn(false);
      },
      getPngDataUrl: () => {
        const canvas = canvasRef.current;
        if (!canvas || !hasDrawn) return null;
        return canvas.toDataURL("image/png");
      },
    }));

    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Prevent scrolling when touching the canvas
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawing.current = true;
      lastPos.current = getCoordinates(e);
      setHasDrawn(true);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx && lastPos.current) {
          ctx.beginPath();
          ctx.arc(lastPos.current.x, lastPos.current.y, 1.5, 0, 2 * Math.PI);
          ctx.fillStyle = "#0f172a";
          ctx.fill();
        }
      }
    };

    const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || !lastPos.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      const currentPos = getCoordinates(e);

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPos.current = currentPos;
    };

    const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDrawing.current = false;
      lastPos.current = null;
    };

    if (!mounted) {
      return (
        <div
          data-testid="technician-signature-pad"
          className={cn(
            "animate-pulse rounded-2xl bg-slate-100",
            fillHeight ? "min-h-[120px] flex-1" : "h-[200px]",
            className
          )}
          aria-hidden
        />
      );
    }

    return (
      <div
        data-testid="technician-signature-pad"
        className={cn(
          "touch-none overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-inner",
          fillHeight && "flex min-h-0 flex-1 flex-col",
          className
        )}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
          onPointerCancel={stopDrawing}
          className={cn("w-full touch-none", fillHeight ? "min-h-[120px] flex-1" : "h-[200px]")}
          aria-label="Signature client"
          style={{ touchAction: "none" }}
        />
      </div>
    );
  }
);

export default TechnicianSignaturePad;
