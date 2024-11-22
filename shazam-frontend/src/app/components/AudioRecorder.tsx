"use client";

import { useState, useRef } from "react";
import axios from "axios";

interface SongResult {
  title: string;
  artist: string;
  album: string;
  spotify?: {
    external_urls: {
      spotify: string;
    };
  };
}

export function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<SongResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        setIsLoading(true);
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        await identifySong(audioBlob);
        setIsLoading(false);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setResult(null);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error accessing microphone: ${err.message}`);
      } else {
        setError("Error accessing microphone");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const identifySong = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

      const response = await axios.post(
        "http://localhost:8000/api/identify",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.result) {
        setResult(response.data.result);
      } else if (response.data.error) {
        setError(response.data.error);
      } else {
        setError("No match found");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          `Error identifying song: ${err.response?.data?.error || err.message}`
        );
      } else {
        setError("Error identifying song");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-full font-semibold text-white transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={isLoading}
        >
          {isLoading
            ? "Processing..."
            : isRecording
            ? "Stop Recording"
            : "Start Recording"}
        </button>

        {isRecording && (
          <div className="text-sm text-gray-600 animate-pulse">
            Listening...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg w-full">
            {error}
          </div>
        )}

        {result && (
          <div className="w-full p-6 bg-red rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Found Match!</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Title:</span> {result.title}
              </p>
              <p>
                <span className="font-medium">Artist:</span> {result.artist}
              </p>
              <p>
                <span className="font-medium">Album:</span> {result.album}
              </p>
              {result.spotify && (
                <a
                  href={result.spotify.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-green-500 hover:text-green-600"
                >
                  Open in Spotify →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
