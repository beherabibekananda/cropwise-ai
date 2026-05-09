import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/app/TopBar";
import { UploadZone } from "@/components/app/UploadZone";
import { AIProcessingLoader } from "@/components/app/AIProcessingLoader";
import { DiseaseResultCard } from "@/components/app/DiseaseResultCard";
import { RecentScans } from "@/components/app/Widgets";
import { sampleDiseases, type DiseasePrediction } from "@/mock-data";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Disease Detection · CropSense AI" },
      { name: "description", content: "Upload a leaf image and get an instant AI-powered disease diagnosis with treatment plan." },
    ],
  }),
  component: Detection,
});

const SAMPLE_IMG =
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&auto=format&fit=crop";

type Stage = "upload" | "processing" | "result";

function Detection() {
  const [stage, setStage] = useState<Stage>("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [prediction, setPrediction] = useState<DiseasePrediction | null>(null);

  const start = (url: string, forced?: DiseasePrediction) => {
    setImageUrl(url);
    setPrediction(forced ?? sampleDiseases[Math.floor(Math.random() * sampleDiseases.length)]);
    setStage("processing");
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <TopBar title="Disease Detection" subtitle="Upload, scan, and get a treatment plan in seconds." />

      {stage === "upload" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UploadZone
              onFile={(url) => start(url)}
              onSample={() => start(SAMPLE_IMG, sampleDiseases[0])}
            />
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              {[
                ["38", "Crops covered"],
                ["124", "Disease classes"],
                ["98.6%", "Top-1 accuracy"],
              ].map(([v, l]) => (
                <div key={l} className="glass rounded-2xl p-4">
                  <div className="text-2xl font-semibold">{v}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <RecentScans limit={5} />
        </div>
      )}

      {stage === "processing" && (
        <AIProcessingLoader imageUrl={imageUrl} onDone={() => setStage("result")} />
      )}

      {stage === "result" && prediction && (
        <DiseaseResultCard
          imageUrl={imageUrl}
          prediction={prediction}
          onReset={() => setStage("upload")}
        />
      )}
    </div>
  );
}
