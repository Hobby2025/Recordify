import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

// Enum for recording states
enum RecordingState {
  Idle,
  RequestingPermission,
  Recording,
  Paused,
  Stopped,
  Uploading,
  Error
}

// Helper function to format time
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const NewRecording: React.FC = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // State for timer

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref for timer interval

  // Function to start the timer
  const startTimer = () => {
      clearInterval(timerIntervalRef.current!); // Clear existing interval just in case
      timerIntervalRef.current = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
  };

  // Function to stop the timer
  const stopTimer = () => {
      clearInterval(timerIntervalRef.current!); 
      timerIntervalRef.current = null;
  };

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  }, []);

  const handleStop = useCallback(() => {
    console.log('Recording stopped, processing data...');
    stopTimer(); // Stop timer when recording stops
    const completeBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setAudioBlob(completeBlob);
    console.log('Final Audio Blob:', completeBlob);
    setRecordingState(RecordingState.Stopped);
    audioChunksRef.current = [];

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = async () => {
    setError(null);
    setAudioBlob(null);
    setElapsedTime(0); // Reset timer
    setRecordingState(RecordingState.RequestingPermission);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setRecordingState(RecordingState.Recording);
      startTimer(); // Start timer

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleStop;
      
      mediaRecorderRef.current.start();
      console.log('Recording started');

    } catch (err) {
      console.error('Error accessing microphone or starting recording:', err);
      let message = 'Could not access microphone.';
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              message = 'Microphone permission denied. Please allow access in your browser settings.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              message = 'No microphone found. Please ensure a microphone is connected and enabled.';
          }
      }
      setError(message);
      setRecordingState(RecordingState.Error);
      stopTimer(); // Ensure timer is stopped on error
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer(); // Pause timer
      setRecordingState(RecordingState.Paused);
      console.log('Recording paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer(); // Resume timer
      setRecordingState(RecordingState.Recording);
      console.log('Recording resumed');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop(); // Triggers handleStop where timer is also stopped
      console.log('Stop requested...');
    } else {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        stopTimer(); // Ensure timer is stopped
        setRecordingState(RecordingState.Idle);
        setAudioBlob(null);
        setElapsedTime(0); // Reset time if stopped from idle
    }
  };

  const uploadAudio = () => {
      if (!audioBlob) return;
      setRecordingState(RecordingState.Uploading);
      setError(null); // Clear previous errors
      console.log("Initiating upload simulation for:", audioBlob);

      // Simulate API call with potential failure
      new Promise<void>((resolve, reject) => {
          setTimeout(() => {
              // Simulate 50% chance of failure
              if (Math.random() > 0.5) {
                  console.log("Upload simulation complete.");
                  resolve();
              } else {
                  console.error("Upload simulation failed.");
                  reject(new Error("Simulated network error during upload."));
              }
          }, 1500);
      })
      .then(() => {
          // On Success
          setRecordingState(RecordingState.Idle);
          setAudioBlob(null); 
          setElapsedTime(0); 
          toast.success("Recording saved successfully!"); // Success toast
      })
      .catch((uploadError) => {
          // On Failure
          console.error('Upload failed:', uploadError);
          let message = "Failed to save recording.";
          if (uploadError instanceof Error) {
              // Could customize message based on error type if needed
              message = uploadError.message.includes("network") 
                        ? "Network error saving recording. Please try again."
                        : "Failed to save recording. Please try again.";
          }
          setError(message); // Keep the error message in state if needed
          setRecordingState(RecordingState.Stopped); // Revert state to allow retry
          toast.error(message, { id: 'upload-error' }); // Error toast
      });
  };

  // Clean up interval on unmount
  useEffect(() => {
      return () => {
          stopTimer();
          // Also ensure media stream is stopped if component unmounts while recording
          streamRef.current?.getTracks().forEach(track => track.stop());
      };
  }, []);

  const renderControls = () => {
    // Define base styles for consistency
    const buttonBase = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center space-x-2";
    const iconBase = "h-5 w-5";

    switch (recordingState) {
      case RecordingState.Idle:
      case RecordingState.Error: // Reuse Start/Try Again button style
        return (
          <button
            onClick={startRecording}
            // Large red circular button like iOS record
            className="h-16 w-16 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out shadow-md flex items-center justify-center"
          >
             {/* Microphone Icon for Start */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5zM12 12v3.75m0-7.5A3.75 3.75 0 0115.75 12H16.5" /> {/* Simpler mic representation inside circle */} 
            </svg>
            {/* Screen reader text */} 
            <span className="sr-only">{recordingState === RecordingState.Error ? 'Try Recording Again' : 'Start Recording'}</span>
          </button>
        );
      case RecordingState.RequestingPermission:
          return <div className="text-gray-500 text-sm">Requesting mic permission...</div>;
      case RecordingState.Recording:
        return (
          <div className="flex items-center space-x-4">
            {/* Pause Button - using standard button style */}
            <button onClick={pauseRecording} className={`${buttonBase} bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 6a1 1 0 011-1h1a1 1 0 110 2H10a1 1 0 01-1-1zm1 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-1 5a1 1 0 011-1h1a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /> </svg>
                 <span>Pause</span>
            </button>
             {/* Stop Button - more prominent red square like iOS */}
            <button onClick={stopRecording} className="h-12 w-12 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"> <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" /> </svg>
                 <span className="sr-only">Stop Recording</span>
            </button>
            {/* Timer remains the same */}
            <span className="text-red-500 animate-pulse font-mono text-sm w-16 text-center">REC {formatTime(elapsedTime)}</span>
          </div>
        );
      case RecordingState.Paused:
         return (
          <div className="flex items-center space-x-4">
             {/* Resume Button */}
            <button onClick={resumeRecording} className={`${buttonBase} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} viewBox="0 0 20 20" fill="currentColor"> <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm7-4a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1zm4 4a1 1 0 100 2H7a1 1 0 100-2h6z" /> </svg>
                <span>Resume</span>
            </button>
             {/* Stop Button - consistent style */}
            <button onClick={stopRecording} className="h-12 w-12 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"> <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" /> </svg>
                 <span className="sr-only">Stop Recording</span>
            </button>
            {/* Timer remains the same */}
            <span className="text-yellow-600 font-mono text-sm w-16 text-center">{formatTime(elapsedTime)}</span>
          </div>
        );
       case RecordingState.Stopped:
        return (
          <div className="flex flex-col items-center space-y-3">
            <span className="text-gray-600 font-mono text-sm">Duration: {formatTime(elapsedTime)}</span>
            <div className="flex items-center space-x-4">
              {/* Save Button */}
              <button onClick={uploadAudio} className={`${buttonBase} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 shadow-sm`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /> </svg>
                 <span>Save Recording</span>
              </button>
              {/* Record Again Button */}
              <button onClick={startRecording} className={`${buttonBase} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /> </svg>
                 <span>Record Again</span>
              </button>
            </div>
          </div>
        );
      case RecordingState.Uploading:
        // Potentially add a spinner icon here
        return <div className="text-blue-500 text-sm flex items-center space-x-2"><svg className="animate-spin h-4 w-4 text-blue-500" /* ... spinner path ... */></svg> <span>Saving recording...</span></div>;
      // Error case handled by Idle case
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold mb-2">New Recording</h2>
        <p className="text-gray-500 text-sm h-5">
          {recordingState === RecordingState.Idle && "Click the button below to start recording."}
          {recordingState === RecordingState.RequestingPermission && "Requesting microphone access..."}
          {(recordingState === RecordingState.Recording || recordingState === RecordingState.Paused) && " "}
          {recordingState === RecordingState.Stopped && `Recording finished (${formatTime(elapsedTime)}). Ready to save.`}
          {recordingState === RecordingState.Uploading && "Saving your recording..."}
          {recordingState === RecordingState.Error && "An error occurred."}
        </p>
        {audioBlob && recordingState === RecordingState.Stopped && (
            <div className="mt-4 w-full max-w-sm">
                {/* Style the default audio player minimally */}
                <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-10"></audio>
            </div>
        )}
      </div>
      <div className="flex justify-center items-center h-20">
        {renderControls()} 
      </div>
      {recordingState === RecordingState.Error && error && (
          <p className="mt-2 text-xs text-red-600 text-center max-w-xs">Error: {error}</p>
      )}
    </div>
  );
};

export default NewRecording;