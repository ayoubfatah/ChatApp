"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import useConversation from "@/hooks/useConversation";
import useMutationState from "@/hooks/useMutationState";
import { Mic, MicOff, Pause, Play, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadThing";

interface AudioCaptureProps {
  onAudioSent?: () => void;
}

export default function AudioCapture({ onAudioSent }: AudioCaptureProps) {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { conversationId } = useConversation();
  const { mutate: createMessage, isPending: isSending } = useMutationState(
    api.message.create
  );

  const { startUpload, isUploading } = useUploadThing("file", {
    onClientUploadComplete: async (res) => {
      const url = res[0]?.ufsUrl;
      if (!url) return;
      console.log(url, "url nzb");
      await createMessage({
        conversationId: conversationId!,
        type: "audio",
        content: [url],
      });

      deleteRecording();
      onAudioSent?.();
      toast.success("Audio message sent!");
    },
    onUploadError: () => {
      toast.error("Failed to send audio message");
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder?.state === "recording") {
      mediaRecorder.pause();
      setPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder?.state === "paused") {
      mediaRecorder.resume();
      setPaused(false);
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
    setPaused(false);
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setRecording(false);
    setPaused(false);
    setMediaRecorder(null);
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    const file = new File([audioBlob], "voice-message.webm", {
      type: "audio/webm",
    });
    await startUpload([file]);
  };

  useEffect(() => {
    return () => {
      mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [mediaRecorder]);

  return (
    <Card className="p-4 flex flex-col gap-4 items-center justify-center text-center">
      {audioURL ? (
        <>
          <audio controls src={audioURL} ref={audioRef} />
          <div className="flex gap-4">
            <Button variant="destructive" onClick={deleteRecording}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button onClick={sendAudio} disabled={isUploading || isSending}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-4">
            {!recording ? (
              <Button onClick={startRecording}>
                <Mic className="w-4 h-4 mr-2" />
                Record
              </Button>
            ) : (
              <>
                {paused ? (
                  <Button onClick={resumeRecording}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={pauseRecording}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={stopRecording}>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
