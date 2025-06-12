// Direct call connection without UI states

"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useCall } from "@/hooks/useCalls";
import useConversation from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import {
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  RoomContext,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Room, Track } from "livekit-client";
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Phone,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ControlButton from "../callroomComponents/ControlButton";
import "./call-room.css";

type CallRoomProps = {
  callType: "audio" | "video";
  setCallType: (type: "audio" | "video" | null) => void;
};

// PORTAL WRAPPER - MAIN DIALOG CONTAINER
function CallDialog({ callType, setCallType }: CallRoomProps) {
  const [mounted, setMounted] = useState(false);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const { incomingCalls } = useCall();
  const isOpen =
    callType === "audio" || callType === "video" || incomingCalls.length > 0;

  useEffect(() => {
    setMounted(true);
    const element = document.getElementById("call_room_portal");
    if (element) {
      setPortalNode(element);
    } else {
      console.warn("Portal target #call_room_portal not found.");
    }
  }, []);

  if (!mounted) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setCallType(null);
        }
      }}
    >
      {isOpen &&
        portalNode &&
        createPortal(
          <div className="flex justify-center items-center p-0 border-none rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 fixed inset-0 sm:inset-[0px] mx-40 my-10 z-[100]">
            <div className="h-full w-full relative">
              <Button
                onClick={() => {
                  setCallType(null);
                }}
                size="icon"
                className="absolute left-2 top-2 rounded-full size-[18px]"
                variant="destructive"
              >
                <X className="text-[46px]" />
              </Button>
              <CallRoom callType={callType} setCallType={setCallType} />
            </div>
          </div>,
          portalNode
        )}
    </Dialog>
  );
}

// MAIN CALL ROOM COMPONENT
export default function CallRoom({ callType, setCallType }: CallRoomProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [token, setToken] = useState("");
  const { conversationId } = useConversation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // LIVEKIT ROOM INSTANCE
  const [roomInstance] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      })
  );

  // CALL DURATION TIMER
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // DIRECT CONNECTION TO LIVEKIT
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.fullName || !conversationId) return;

    let mounted = true;

    (async () => {
      try {
        console.log("🚀 Connecting to LiveKit...");

        // Get LiveKit token
        const resp = await fetch(
          `/api/token?room=${conversationId}&username=${user.fullName}`
        );
        const data = await resp.json();

        if (!mounted) return;

        if (data.token) {
          // Connect to LiveKit room
          const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
          if (!livekitUrl) throw new Error("LiveKit URL not set");

          await roomInstance.connect(livekitUrl, data.token);

          console.log("✅ Connected to LiveKit room");
          setToken(data.token);
          setIsConnected(true);
        }
      } catch (e) {
        console.error("❌ Connection error:", e);
      }
    })();

    return () => {
      mounted = false;
      console.log("👋 Disconnecting from LiveKit...");
      roomInstance.disconnect();
      setIsConnected(false);
    };
  }, [roomInstance, user?.fullName, conversationId, isLoaded, isSignedIn]);

  // HANDLE ENDING CALL
  const handleEndCall = () => {
    console.log("🏁 Ending call");
    roomInstance.disconnect();
    setCallType(null);
    setIsConnected(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // LOADING STATES
  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
        <div className="text-center text-white">
          <Phone className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <p>Please sign in to join the call</p>
        </div>
      </div>
    );
  }

  // Show loading while connecting
  if (!isConnected || !token) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to call...</p>
        </div>
      </div>
    );
  }

  // DIRECT CALL INTERFACE
  return (
    <RoomContext.Provider value={roomInstance}>
      <div className="h-full flex bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
        {/* CALL HEADER */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between gap-7 text-white">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {user?.fullName?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-sm text-gray-300">
                  {formatDuration(callDuration)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="h-5 w-5" />
              ) : (
                <Minimize2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* MAIN VIDEO/AUDIO AREA */}
        <div
          className={`transition-all duration-300 mx-auto my-auto w-full h-full flex items-center justify-center ${
            isMinimized ? "scale-75 " : ""
          }`}
        >
          <MyVideoConference callType={callType} />
        </div>

        <RoomAudioRenderer />

        {/* CALL CONTROLS */}
        <CustomControlBar
          callType={callType}
          setCallType={setCallType}
          onEndCall={handleEndCall}
        />
      </div>
    </RoomContext.Provider>
  );
}

// VIDEO CONFERENCE COMPONENT
type MyVideoConferenceProps = {
  callType: "audio" | "video";
};

function MyVideoConference({ callType }: MyVideoConferenceProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: callType === "video" },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  if (callType === "audio") {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center text-white">
          <div className="relative mb-8">
            <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Volume2 className="h-24 w-24 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping"></div>
            <div
              className="absolute inset-4 rounded-full border-2 border-white/20 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
          <h2 className="text-2xl font-light mb-2">Audio Call</h2>
          <p className="text-gray-300">Connected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center pt-20 pb-32 px-4">
      <GridLayout
        tracks={tracks}
        className="flex flex-col md:grid h-full w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl"
      >
        <ParticipantTile className="rounded-2xl" />
      </GridLayout>
    </div>
  );
}

// CONTROL BAR
type CustomControlBarProps = {
  callType: "audio" | "video";
  setCallType: (type: "audio" | "video" | null) => void;
  onEndCall: () => void;
};

function CustomControlBar({ callType, onEndCall }: CustomControlBarProps) {
  const {
    localParticipant,
    isCameraEnabled,
    isMicrophoneEnabled,
    isScreenShareEnabled,
  } = useLocalParticipant();

  const toggleMic = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCam = () => {
    localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleShareScreen = () => {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md p-6 z-[999999]">
      <div className="flex justify-center items-center space-x-10 relative">
        <ControlButton
          handleClick={toggleMic}
          icon={MicOff}
          activeIcon={Mic}
          isActive={isMicrophoneEnabled}
          className={cn(
            isMicrophoneEnabled
              ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          )}
        />

        <ControlButton
          handleClick={onEndCall}
          icon={PhoneOff}
          className="bg-red-500 hover:bg-red-600 text-white"
        />

        {callType === "video" && (
          <ControlButton
            handleClick={toggleCam}
            icon={VideoOff}
            activeIcon={Video}
            isActive={isCameraEnabled}
            className={cn(
              isCameraEnabled
                ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-red-400"
            )}
          />
        )}

        <ControlButton
          handleClick={toggleShareScreen}
          icon={ScreenShare}
          activeIcon={ScreenShareOff}
          isActive={isScreenShareEnabled}
          className={cn(
            isScreenShareEnabled
              ? "bg-gray-700/80 hover:bg-gray-600/80 text-white"
              : "bg-gray-800 hover:bg-gray-700 text-red-400"
          )}
        />
      </div>
    </div>
  );
}

export { CallDialog };
