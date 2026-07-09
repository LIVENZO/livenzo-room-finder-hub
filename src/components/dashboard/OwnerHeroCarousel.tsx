import React, { useCallback, useEffect, useRef, useState } from "react";
import { Home, Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";
import { usePropertyPermissions } from "@/hooks/usePropertyPermissions";
import { useOwnerProperty } from "@/context/OwnerPropertyContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DEFAULT_HERO_IMAGES = [
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1770549274905_4gl3bp8nx9i.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1770549670438_r9uhoctwnhi.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/e02288a5-2628-4a59-9f90-ac99151177f9/1768481622588_ba4c1lww6ke.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1767528319032_j7mjrqzq9ol.jpg",
  "https://naoqigivttgpkfwpzcgg.supabase.co/storage/v1/object/public/rooms/267fcf84-88d8-4ca9-b414-9976f3981a50/1770624046569_pmhxhc6obc.jpg",
];

const LONG_PRESS_MS = 2000;

const OwnerHeroCarousel: React.FC = () => {
  const { user } = useAuth();
  const { activeProperty } = useOwnerProperty();
  const { isOwner } = usePropertyPermissions();

  const [images, setImages] = useState<string[]>(DEFAULT_HERO_IMAGES);
  const [isCustom, setIsCustom] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load hero_images for this property
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!activeProperty?.id) return;
      const { data, error } = await (supabase as any)
        .from("owner_properties")
        .select("hero_images")
        .eq("id", activeProperty.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Failed to load hero_images", error);
        setImages(DEFAULT_HERO_IMAGES);
        setIsCustom(false);
        return;
      }
      const arr = (data?.hero_images as string[] | null) || [];
      if (arr.length > 0) {
        setImages(arr);
        setIsCustom(true);
      } else {
        setImages(DEFAULT_HERO_IMAGES);
        setIsCustom(false);
      }
      setCurrentSlide(0);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeProperty?.id]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(images.length, 1));
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % Math.max(images.length, 1));
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(nextSlide, 3500);
    return () => clearInterval(interval);
  }, [nextSlide, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) (diff > 0 ? nextSlide : prevSlide)();
    setTouchStart(null);
  };

  // Long-press handlers on the Home icon (owner only)
  const startPress = () => {
    if (!isOwner || !activeProperty?.id) return;
    clearPress();
    pressTimer.current = setTimeout(() => {
      setDialogOpen(true);
      // Small haptic-ish feedback
      try {
        (navigator as any)?.vibrate?.(30);
      } catch {}
    }, LONG_PRESS_MS);
  };
  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const persistImages = async (next: string[]) => {
    if (!activeProperty?.id) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("owner_properties")
      .update({ hero_images: next })
      .eq("id", activeProperty.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Failed to save images");
      return;
    }
    setImages(next.length > 0 ? next : DEFAULT_HERO_IMAGES);
    setIsCustom(next.length > 0);
    setCurrentSlide(0);
    toast.success("Slider images updated");
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0 || !user || !activeProperty?.id) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 10MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/hero/${activeProperty.id}/${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("rooms")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) {
          console.error(upErr);
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        const { data } = supabase.storage.from("rooms").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      if (uploaded.length === 0) return;
      const base = isCustom ? images : [];
      await persistImages([...base, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string) => {
    if (!isCustom) return;
    const next = images.filter((u) => u !== url);
    await persistImages(next);
  };

  const resetToDefault = async () => {
    await persistImages([]);
  };

  const displayImages = images.length > 0 ? images : DEFAULT_HERO_IMAGES;

  return (
    <>
      <div
        className="relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-medium select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {displayImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              index === currentSlide ? "opacity-100" : "opacity-0",
            )}
          >
            <img src={image} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            aria-label={isOwner ? "Long-press to edit slider images" : "Property"}
            onMouseDown={startPress}
            onMouseUp={clearPress}
            onMouseLeave={clearPress}
            onTouchStart={(e) => {
              e.stopPropagation();
              startPress();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              clearPress();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
              "inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-lg animate-float",
              isOwner && "active:scale-95 transition-transform",
            )}
          >
            <Home className="h-8 w-8 text-white" />
          </button>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide ? "bg-white w-4" : "bg-white/50 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100%-1.5rem)] max-h-[92dvh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Property slider images</DialogTitle>
            <DialogDescription>
              Upload photos for this property's dashboard slider. Only you (the owner) can edit these.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isCustom && images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={url} alt="slider" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      disabled={saving}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground rounded-xl border border-dashed p-4 text-center">
                Using default slider images. Upload photos to customize this property's slider.
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="w-full h-12 rounded-2xl"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    {isCustom ? <ImagePlus className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isCustom ? "Add more images" : "Upload images"}
                  </>
                )}
              </Button>
              {isCustom && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetToDefault}
                  disabled={uploading || saving}
                  className="w-full h-11 rounded-2xl"
                >
                  Reset to default
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OwnerHeroCarousel;
