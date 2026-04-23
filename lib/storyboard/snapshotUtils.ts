/**
 * Shared snapshot utilities for capturing frames from video/image elements.
 * Used by StoryboardStrip (continuity bridge) and VideoEditor (timeline snapshot).
 *
 * @module lib/storyboard/snapshotUtils
 */

/**
 * Capture the current frame of a video element as a PNG blob.
 * Creates an offscreen canvas, draws the video frame, and converts to blob.
 */
export async function captureVideoFrame(videoUrl: string, seekTime?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Fetch as blob to avoid CORS issues with canvas taint
    fetch(videoUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const vid = document.createElement("video");
        vid.src = blobUrl;
        vid.preload = "auto";
        vid.muted = true;

        vid.onloadeddata = () => {
          // Seek to requested time, or last frame (duration - 0.1s)
          vid.currentTime = seekTime ?? Math.max(0, (vid.duration || 1) - 0.1);
        };

        vid.onseeked = () => {
          const w = vid.videoWidth || 1920;
          const h = vid.videoHeight || 1080;
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            reject(new Error("Canvas context not available"));
            return;
          }
          ctx.drawImage(vid, 0, 0, w, h);
          canvas.toBlob(
            (snapBlob) => {
              URL.revokeObjectURL(blobUrl);
              if (!snapBlob) {
                reject(new Error("Failed to create snapshot blob"));
                return;
              }
              resolve(snapBlob);
            },
            "image/png"
          );
        };

        vid.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          reject(new Error("Failed to load video for snapshot"));
        };
      })
      .catch(reject);
  });
}

/**
 * Capture an image URL as a PNG blob via offscreen canvas.
 * Useful for re-encoding or when you need a local blob from a remote image.
 */
export async function captureImageFrame(imageUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }
          resolve(blob);
        },
        "image/png"
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for snapshot"));
    img.src = imageUrl;
  });
}
