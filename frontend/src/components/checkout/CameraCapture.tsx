import { useRef, useState, useCallback, useEffect, ChangeEvent } from 'react';
import { Camera, RefreshCw, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CameraStatus } from '@/types';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  status: CameraStatus;
}

const CameraCapture = ({ onCapture, status }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions or upload an image.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        onCapture(imageData);
      }
    }
  }, [onCapture]);

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        onCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onCapture]);

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const statusConfig: Record<CameraStatus, { icon: typeof Camera; label: string; color: string; animate?: boolean }> = {
    ready: { icon: Camera, label: 'Ready to Capture', color: 'text-primary' },
    processing: { icon: Loader2, label: 'Identifying...', color: 'text-warning', animate: true },
    identified: { icon: CheckCircle, label: 'Identified!', color: 'text-success' },
    error: { icon: AlertCircle, label: 'Error', color: 'text-destructive' },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Camera Preview */}
        <div className="relative aspect-square w-full max-w-md mx-auto overflow-hidden rounded-xl bg-muted">
          {cameraError && !capturedImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-muted-foreground">{cameraError}</p>
              <div className="flex gap-2">
                <Button onClick={startCamera} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Camera
                </Button>
                <Button onClick={triggerFileUpload} variant="default" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Status Badge */}
          <div className={cn(
            "absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm shadow-md",
            currentStatus.color
          )}>
            <StatusIcon className={cn("h-4 w-4", currentStatus.animate && "animate-spin")} />
            <span className="text-sm font-medium">{currentStatus.label}</span>
          </div>

          {/* Grid Overlay */}
          {!capturedImage && !cameraError && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-2 border-dashed border-primary/30 rounded-lg" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-primary rounded-full" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {capturedImage ? (
            <Button
              onClick={resetCapture}
              variant="outline"
              className="flex-1"
              disabled={status === 'processing'}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Retake
            </Button>
          ) : (
            <>
              <Button
                onClick={captureImage}
                className="flex-1"
                size="lg"
                disabled={!!cameraError || status === 'processing'}
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture
              </Button>
              <Button
                onClick={triggerFileUpload}
                variant="secondary"
                size="lg"
                disabled={status === 'processing'}
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
