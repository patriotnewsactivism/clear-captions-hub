import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

const RecordingControls = ({
  isRecording,
  isPaused,
  onStart,
  onStop,
  onPause,
  onResume,
}: RecordingControlsProps) => {
  if (!isRecording) {
    return (
      <Button
        onClick={onStart}
        size="lg"
        className="gap-2 shadow-lg"
        aria-label="Start Recording"
      >
        <Mic className="h-5 w-5" />
        Start Recording
      </Button>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={isPaused ? onResume : onPause}
        size="lg"
        variant="secondary"
        className="gap-2"
        aria-label={isPaused ? "Resume Recording" : "Pause Recording"}
      >
        {isPaused ? (
          <>
            <Play className="h-5 w-5" />
            Resume
          </>
        ) : (
          <>
            <Pause className="h-5 w-5" />
            Pause
          </>
        )}
      </Button>
      <Button
        onClick={onStop}
        size="lg"
        variant="destructive"
        className="gap-2"
        aria-label="Stop Recording"
      >
        <Square className="h-5 w-5" />
        Stop
      </Button>
    </div>
  );
};

export default RecordingControls;
