import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isMuted: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isMuted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use a ResizeObserver to make sure the canvas matches its rendering size perfectly
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    });

    resizeObserver.observe(canvas);

    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameId = requestAnimationFrame(renderFrame);

      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with transparency so we blend with any background gradient/theme
      ctx.clearRect(0, 0, width, height);

      if (analyser && !isMuted) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Flatline / dummy quiet wave when inactive or muted
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 0;
        }
      }

      // We only want to display a subset of frequencies (the lower/mid voice spectrum is most interesting)
      const barCount = Math.min(32, bufferLength);
      const gap = 3;
      const totalGapsWidth = gap * (barCount - 1);
      const barWidth = (width - totalGapsWidth) / barCount;

      for (let i = 0; i < barCount; i++) {
        // Scale frequency data
        const value = dataArray[i];
        const percent = value / 255;
        
        // Add a tiny random idle bounce when not muted so it looks "alive" even when quiet
        const idleBounce = !isMuted && percent < 0.05 ? Math.sin(Date.now() * 0.005 + i) * 2 + 3 : 0;
        
        // Compute bar height with a minimum size so the spectrum is visible
        const barHeight = Math.max(4, percent * height + idleBounce);

        // Center vertically or align to bottom. Bottom-aligned is cleaner for an overlay or a status section
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        // Use a gorgeous indigo/violet/pink gradient based on index and intensity
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "#8b5cf6"); // violet-500
        gradient.addColorStop(0.5, "#6366f1"); // indigo-500
        gradient.addColorStop(1, "#ec4899"); // pink-500

        ctx.fillStyle = gradient;

        // Rounded rect for each bar
        const radius = barWidth / 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
          // Fallback simple rect
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [analyser, isMuted]);

  return (
    <div className="w-full h-12 bg-slate-950/40 backdrop-blur-md rounded-2xl p-2 border border-white/10 overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
