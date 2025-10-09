"use client";

import {  useMemo, useState } from "react";
import { Image, Sparkles, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VideoCarousel } from "@/components/samples/video-carousel";

const page = () => {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [prompt, setPrompt] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    null
  );
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");

  const sampleVideos = useMemo(
    () => [
      "https://file.aiquickdraw.com/tool-page/section-images/1749261554953b6uur7c1.mp4",
      "https://file.aiquickdraw.com/tool-page/section-images/17492615693187gxnrlz3.mp4",
      "https://file.aiquickdraw.com/tool-page/section-images/1749261582181vu4u218v.mp4",
    ],
    []
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type, file.size);
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log("FileReader result length:", result?.length);
        setImagePreview(result);
      };
      reader.onerror = () => {
        console.error("FileReader error");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleGenerate = async () => {
    try {
      setGeneratedVideoUrl(null);
      setIsGenerating(true);
      setGenerationProgress(0);
      setGenerationStatus("Starting generation...");

      let imageUrl: string | undefined = undefined;

      // Upload image to ImageKit if one is selected
      if (selectedImage) {
        setGenerationStatus("Uploading image...");
        setGenerationProgress(5);
        console.log("Uploading image to ImageKit...", selectedImage.name);
        const formData = new FormData();
        formData.append("file", selectedImage);
        formData.append("fileName", selectedImage.name);

        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData?.error || "Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
        console.log("Image uploaded successfully:", imageUrl);
      }

      setGenerationStatus("Sending request to AI...");
      setGenerationProgress(10);

      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageUrl,
          aspectRatio,
          model: "veo3_fast",
          enableFallback: true,
          enableTranslation: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          throw new Error(
            "Insufficient tokens! You need at least 10 tokens to generate a video. Please contact support to get more tokens."
          );
        } else if (res.status === 401) {
          throw new Error("Please sign in to generate videos.");
        } else {
          throw new Error(data?.error || "Failed to start generation");
        }
      }

      setTaskId(data.taskId);
      setGenerationStatus("Video generation started...");
      setGenerationProgress(15);

      // Polling loop with progress simulation
      const start = Date.now();
      const timeoutMs = 5 * 60 * 1000; // 5 minutes
      const intervalMs = 10000; // 10 seconds
      const totalDuration = 3 * 60 * 1000; // 3 minutes for progress simulation
      let done = false;
      let pollCount = 0;

      // Wait a bit before first check to allow task to be processed
      await new Promise((r) => setTimeout(r, 2000));

      while (!done && Date.now() - start < timeoutMs) {
        pollCount++;
        console.log(
          "Checking video status...",
          data.taskId,
          `(poll ${pollCount})`
        );

        // Simulate progress based on time elapsed (up to 90% before completion)
        const elapsed = Date.now() - start;
        const simulatedProgress = Math.min(
          15 + (elapsed / totalDuration) * 75,
          90
        );
        setGenerationProgress(Math.round(simulatedProgress));

        const detailsRes = await fetch(
          `/api/video/details?taskId=${encodeURIComponent(data.taskId)}`
        );
        const details = await detailsRes.json();

        if (!detailsRes.ok) {
          console.error("Details fetch failed:", details);
          throw new Error(details?.error || "Failed to fetch details");
        }

        const status = details?.data?.status;
        const url = details?.data?.videoUrl;

        if (status === "completed" && url) {
          setGenerationProgress(100);
          setGenerationStatus("Video completed!");
          setGeneratedVideoUrl(url);
          done = true;
        } else if (status === "failed") {
          throw new Error("Video generation failed");
        } else {
          // Update status based on progress
          if (simulatedProgress < 30) {
            setGenerationStatus("Processing your request...");
          } else if (simulatedProgress < 60) {
            setGenerationStatus("AI is creating your video...");
          } else if (simulatedProgress < 90) {
            setGenerationStatus("Finalizing video details...");
          } else {
            setGenerationStatus("Almost done...");
          }
        }

        if (!done) {
          await new Promise((r) => setTimeout(r, intervalMs));
        }
      }

      if (!generatedVideoUrl && Date.now() - start >= timeoutMs) {
        throw new Error("Video generation timed out");
      }
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col pb-6 pt-20">
        <div className="flex lg:flex-row flex-col items-center justify-center">
          <div className="flex-1 flex flex-col justify-center w-full min-w-0">
            <div className="max-w-4xl w-full text-center mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">
                Welcome to Vimeo AI
              </h1>
              <p className="mt-3 text-gray-600 dark:text-neutral-400">
                Your AI-powered video generator for the web
              </p>
            </div>

            {/* Video Generation Form */}
            <div className="mt-10 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-6 min-w-0">
                {/* Prompt Input */}
                <div className="relative w-full min-w-0">
                  <Textarea
                    rows={1}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full resize-none pr-20 max-h-24 overflow-y-auto min-w-0 break-words"
                    placeholder="Describe the video you want to create... (e.g., A monkey using a smartphone to showcase a new app)"
                    style={{
                      minHeight: "4rem",
                      maxHeight: "9rem", // 4 rows * 1.5rem line height
                      lineHeight: "1.5rem",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                  />
                  <div className="absolute top-3 end-3 flex gap-2">
                    <label
                      htmlFor="image-upload"
                      className="size-8 inline-flex justify-center items-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                      title="Upload reference image"
                    >
                      <Image size={16} />
                    </label>
                    <input
                      type="file"
                      id="image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                {/* Image Preview */}
                {selectedImage && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                        Reference Image
                      </h3>
                      <button
                        onClick={clearImage}
                        className="text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 text-lg"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>

                    <div className="relative bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        {/* Image Preview */}
                        <div className="flex-shrink-0">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded-md border border-gray-200 dark:border-neutral-700"
                              onLoad={() =>
                                console.log("Image loaded successfully")
                              }
                              onError={() =>
                                console.log("Image failed to load")
                              }
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 dark:bg-neutral-700 rounded-md border border-gray-200 dark:border-neutral-700 flex items-center justify-center">
                              <Image
                                size={24}
                                className="text-gray-500 dark:text-neutral-400"
                              />
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedImage.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">
                            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                            This image will be used as a reference for video
                            generation
                          </p>
                          {/* Debug info */}
                          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                            Preview: {imagePreview ? "Ready" : "Loading..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aspect Ratio Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                    Aspect Ratio
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="aspectRatio"
                        value="16:9"
                        checked={aspectRatio === "16:9"}
                        onChange={(e) =>
                          setAspectRatio(e.target.value as "16:9")
                        }
                        className="sr-only"
                      />
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          aspectRatio === "16:9"
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        }`}
                      >
                        <Monitor size={16} />
                        <span className="text-sm font-medium">
                          16:9 (Landscape)
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="aspectRatio"
                        value="9:16"
                        checked={aspectRatio === "9:16"}
                        onChange={(e) =>
                          setAspectRatio(e.target.value as "9:16")
                        }
                        className="sr-only"
                      />
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          aspectRatio === "9:16"
                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        }`}
                      >
                        <Smartphone size={16} />
                        <span className="text-sm font-medium">
                          9:16 (Portrait)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles size={16} className="mr-2" />
                  Generate Video
                  <span className="ml-2 text-xs opacity-75">(10 tokens)</span>
                </Button>

                {/* Important Note */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-neutral-400">
                    Generated videos are 8 seconds long. Audio generation may vary depending on content.
                  </p>
                </div>
              </div>
            </div>
            {/* End Video Generation Form */}
          </div>

          {/* Samples or Result */}
          <div className="mt-10 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            {!generatedVideoUrl && !isGenerating && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 text-center">
                  Sample Videos
                </h3>
                <VideoCarousel videos={sampleVideos} />
              </div>
            )}
            {isGenerating && (
              <div className="space-y-4 py-10">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {generationStatus}
                  </p>
                  <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {generationProgress}% complete
                  </p>
                  <div className="text-center text-sm text-muted-foreground">
                    This usually takes about 3 minutes. Please don't close this
                    page.
                  </div>
                </div>
              </div>
            )}
            {generatedVideoUrl && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 text-center">
                  Your Video
                </h3>
                <div className="relative aspect-[9/16] sm:aspect-[16/9] w-full overflow-hidden rounded-xl border bg-black">
                  <video
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                  >
                    <source src={generatedVideoUrl} type="video/mp4" />
                  </video>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* End Content */}
    </>
  );
};

export default page;
