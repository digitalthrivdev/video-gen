"use client";

import { useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  Monitor,
  Smartphone,
  Square,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface GeneratedImage {
  id: string;
  prompt: string;
  aspectRatio: string;
  imageUrl: string;
  imageId: string;
  tokensUsed: number;
  createdAt: string;
}

const ImageGenerationPage = () => {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">(
    "1:1"
  );
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previousImages, setPreviousImages] = useState<GeneratedImage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReferenceImage, setSelectedReferenceImage] =
    useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<
    string | null
  >(null);

  // Load user's previous images
  useEffect(() => {
    loadImageHistory();
  }, []);

  const loadImageHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/images/list?limit=12");
      if (res.ok) {
        const data = await res.json();
        setPreviousImages(data.images || []);
      }
    } catch (error) {
      console.error("Failed to load image history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReferenceImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Reference image selected:", file.name, file.type, file.size);
      setSelectedReferenceImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log("FileReader result length:", result?.length);
        setReferenceImagePreview(result);
      };
      reader.onerror = () => {
        console.error("FileReader error");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = () => {
    setSelectedReferenceImage(null);
    setReferenceImagePreview(null);
  };

  const handleGenerate = async () => {
    try {
      setError(null);
      setGeneratedImage(null);
      setIsGenerating(true);

      let referenceImageUrl: string | undefined = undefined;

      // Upload reference image to ImageKit if one is selected
      if (selectedReferenceImage) {
        console.log(
          "Uploading reference image to ImageKit...",
          selectedReferenceImage.name
        );
        const formData = new FormData();
        formData.append("file", selectedReferenceImage);
        formData.append("fileName", selectedReferenceImage.name);

        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(
            errorData?.error || "Failed to upload reference image"
          );
        }

        const uploadData = await uploadRes.json();
        referenceImageUrl = uploadData.url;
        console.log(
          "Reference image uploaded successfully:",
          referenceImageUrl
        );
      }

      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          referenceImageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402) {
          throw new Error(
            "Insufficient tokens! You need at least 1 token to generate an image. Please purchase more tokens."
          );
        } else if (res.status === 401) {
          throw new Error("Please sign in to generate images.");
        } else {
          throw new Error(data?.error || "Failed to generate image");
        }
      }

      setGeneratedImage(data.imageUrl);

      // Reload history to show the new image
      loadImageHistory();
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-6 pt-20">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full">
          <div className="max-w-4xl w-full text-center mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">
              AI Image Generator
            </h1>
            <p className="mt-3 text-gray-600 dark:text-neutral-400">
              Create stunning images from text descriptions using advanced AI
            </p>
          </div>

          {/* Image Generation Form */}
          <div className="mt-10 max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {/* Prompt Input */}
              <div className="relative">
                <Textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full resize-none max-h-32 overflow-y-auto pr-16"
                  placeholder="Describe the image you want to create... (e.g., A serene mountain landscape at sunset with vibrant colors)"
                  style={{
                    minHeight: "6rem",
                    maxHeight: "12rem",
                    lineHeight: "1.5rem",
                  }}
                />
                <div className="absolute top-3 end-3 flex gap-2">
                  <label
                    htmlFor="reference-image-upload"
                    className="size-8 inline-flex justify-center items-center rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition-colors dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                    title="Upload reference image"
                  >
                    <ImageIcon size={16} />
                  </label>
                  <input
                    type="file"
                    id="reference-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleReferenceImageUpload}
                  />
                </div>
              </div>

              {/* Reference Image Preview */}
              {selectedReferenceImage && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                      Reference Image
                    </h3>
                    <button
                      onClick={clearReferenceImage}
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
                        {referenceImagePreview ? (
                          <img
                            src={referenceImagePreview}
                            alt="Reference Preview"
                            className="w-20 h-20 object-cover rounded-md border border-gray-200 dark:border-neutral-700"
                            onLoad={() =>
                              console.log("Reference image loaded successfully")
                            }
                            onError={() =>
                              console.log("Reference image failed to load")
                            }
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 dark:bg-neutral-700 rounded-md border border-gray-200 dark:border-neutral-700 flex items-center justify-center">
                            <ImageIcon
                              size={24}
                              className="text-gray-500 dark:text-neutral-400"
                            />
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {selectedReferenceImage.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {(selectedReferenceImage.size / 1024 / 1024).toFixed(
                            2
                          )}{" "}
                          MB
                        </p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                          This image will be used as a reference for AI
                          generation (image-to-image)
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
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="aspectRatio"
                      value="1:1"
                      checked={aspectRatio === "1:1"}
                      onChange={(e) => setAspectRatio(e.target.value as "1:1")}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors w-full ${
                        aspectRatio === "1:1"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Square size={16} />
                      <span className="text-sm font-medium">1:1 (Square)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="aspectRatio"
                      value="16:9"
                      checked={aspectRatio === "16:9"}
                      onChange={(e) => setAspectRatio(e.target.value as "16:9")}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors w-full ${
                        aspectRatio === "16:9"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Monitor size={16} />
                      <span className="text-sm font-medium">16:9</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      name="aspectRatio"
                      value="9:16"
                      checked={aspectRatio === "9:16"}
                      onChange={(e) => setAspectRatio(e.target.value as "9:16")}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors w-full ${
                        aspectRatio === "9:16"
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
                          : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <Smartphone size={16} />
                      <span className="text-sm font-medium">9:16</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Generate Image
                    <span className="ml-2 text-xs opacity-75">(1 token)</span>
                  </>
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Info */}
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {selectedReferenceImage
                    ? "Your uploaded image helps guide the AI to create similar results."
                    : "AI will generate images based on your prompt."}
                  Each generation costs 1 token.
                </p>
              </div>
            </div>
          </div>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="mt-10 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-neutral-300">
                    Your Generated Image
                  </h3>
                  <Button
                    onClick={() => handleDownload(generatedImage, prompt)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
                <Card className="overflow-hidden">
                  <img
                    src={generatedImage}
                    alt={prompt}
                    className="w-full h-auto object-contain"
                  />
                </Card>
                <p className="text-sm text-gray-600 dark:text-neutral-400 italic">
                  "{prompt}"
                </p>
              </div>
            </div>
          )}

          {/* Previous Images */}
          <div className="mt-16 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              Your Generated Images
            </h3>

            {isLoadingHistory ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : previousImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
                <p className="text-gray-500 dark:text-neutral-400">
                  No images generated yet. Create your first image above!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previousImages.map((image) => (
                  <Card
                    key={image.id}
                    className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.imageUrl}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={() =>
                            handleDownload(image.imageUrl, image.prompt)
                          }
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download size={16} />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-2">
                        {image.prompt}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPage;
