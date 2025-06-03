"use client";

import { Dialog } from "@/components/ui/dialog";
import useConversation from "@/hooks/useConversation";
import { useUser } from "@clerk/nextjs";
import {
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  RoomContext,
  useLocalParticipant,
  useRoomContext,
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
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CallRoomProps = {
  callType: "audio" | "video";
  setCallType: (type: "audio" | "video" | null) => void;
};

// ==========================================
// PORTAL WRAPPER - MAIN DIALOG CONTAINER
// ==========================================
// This is where you can:
// - Handle incoming call acceptance/rejection
// - Add call ringing sounds
// - Manage call states (incoming, connecting, connected, ended)
function CallDialog({ callType, setCallType }: CallRoomProps) {
  const [mounted, setMounted] = useState(false);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null); // Added type for portalNode
  const isOpen = callType === "audio" || callType === "video";

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
          <div className="flex justify-center items-center p-0 border-none overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 fixed  inset-07 sm:inset-[40px] z-[100]">
            <div className=" h-full w-full relative">
              <CallRoom callType={callType} setCallType={setCallType} />
            </div>
          </div>,
          portalNode
        )}
    </Dialog>
  );
}

// ==========================================
// MAIN CALL ROOM COMPONENT
// ==========================================
// This handles the core call functionality and UI states
export default function CallRoom({ callType, setCallType }: CallRoomProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [token, setToken] = useState("");
  const { conversationId } = useConversation();
  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // *** LIVEKIT ROOM INSTANCE ***
  // This is where the actual WebRTC connection happens
  const [roomInstance] = useState(
    () =>
      new Room({
        adaptiveStream: true,
        dynacast: true,
      })
  );

  // *** CALL DURATION TIMER ***
  // You can customize this to show different time formats
  // Or add call time limits
  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // ==========================================
  // CONNECTION LOGIC & CALL ACCEPTANCE
  // ==========================================
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.fullName) return;

    let mounted = true;

    (async () => {
      try {
        // *** API CALL TO GET LIVEKIT TOKEN ***
        // This is where you can add call acceptance logic
        // For incoming calls, you might want to show accept/reject UI first
        const resp = await fetch(
          `/api/livekit?room=${conversationId}&username=${user.fullName}`
        );
        const data = await resp.json();

        if (!mounted) return;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
        if (!livekitUrl) throw new Error("LiveKit URL not set");

        const wsUrl = livekitUrl.startsWith("wss://")
          ? livekitUrl
          : `wss://${livekitUrl}`;

        // *** ACTUAL ROOM CONNECTION ***
        // This is where the call gets established
        await roomInstance.connect(wsUrl, data.token);

        console.log("✅ Connected to room");
        setToken(data.token);

        // *** PARTICIPANT METADATA ***
        // You can add more user info here (avatar, status, etc.)
        roomInstance.localParticipant.setMetadata(
          JSON.stringify({
            username: user.fullName,
            joinedAt: new Date().toISOString(),
            // Add more metadata like: avatar, userType, etc.
          })
        );

        // *** CALL EVENTS YOU CAN HANDLE ***
        // roomInstance.on('participantConnected', (participant) => {
        //   console.log('Someone joined the call');
        // });
        // roomInstance.on('participantDisconnected', (participant) => {
        //   console.log('Someone left the call');
        // });
      } catch (e) {
        console.error("LiveKit connection error:", e);
        // *** ERROR HANDLING ***
        // You can show error UI here or retry logic
      }
    })();

    // *** CLEANUP ON COMPONENT UNMOUNT ***
    // This handles call termination
    return () => {
      mounted = false;
      console.log("👋 Disconnecting...");
      roomInstance.disconnect();
    };
  }, [roomInstance, user?.fullName, conversationId, isLoaded, isSignedIn]);

  // *** TIME FORMATTING UTILITY ***
  // Customize how call duration is displayed
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // LOADING STATES - CUSTOMIZE THESE UIs
  // ==========================================

  // *** USER DATA LOADING STATE ***
  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          {/* Customize loading spinner here */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  // *** AUTHENTICATION ERROR STATE ***
  if (!isSignedIn) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          {/* Customize auth error UI here */}
          <Phone className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <p>Please sign in to join the call</p>
        </div>
      </div>
    );
  }

  // *** CONNECTION LOADING STATE ***
  if (token === "") {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          {/* Customize connecting UI here - you can add ringing sounds */}
          <div className="animate-pulse">
            <Phone className="h-16 w-16 mx-auto mb-4 text-blue-400" />
            <p>Connecting...</p>
            {/* Add ringing animation or sound here */}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN CONNECTED CALL UI
  // ==========================================
  return (
    <RoomContext.Provider value={roomInstance}>
      {/* 
        *** MAIN CALL CONTAINER ***
        - Modify background colors/gradients here
        - Add custom backgrounds or patterns
      */}
      <div className="h-full flex bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* ==========================================
            CALL HEADER - TOP BAR
            ========================================== */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/30 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between gap-7 text-white">
            {/* *** USER INFO SECTION *** */}
            <div className="flex items-center gap-2">
              {" "}
              {/* Added gap-2 for spacing */}
              {/* 
                *** USER AVATAR ***
                - Replace with actual user avatar
                - Add online status indicators
                - Customize avatar styling
              */}
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {user?.fullName?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                {/* *** USER NAME DISPLAY *** */}
                <p className="font-medium">{user?.fullName}</p>
                {/* *** CALL DURATION DISPLAY *** */}
                <p className="text-sm text-gray-300">
                  {formatDuration(callDuration)}
                </p>
              </div>
            </div>

            {/* *** MINIMIZE/MAXIMIZE BUTTON *** */}
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

        {/* ==========================================
            MAIN VIDEO/AUDIO AREA
            ========================================== */}
        <div
          className={`transition-all duration-300 mx-auto my-auto w-full h-full flex items-center justify-center ${isMinimized ? "scale-75 " : ""}`} // Ensure this container allows MyVideoConference to take space
        >
          {/* This component handles video/audio display */}
          <MyVideoConference callType={callType} />
        </div>

        {/* *** AUDIO RENDERER *** */}
        {/* This handles the actual audio playback - don't remove */}
        <RoomAudioRenderer />

        {/* ==========================================
            CALL CONTROLS - BOTTOM BAR
            ========================================== */}
        <CustomControlBar callType={callType} setCallType={setCallType} />

        {/* ==========================================
            DECORATIVE ELEMENTS
            ========================================== */}
        {/* 
          *** ANIMATED BACKGROUND DOTS ***
          - Customize colors, sizes, positions
          - Add more decorative elements
          - Change animation types
        */}
        {/* <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></div>
          <div
            className="absolute top-32 right-16 w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 left-8 w-1.5 h-1.5 bg-blue-300/40 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div> */}
      </div>
    </RoomContext.Provider>
  );
}

// ==========================================
// VIDEO CONFERENCE DISPLAY COMPONENT
// ==========================================
type MyVideoConferenceProps = {
  callType: "audio" | "video";
};

function MyVideoConference({ callType }: MyVideoConferenceProps) {
  // *** TRACK MANAGEMENT ***
  // This gets video/audio tracks from participants
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: callType === "video" },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // ==========================================
  // AUDIO CALL UI
  // ==========================================
  if (callType === "audio") {
    return (
      <div className="flex items-center justify-center flex-1 ">
        <div className="text-center text-white">
          {/* *** AUDIO CALL AVATAR SECTION *** */}
          <div className="relative mb-8">
            {/* 
              *** MAIN AVATAR CIRCLE ***
              - Replace with actual user avatar
              - Customize gradient colors
              - Add user profile pictures
            */}
            <div className="w-48 h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Volume2 className="h-24 w-24 text-white animate-pulse" />
            </div>

            {/* *** ANIMATED RINGS AROUND AVATAR *** */}
            {/* Customize ring colors, sizes, animation speeds */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping"></div>
            <div
              className="absolute inset-4 rounded-full border-2 border-white/20 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>

          {/* *** AUDIO CALL TEXT *** */}
          <h2 className="text-2xl font-light mb-2">Audio Call</h2>
          <p className="text-gray-300">Connected</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIDEO CALL UI
  // ==========================================
  return (
    // This container was flex-1, ensure it takes up space for GridLayout to work
    // It also handles padding for the video area away from header/controls
    <div className="w-full h-full flex items-center justify-center pt-20 pb-32 px-4">
      {/* 
        *** VIDEO GRID LAYOUT ***
        - Customize video tile appearance
        - Modify grid layout for multiple participants
        - Add picture-in-picture functionality
      */}
      <GridLayout
        tracks={tracks}
        // MODIFICATION: Added flex flex-col for small screens, md:grid for medium and up
        className="flex flex-col md:grid h-full w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* *** INDIVIDUAL VIDEO TILES *** */}
        {/* ParticipantTile will be cloned by GridLayout for each track.
            Ensure tiles can grow/shrink within the flex/grid layout.
            LiveKit's default styling for ParticipantTile should handle this.
            Adding h-full for flex-col case if needed.
         */}
        <ParticipantTile className="rounded-2xl" />
      </GridLayout>
    </div>
  );
}

// ==========================================
// CALL CONTROLS BAR
// ==========================================
type CustomControlBarProps = {
  callType: "audio" | "video";
  setCallType: (type: "audio" | "video" | null) => void;
};

function CustomControlBar({ callType, setCallType }: CustomControlBarProps) {
  const room = useRoomContext();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled } =
    useLocalParticipant();

  // *** MICROPHONE TOGGLE HANDLER ***
  const toggleMic = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    // Add haptic feedback or sound effects here
  };

  // *** CAMERA TOGGLE HANDLER ***
  const toggleCam = () => {
    localParticipant.setCameraEnabled(!isCameraEnabled);
    // Add haptic feedback or sound effects here
  };

  // *** CALL TERMINATION HANDLER ***
  const leaveRoom = () => {
    console.log("👋 Leaving room");

    // *** ADD CONFIRMATION DIALOG HERE ***
    // const confirmed = window.confirm("Are you sure you want to end the call?");
    // if (!confirmed) return;

    // *** DISCONNECT FROM ROOM ***
    room.disconnect();

    // *** CLOSE CALL UI ***
    setCallType(null);

    // *** ADD POST-CALL ACTIONS ***
    // - Save call duration to database
    // - Show call rating dialog
    // - Navigate to specific page
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md p-6">
      <div className="flex justify-center items-center space-x-6">
        {/* ==========================================
            MICROPHONE CONTROL BUTTON
            ========================================== */}
        <button
          onClick={toggleMic}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            isMicrophoneEnabled
              ? "bg-gray-700/80 hover:bg-gray-600/80 text-white" // *** UNMUTED STYLING ***
              : "bg-red-500 hover:bg-red-600 text-white animate-pulse" // *** MUTED STYLING ***
          }`}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-6 w-6" />
          ) : (
            <MicOff className="h-6 w-6" />
          )}
        </button>

        {/* ==========================================
            END CALL BUTTON
            ========================================== */}
        {/* 
          *** MAIN CALL TERMINATION BUTTON ***
          - This is the primary action button
          - Customize colors and animations
          - Add confirmation dialogs
        */}
        <button
          onClick={leaveRoom}
          className="w-20 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg transform hover:scale-105 active:scale-95"
        >
          <PhoneOff className="h-7 w-7 text-white" />
        </button>

        {/* ==========================================
            CAMERA CONTROL BUTTON (VIDEO CALLS ONLY)
            ========================================== */}
        {callType === "video" && (
          <button
            onClick={toggleCam}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isCameraEnabled
                ? "bg-gray-700/80 hover:bg-gray-600/80 text-white" // *** CAMERA ON STYLING ***
                : "bg-gray-800 hover:bg-gray-700 text-red-400" // *** CAMERA OFF STYLING ***
            }`}
          >
            {isCameraEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </button>
        )}

        {/* ==========================================
            ADD MORE CONTROL BUTTONS HERE
            ========================================== */}
        {/* 
          You can add more buttons like:
          - Screen share button
          - Chat button
          - Settings button
          - Participant list button
          - Record button
        */}
      </div>
    </div>
  );
}

// Export the portal wrapper as the main component
export { CallDialog };

// ==========================================
// ADDITIONAL FEATURES YOU CAN ADD:
// ==========================================
/*
1. INCOMING CALL HANDLING:
   - Add a separate IncomingCallDialog component
   - Show caller info, accept/reject buttons
   - Play ringtone sounds

2. CALL STATES:
   - enum CallState { IDLE, INCOMING, OUTGOING, CONNECTING, CONNECTED, ENDED }
   - Different UI for each state

3. CALL ACCEPTANCE FLOW:
   - Show accept/reject buttons before connecting
   - Add call preparation (audio/video permissions)

4. ERROR HANDLING:
   - Connection failed states
   - Network quality indicators
   - Retry mechanisms

5. ADDITIONAL CONTROLS:
   - Screen sharing
   - Chat during call
   - Participant management
   - Call recording
   - Virtual backgrounds

6. NOTIFICATIONS:
   - Browser notifications for incoming calls
   - Sound effects for actions
   - Vibration on mobile

7. CALL QUALITY:
   - Network quality indicators
   - Audio/video quality settings
   - Bandwidth monitoring

8. POST-CALL FEATURES:
   - Call duration tracking
   - Call history
   - Call ratings/feedback
   - Call summaries
*/
