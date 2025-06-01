"use client";

import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from "@livekit/components-react";
import { Room, Track } from "livekit-client";
import "@livekit/components-styles";
import { useEffect, useState } from "react";
import useConversation from "@/hooks/useConversation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Props = {
  handleDisconnect: () => void;
  video: boolean;
  audio: boolean;
};

export default function CallRoom({ handleDisconnect, video, audio }: Props) {
  const { user } = useUser();
  const [token, setToken] = useState("");
  const { conversationId } = useConversation();

  const [roomInstance] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      })
  );

  useEffect(() => {
    if (!user?.fullName) return;

    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${conversationId}&username=${user.fullName} (${Math.ceil(Math.random() * 2000)})`
        );
        const data = await resp.json();
        if (!mounted) return;
        if (data.token) {
          await roomInstance.connect(
            process.env.NEXT_PUBLIC_LIVEKIT_URL,
            data.token
          );
        }
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
      roomInstance.disconnect();
    };
  }, [roomInstance, user?.fullName, conversationId]);

  // Handle disconnect
  useEffect(() => {
    const handleRoomDisconnect = () => {
      handleDisconnect();
    };

    roomInstance.on("disconnected", handleRoomDisconnect);

    return () => {
      roomInstance.off("disconnected", handleRoomDisconnect);
    };
  }, [roomInstance, handleDisconnect]);

  if (token === "") {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <Loader2 className="animate-spin h-16 w-16 text-foreground" />
        <p className="text-sm text-foreground">Joining Call ...</p>
        <Button
          variant="destructive"
          className="mt-4"
          onClick={handleDisconnect}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div className="w-full h-full" data-lk-theme="default">
        <MyVideoConference />
        <RoomAudioRenderer />
        <ControlBar
          variation="minimal"
          controls={{
            camera: video,
            microphone: audio,
          }}
        />
      </div>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );
  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      <ParticipantTile />
    </GridLayout>
  );
}
