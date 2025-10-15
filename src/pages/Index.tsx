import { useState, useRef } from "react";
import { AudioRecorder } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TranscriptSegment from "@/components/TranscriptSegment";
import RecordingControls from "@/components/RecordingControls";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  speakerIndex: number;
}

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const speakerCountRef = useRef(0);
  const { toast } = useToast();

  const handleAudioData = async (audioBlob: Blob) => {
    if (isPaused) return;

    setIsTranscribing(true);
    setError(null);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Send to transcription function
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw new Error(error.message);

        if (data.text && data.text.trim()) {
          const newTranscript: TranscriptItem = {
            id: Date.now().toString(),
            speaker: `Speaker ${speakerCountRef.current + 1}`,
            text: data.text,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            }),
            speakerIndex: speakerCountRef.current,
          };
          
          setTranscripts(prev => [...prev, newTranscript]);
          speakerCountRef.current +=1;
        }
      };
    } catch (error: any) {
      console.error('Transcription error:', error);
      const errorMessage = error.message || "Failed to transcribe audio. Please try again.";
      setError(errorMessage);
      toast({
        title: "Transcription Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleStart = async () => {
    try {
      recorderRef.current = new AudioRecorder(handleAudioData);
      await recorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setTranscripts([]);
      speakerCountRef.current = 0;
      setError(null)
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for best transcription results.",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      const errorMessage = "Could not access microphone. Please check permissions.";
      setError(errorMessage);
      toast({
        title: "Recording Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleStop = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    
    toast({
      title: "Recording Stopped",
      description: "Your transcript is ready.",
    });
  };

  const handlePause = () => {
    if (recorderRef.current) {
      recorderRef.current.pause();
      setIsPaused(true);
      
      toast({
        title: "Recording Paused",
        description: "Click resume to continue.",
      });
    }
  };

  const handleResume = () => {
    if (recorderRef.current) {
      recorderRef.current.resume();
      setIsPaused(false);
      
      toast({
        title: "Recording Resumed",
        description: "Transcription continuing...",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Live Transcriber
          </h1>
          <p className="text-muted-foreground">
            Record and transcribe conversations in real-time
          </p>
        </div>

        {/* Recording Interface */}
        <Card className="p-6 mb-6">
          <div className="space-y-6">
            {/* Waveform Visualizer */}
            <div className="bg-muted/30 rounded-lg p-4">
              <WaveformVisualizer isActive={isRecording && !isPaused} />
            </div>

            {/* Status */}
            <div className="text-center">
              {isRecording && (
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-sm font-medium">
                    {isPaused ? 'Paused' : 'Recording'}
                    {isTranscribing && ' • Transcribing...'}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-center">
              <RecordingControls
                isRecording={isRecording}
                isPaused={isPaused}
                onStart={handleStart}
                onStop={handleStop}
                onPause={handlePause}
                onResume={handleResume}
              />
            </div>
          </div>
        </Card>

        {/* Transcript Display */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Transcript</h2>
          <ScrollArea className="h-[500px] pr-4">
            {error && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {transcripts.length === 0 && !isRecording && !error && (
              <div className="text-center text-muted-foreground py-12">
                <p className="mb-2">Welcome! Click "Start Recording" to begin.</p>
                <p className="text-xs">Your live transcript will appear here.</p>
              </div>
            )}
            {transcripts.length === 0 && isRecording && !error && (
              <div className="text-center text-muted-foreground py-12">
                <p>Listening...</p>
              </div>
            )}
            {transcripts.length > 0 && (
              <div className="space-y-2">
                {transcripts.map((transcript) => (
                  <TranscriptSegment
                    key={transcript.id}
                    speaker={transcript.speaker}
                    text={transcript.text}
                    timestamp={transcript.timestamp}
                    speakerIndex={transcript.speakerIndex}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default Index;
