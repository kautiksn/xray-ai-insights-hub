import React, { useState } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface ImageViewerProps {
  currentImage: string
  currentIndex: number
  onChangeImage: (index: number) => void
  totalImages?: number
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  currentImage,
  currentIndex,
  onChangeImage,
  totalImages = 1,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1)

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  return (
    <div className="flex flex-col h-full bg-medical-darkest-gray rounded-lg overflow-hidden border border-medical-dark-gray/30">
      <div className="p-3 border-b border-medical-dark-gray/30 flex justify-between items-center">
        <h2 className="text-lg font-medium">Chest X-Ray</h2>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-md nav-button"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-md nav-button"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>

          <Dialog>
            <DialogTrigger asChild>
              <button
                className="p-1.5 rounded-md nav-button"
                aria-label="View full image"
              >
                <Maximize size={18} />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0 bg-medical-darkest-gray">
              <div className="p-4 flex items-center justify-center">
                <img
                  src={currentImage}
                  alt="Full size X-ray"
                  className="max-h-[80vh] object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <div
          className="transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={currentImage}
            alt="X-ray image"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
}
