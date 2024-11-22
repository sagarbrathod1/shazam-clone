"use client";

import { AudioRecorder } from "./components/AudioRecorder";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shazam Clone</h1>
        <AudioRecorder />
      </div>
    </main>
  );
}
