"use client";

import useConversation from "@/hooks/useConversation";
import { useUser } from "@clerk/nextjs";
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  RoomContext,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Room, Track } from "livekit-client";
import { useEffect, useState } from "react";

type CallRoomProps = {
  callType: "audio" | "video";
};

export default function CallRoom({ callType }: CallRoomProps) {
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
    if (!user?.fullName) {
      console.log("No user fullName available");
      return;
    }

    console.log("Starting call setup...");
    let mounted = true;
    (async () => {
      try {
        console.log("Fetching token...");
        const resp = await fetch(
          `/api/livekit?room=${conversationId}&username=${user.fullName}`
        );
        console.log("Token response received");
        const data = await resp.json();
        console.log("Token data:", data);

        if (!mounted) {
          console.log("Component unmounted, stopping...");
          return;
        }

        if (data.token) {
          const livekitUrl = process.env.LIVEKIT_URL!.startsWith("wss://")
            ? process.env.LIVEKIT_URL
            : `wss://${process.env.LIVEKIT_URL}`;
          console.log("LiveKit URL:", livekitUrl);
          console.log("Token:", data.token);
          console.log("Attempting to connect to LiveKit...");
          await roomInstance.connect(livekitUrl, data.token);
          console.log("Connected to LiveKit successfully");
        } else {
          console.log("No token received from server");
        }
        setToken(data.token);
      } catch (e) {
        console.error("LiveKit connection error:", e);
      }
    })();

    return () => {
      console.log("Cleaning up call...");
      mounted = false;
      roomInstance.disconnect();
    };
  }, [roomInstance, user?.fullName, conversationId]);

  if (token === "") {
    return <div>Getting token...</div>;
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: "100dvh" }}>
        {/* Your custom component with basic video conferencing functionality. */}
        <MyVideoConference callType={callType} />
        {/* The RoomAudioRenderer takes care of room-wide audio for you. */}
        <RoomAudioRenderer />
        {/* Controls for the user to start/stop audio, video, and screen share tracks */}
        <ControlBar />
      </div>
    </RoomContext.Provider>
  );
}

type MyVideoConferenceProps = {
  callType: "audio" | "video";
};

function MyVideoConference({ callType }: MyVideoConferenceProps) {
  // `useTracks` returns all camera and screen share tracks. If a user
  // joins without a published camera track, a placeholder track is returned.
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: callType === "video" },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  if (callType === "audio") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Audio Call</h2>
          <p className="text-muted-foreground">Audio call in progress...</p>
        </div>
      </div>
    );
  }

  return (
    <GridLayout
      tracks={tracks}
      style={{ height: "calc(100vh - var(--lk-control-bar-height))" }}
    >
      {/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
      <ParticipantTile />
    </GridLayout>
  );
}
