import { useState } from "react";
import type { Screenshot } from "../api/client";

interface ScreenshotGridProps {
  screenshots: Screenshot[];
}

export default function ScreenshotGrid({ screenshots }: ScreenshotGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No screenshots found for this date.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {screenshots.map((s) => (
          <div
            key={s.id}
            className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLightbox(s.image_url)}
          >
            {/* Lazy loaded image */}
            <img
              src={s.thumbnail_url || s.image_url}
              alt="Screenshot"
              loading="lazy"
              className="w-full h-44 object-cover"
            />
            {/* Timestamp overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
              <span className="text-white text-xs font-medium">
                {new Date(s.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Full screenshot"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-black/70"
            onClick={() => setLightbox(null)}
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
