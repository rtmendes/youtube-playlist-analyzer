import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Pause, Square, Trash2, Save, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceNote {
  id: string;
  audioBlob: Blob;
  audioUrl: string;
  transcript: string;
  duration: number;
  createdAt: Date;
  isEdited: boolean;
}

interface VoiceRecorderProps {
  onSave?: (note: VoiceNote) => void;
  trigger?: React.ReactNode;
  contextLabel?: string; // e.g., "Comment ID: xxx" or "Video: xxx"
}

export function VoiceRecorder({ onSave, trigger, contextLabel }: VoiceRecorderProps) {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setDuration(recordingTime);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start speech recognition if available
      startSpeechRecognition();

      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const startSpeechRecognition = () => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        if (recognitionRef.current) recognitionRef.current.start();
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
        if (recognitionRef.current) recognitionRef.current.stop();
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      toast.success("Recording stopped");
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
    setDuration(0);
    setRecordingTime(0);
    toast.success("Recording deleted");
  };

  const handleSave = () => {
    if (!audioBlob || !transcript.trim()) {
      toast.error("Please record audio and add a transcript");
      return;
    }

    const note: VoiceNote = {
      id: `voice_${Date.now()}`,
      audioBlob,
      audioUrl: audioUrl!,
      transcript: transcript.trim(),
      duration,
      createdAt: new Date(),
      isEdited: false,
    };

    if (onSave) {
      onSave(note);
    }

    // Save to localStorage as well
    saveToLocalStorage(note);

    toast.success("Voice note saved!");
    setOpen(false);
    
    // Reset state
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript("");
    setDuration(0);
    setRecordingTime(0);
  };

  const saveToLocalStorage = async (note: VoiceNote) => {
    try {
      // Convert blob to base64 for storage
      const reader = new FileReader();
      reader.readAsDataURL(note.audioBlob);
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        const savedNotes = JSON.parse(localStorage.getItem("voice_notes") || "[]");
        savedNotes.push({
          ...note,
          audioBlob: undefined,
          audioBase64: base64Audio,
        });
        localStorage.setItem("voice_notes", JSON.stringify(savedNotes));
      };
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Mic className="h-4 w-4" />
            Voice Note
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Record Voice Note
          </DialogTitle>
          <DialogDescription>
            Record your thoughts and insights. Speech will be automatically transcribed.
            {contextLabel && (
              <Badge variant="secondary" className="ml-2">
                {contextLabel}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Controls */}
          <Card className={cn(
            "transition-all",
            isRecording && "border-red-500 bg-red-500/5"
          )}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                {/* Timer Display */}
                <div className="text-4xl font-mono font-bold">
                  {formatTime(isRecording ? recordingTime : duration)}
                </div>

                {/* Recording Status */}
                {isRecording && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">
                      {isPaused ? "Paused" : "Recording..."}
                    </span>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex items-center gap-3">
                  {!isRecording && !audioUrl && (
                    <Button
                      size="lg"
                      onClick={startRecording}
                      className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                  )}

                  {isRecording && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={pauseRecording}
                        className="rounded-full w-12 h-12"
                      >
                        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                      </Button>
                      <Button
                        size="icon"
                        onClick={stopRecording}
                        className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
                      >
                        <Square className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {audioUrl && !isRecording && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={playAudio}
                        className="rounded-full w-12 h-12"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={deleteRecording}
                        className="rounded-full w-12 h-12 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={startRecording}
                        className="rounded-full w-12 h-12 bg-red-500 hover:bg-red-600"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Audio Element (hidden) */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transcript Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Transcript</label>
              {isTranscribing && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Transcribing...
                </Badge>
              )}
            </div>
            <Textarea
              placeholder="Your speech will appear here as you record, or you can type manually..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Edit the transcript as needed. Your changes will be saved with the voice note.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!audioBlob || !transcript.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Voice Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to display saved voice notes
interface VoiceNoteListProps {
  notes: VoiceNote[];
  onDelete?: (id: string) => void;
}

export function VoiceNoteList({ notes, onDelete }: VoiceNoteListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNote = (note: VoiceNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = note.audioUrl;
        audioRef.current.play();
        setPlayingId(note.id);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No voice notes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />
      {notes.map((note) => (
        <Card key={note.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => playNote(note)}
              >
                {playingId === note.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{note.transcript}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Volume2 className="h-3 w-3" />
                  <span>{formatTime(note.duration)}</span>
                  <span>•</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
