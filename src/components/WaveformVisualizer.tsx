import { useEffect, useRef, useCallback } from "react";

interface WaveformVisualizerProps {
  isActive: boolean;
}

const WaveformVisualizer = ({ isActive }: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bars = 40;
    const barWidth = canvas.width / bars;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bars; i++) {
      const height = isActive 
        ? Math.random() * canvas.height * 0.8 + canvas.height * 0.1
        : canvas.height * 0.1;

      const x = i * barWidth;
      const y = (canvas.height - height) / 2;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'hsl(217, 91%, 60%)');
      gradient.addColorStop(1, 'hsl(262, 83%, 58%)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 2, height);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [isActive]);

  useEffect(() => {
    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={100}
      className="w-full h-24 rounded-lg"
    />
  );
};

export default WaveformVisualizer;
