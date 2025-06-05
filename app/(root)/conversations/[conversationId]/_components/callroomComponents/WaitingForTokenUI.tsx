import { Phone } from "lucide-react";

export default function WaitingForTokenUI() {
  return (
    <div className="h-full flex items-center justify-center  bg-gradient-to-br from-slate-700 to-slate-800">
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
