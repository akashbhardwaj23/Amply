"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { ChargerType } from "@/types";

interface VoiceCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargerData : ChargerType[]
}

export function VoiceCommandDialog({
  open,
  onOpenChange,
  chargerData
}: VoiceCommandDialogProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [response, setResponse] = useState("");
  // const [cData, setCData] = useState<ChargerType[]>([])
  //@ts-ignore
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  

  console.log(chargerData)
  const transcriptRef = useRef("")

// Update transcriptRef.current whenever transcript changes
useEffect(() => {
  transcriptRef.current = transcript
}, [transcript])

  async function parseCommandWithAI(command: string) {
    setProcessing(true);
    setResponse("Analyzing your command...");

    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: command, chargerData }),
      });

      
      const data = await res.json();
      console.log("data is ", data)
      if (data.parsed) {
        const { location, power, maxPrice, chargerType } = data.parsed;

        setResponse(
          `Filtering stations in ${location || "any location"} with power ${
            power || "any"
          } kW, price under ${maxPrice || "any"} SOL, charger type ${
            chargerType || "any"
          }.`
        );

        // TODO: Use these filters to update your map or station list
        // e.g., router.push(`/map?location=${location}&power=${power}&maxPrice=${maxPrice}&chargerType=${chargerType}`)
      } else {
        setResponse("Sorry, I couldn't understand your command.");
      }
    } catch (error) {
      setResponse("Error processing your command.");
    } finally {
      setProcessing(false);
    }
  }

  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    //@ts-ignore
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk;
        } else {
          interimTranscript += transcriptChunk;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setProcessing(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const latestTranscript = transcriptRef.current.trim()
      console.log("transcript ", latestTranscript)
      if (latestTranscript) {
        parseCommandWithAI(latestTranscript);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // Start or stop recognition when isListening changes
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      setTranscript("");
      setResponse("");
      setProcessing(false);
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Sometimes start throws if called multiple times quickly
        console.warn("Speech recognition start error:", e);
      }
    } else {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Process voice command
  const processCommand = (command: string) => {
    setProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      setProcessing(false);

      const lowerCommand = command.toLowerCase();

      if (lowerCommand.includes("find") || lowerCommand.includes("show")) {
        setResponse("I'll show you charging stations on the map.");
        setTimeout(() => {
          onOpenChange(false);
          router.push("/map");
        }, 2000);
      } else if (lowerCommand.includes("navigate")) {
        setResponse("Getting directions to the closest charging station.");
        setTimeout(() => {
          onOpenChange(false);
          router.push("/map");
        }, 2000);
      } else if (lowerCommand.includes("price")) {
        setResponse(
          "The current price at SolCharge Downtown is 0.25 SOL per kWh."
        );
      } else if (lowerCommand.includes("register")) {
        setResponse("I'll take you to the station registration page.");
        setTimeout(() => {
          onOpenChange(false);
          router.push("/register-station");
        }, 2000);
      } else {
        setResponse("I'm sorry, I didn't understand that command.");
      }
    }, 1500);
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsListening(false);
      setTranscript("");
      setProcessing(false);
      setResponse("");
    }
  }, [open]);

  // Toggle listening state
  const toggleListening = () => {
    if (processing) return;
    setIsListening((prev) => !prev);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Commands</DialogTitle>
          <DialogDescription>
            Speak a command to control the app hands-free
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="h-16 w-16 rounded-full"
            disabled={processing}
            aria-label={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          <div className="mt-4 text-center">
            {isListening ? (
              <p>Listening...</p>
            ) : (
              <p className="text-muted-foreground">
                {processing ? "Processing..." : "Press the button and speak"}
              </p>
            )}
          </div>

          {transcript && (
            <div className="mt-6 w-full">
              <p className="font-medium mb-1">You said:</p>
              <div className="bg-muted p-3 rounded-md">"{transcript}"</div>
            </div>
          )}

          {processing && (
            <div className="mt-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Processing your request...</span>
            </div>
          )}

          {response && (
            <div className="mt-6 w-full">
              <p className="font-medium mb-1">Response:</p>
              <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-md border border-rose-200 dark:border-rose-800">
                {response}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
