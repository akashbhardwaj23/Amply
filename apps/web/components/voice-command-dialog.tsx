"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"

interface VoiceCommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VoiceCommandDialog({ open, onOpenChange }: VoiceCommandDialogProps) {
  const router = useRouter()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [processing, setProcessing] = useState(false)
  const [response, setResponse] = useState("")

  // Toggle listening state
  const toggleListening = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // In a real app, this would start the speech recognition
      setTranscript("")
      setResponse("")

      // Simulate speech recognition
      const simulatedCommands = [
        "Find charging stations near me",
        "Show available stations only",
        "Navigate to the closest station",
        "What's the price at SolCharge Downtown?",
        "Register my new charging station",
      ]

      const randomCommand = simulatedCommands[Math.floor(Math.random() * simulatedCommands.length)]

      // Simulate typing effect for transcript
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < randomCommand.length) {
          setTranscript(randomCommand.substring(0, i + 1))
          i++
        } else {
          clearInterval(typingInterval)
          setIsListening(false)
          processCommand(randomCommand)
        }
      }, 100)
    }
  }

  // Process voice command
  const processCommand = (command: string) => {
    setProcessing(true)

    // Simulate AI processing
    setTimeout(() => {
      setProcessing(false)

      // Generate response based on command
      if (command.includes("find") || command.includes("show")) {
        setResponse("I'll show you charging stations on the map.")
        setTimeout(() => {
          onOpenChange(false)
          router.push("/map")
        }, 2000)
      } else if (command.includes("navigate")) {
        setResponse("Getting directions to the closest charging station.")
        setTimeout(() => {
          onOpenChange(false)
          router.push("/map")
        }, 2000)
      } else if (command.includes("price")) {
        setResponse("The current price at SolCharge Downtown is 0.25 SOL per kWh.")
      } else if (command.includes("register")) {
        setResponse("I'll take you to the station registration page.")
        setTimeout(() => {
          onOpenChange(false)
          router.push("/register-station")
        }, 2000)
      } else {
        setResponse("I'm sorry, I didn't understand that command.")
      }
    }, 1500)
  }

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsListening(false)
      setTranscript("")
      setProcessing(false)
      setResponse("")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Commands</DialogTitle>
          <DialogDescription>Speak a command to control the app hands-free</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="h-16 w-16 rounded-full"
            disabled={processing}
          >
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <div className="mt-4 text-center">
            {isListening ? (
              <p>Listening...</p>
            ) : (
              <p className="text-muted-foreground">{processing ? "Processing..." : "Press the button and speak"}</p>
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
  )
}
