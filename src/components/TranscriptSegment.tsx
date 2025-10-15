import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TranscriptSegmentProps {
  speaker: string;
  text: string;
  timestamp: string;
  speakerIndex: number;
}

const SPEAKER_COLORS = [
  'bg-[hsl(var(--speaker-1))]',
  'bg-[hsl(var(--speaker-2))]',
  'bg-[hsl(var(--speaker-3))]',
  'bg-[hsl(var(--speaker-4))]',
];

const TranscriptSegment = ({ speaker, text, timestamp, speakerIndex }: TranscriptSegmentProps) => {
  const speakerColor = SPEAKER_COLORS[speakerIndex % SPEAKER_COLORS.length];
  return (
    <div className="flex gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg group">
      <Avatar className={`h-10 w-10 ${speakerColor} flex-shrink-0`}>
        <AvatarFallback className="text-white font-semibold">
          {speaker.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-foreground">{speaker}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <p className="text-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

export default TranscriptSegment;
