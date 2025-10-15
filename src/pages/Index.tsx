import { useState, useRef } from "react";
import { AudioRecorder } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TranscriptSegment from "@/components/TranscriptSegment";
import RecordingControls from "@/components/RecordingControls";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  speakerColor: string;
}

const SPEAKER_COLORS = [
  'bg-[hsl(var(--speaker-1))]',
  'bg-[hsl(var(--speaker-2))]',
  'bg-[hsl(var(--speaker-3))]',
  'bg-[hsl(var(--speaker-4))]',
];

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const speakerCountRef = useRef(0);
  const { toast } = useToast();

  const getNextSpeakerColor = () => {
    const color = SPEAKER_COLORS[speakerCountRef.current % SPEAKER_COLORS.length];
    speakerCountRef.current += 1;
    return color;
  };

  const handleAudioData = async (audioBlob: Blob) => {
    if (isPaused) return;

    setIsTranscribing(true);
    
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

        if (error) throw error;

        if (data.text && data.text.trim()) {
          const newTranscript: TranscriptItem = {
            id: Date.now().toString(),
            speaker: `Speaker ${Math.floor(speakerCountRef.current / 2) + 1}`,
            text: data.text,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            }),
            speakerColor: getNextSpeakerColor(),
          };

          setTranscripts(prev => [...prev, newTranscript]);
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again.",
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
      speakerCountRef.current = 0;
      
      toast({
        title: "Recording Started",
        description: "Speak clearly for best transcription results.",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Recording Failed",
        description: "Could not access microphone. Please check permissions.",
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
            {transcripts.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>Start recording to see your transcript here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transcripts.map((transcript) => (
                  <TranscriptSegment
                    key={transcript.id}
                    speaker={transcript.speaker}
                    text={transcript.text}
                    timestamp={transcript.timestamp}
                    speakerColor={transcript.speakerColor}
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
