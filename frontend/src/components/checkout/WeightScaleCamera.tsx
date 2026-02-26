import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Loader2, Scale, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { readWeightFromImage } from '@/lib/api';
import { toast } from 'sonner';

interface WeightScaleCameraProps {
  onWeightDetected: (weight: number) => void;
  disabled?: boolean;
}

type WeightStatus = 'ready' | 'capturing' | 'reading' | 'detected' | 'error';

const WeightScaleCamera = ({ onWeightDetected, disabled }: WeightScaleCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<WeightStatus>('ready');
  const [detectedWeight, setDetectedWeight] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      // Use a different camera if available (e.g., second USB camera)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      // Try to use the second camera if available, otherwise use the first
      const deviceId = videoDevices.length > 1 
        ? videoDevices[1].deviceId  // Second camera for weight scale
        : videoDevices[0]?.deviceId; // Fallback to first camera
      
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: 640, height: 480 }
          : { width: 640, height: 480 }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Weight camera error:', err);
      setCameraError('Unable to access weight scale camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (!disabled) {
      startCamera();
    }
    return () => stopCamera();
  }, [disabled, startCamera]);

  const captureAndRead = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setStatus('capturing');
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    setStatus('reading');
    
    try {
      const response = await readWeightFromImage(imageData);
      
      if (response.success && response.weight) {
        setDetectedWeight(response.weight);
        setStatus('detected');
        onWeightDetected(response.weight);
        toast.success(`⚖️ Weight detected: ${response.weight} kg`);
      } else {
        setStatus('error');
        toast.error(response.error || 'Could not read weight from scale');
      }
    } catch (error) {
      setStatus('error');
      toast.error('Failed to read weight');
    }
  }, [onWeightDetected]);

  const reset = useCallback(() => {
    setStatus('ready');
    setDetectedWeight(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('reading');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        try {
          const response = await readWeightFromImage(imageData);
          
          if (response.success && response.weight) {
            setDetectedWeight(response.weight);
            setStatus('detected');
            onWeightDetected(response.weight);
            toast.success(`⚖️ Weight detected: ${response.weight} kg`);
          } else {
            setStatus('error');
            toast.error(response.error || 'Could not read weight from uploaded image');
          }
        } catch (error) {
          setStatus('error');
          toast.error('Failed to process uploaded image');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setStatus('error');
      toast.error('Failed to read file');
    }
  }, [onWeightDetected]);

  const statusConfig: Record<WeightStatus, { label: string; color: string }> = {
    ready: { label: 'Point at scale', color: 'text-muted-foreground' },
    capturing: { label: 'Capturing...', color: 'text-warning' },
    reading: { label: 'Reading weight...', color: 'text-warning' },
    detected: { label: `${detectedWeight} kg`, color: 'text-success' },
    error: { label: 'Try again', color: 'text-destructive' },
  };

  const current = statusConfig[status];

  return (
    <Card className="border-0 shadow-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-primary" />
          Weight Scale Camera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Camera Preview */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{cameraError}</p>
              <Button onClick={startCamera} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Retry
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Status badge */}
          <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium ${current.color}`}>
            {status === 'reading' || status === 'capturing' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : status === 'detected' ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Scale className="h-3 w-3" />
            )}
            {current.label}
          </div>
        </div>

        {/* Capture Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={captureAndRead}
            className="flex-1"
            size="sm"
            disabled={!!cameraError || status === 'reading' || status === 'capturing' || disabled}
          >
            {status === 'reading' ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Reading...</>
            ) : (
              <><Camera className="h-4 w-4 mr-1" /> Read Weight</>
            )}
          </Button>

          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={status === 'reading' || status === 'capturing' || disabled}
          />
          
          {/* Upload Button */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className="flex-none"
            size="sm"
            disabled={status === 'reading' || status === 'capturing' || disabled}
            title="Upload image"
          >
            <Upload className="h-4 w-4" />
          </Button>

          {status === 'detected' && (
            <Button onClick={reset} variant="outline" size="sm" title="Reset">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightScaleCamera;
