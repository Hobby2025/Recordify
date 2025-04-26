import React, { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

// 녹음 상태 enum
enum RecordingState {
  Idle,
  RequestingPermission,
  Recording,
  Paused,
  Stopped, // 중지 후 상태 (업로드 가능 전)
  Uploading,
  Error
}

// 시간을 MM:SS 형식으로 포맷하는 헬퍼 함수
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const NewRecording: React.FC = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.Idle);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null); // 최종 녹음 파일을 담을 상태
  const [elapsedTime, setElapsedTime] = useState(0); // 타이머를 위한 상태
  
  // MediaRecorder와 오디오 청크 관리를 위한 ref
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // 청크 저장을 위한 ref 사용
  const streamRef = useRef<MediaStream | null>(null); // 나중에 트랙 중지를 위한 스트림 참조
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // 타이머 인터벌을 위한 ref

  // 타이머 시작 함수
  const startTimer = () => {
      clearInterval(timerIntervalRef.current!); // 만약을 위해 기존 인터벌 제거
      timerIntervalRef.current = setInterval(() => {
          setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
  };

  // 타이머 중지 함수
  const stopTimer = () => {
      clearInterval(timerIntervalRef.current!); 
      timerIntervalRef.current = null;
  };

  // --- Media Recorder 이벤트 핸들러 ---
  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  }, []);

  const handleStop = useCallback(() => {
    console.log('녹음 중지됨, 데이터 처리 중...');
    stopTimer(); // 녹음 중지 시 타이머 중지
    const completeBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // 필요시 마임 타입 조정
    setAudioBlob(completeBlob);
    console.log('최종 오디오 Blob:', completeBlob);
    // TODO: 여기서 'completeBlob'을 사용하여 업로드 로직 구현
    // 예: uploadAudio(completeBlob);
    setRecordingState(RecordingState.Stopped); // 중지 상태로 전환
    audioChunksRef.current = []; // 다음 녹음을 위해 청크 비우기

    // 스트림 트랙 정리
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null; // 레코더 인스턴스 정리

  }, [stopTimer]); // stopTimer 의존성 추가
  // -------------------------------------

  // --- 녹음 제어 함수 (오류 메시지 번역됨) ---
  const startRecording = async () => {
    setError(null); setAudioBlob(null); setElapsedTime(0); // 타이머 리셋
    setRecordingState(RecordingState.RequestingPermission);
    audioChunksRef.current = []; // 이전 청크 비우기

    try {
      // 마이크 접근 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // 스트림 참조 저장
      setRecordingState(RecordingState.Recording);
      startTimer(); // 타이머 시작

      // MediaRecorder 초기화
      // 코덱 지정 가능: 예: { mimeType: 'audio/webm;codecs=opus' }
      mediaRecorderRef.current = new MediaRecorder(stream);

      // ref를 사용하여 이벤트 리스너 할당
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.onstop = handleStop;
      
      // 녹음 시작
      mediaRecorderRef.current.start(); // ondataavailable 간격 전달 가능: start(1000)
      console.log('녹음 시작됨');

    } catch (err) {
      console.error('마이크 접근 또는 녹음 시작 오류:', err);
      let message = '마이크에 접근할 수 없습니다.'; 
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              message = '마이크 권한이 거부되었습니다. 브라우저 설정에서 접근을 허용해주세요.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              message = '마이크를 찾을 수 없습니다. 마이크가 연결되어 있고 활성화되어 있는지 확인해주세요.';
          }
      }
      setError(message);
      setRecordingState(RecordingState.Error);
      stopTimer(); // 오류 시 타이머 중지 확인
      streamRef.current?.getTracks().forEach(track => track.stop()); // 부분적으로 획득된 스트림 정리
      streamRef.current = null;
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer(); // 타이머 일시정지
      setRecordingState(RecordingState.Paused);
      console.log('녹음 일시정지됨');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer(); // 타이머 재개
      setRecordingState(RecordingState.Recording);
      console.log('녹음 재개됨');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused')) {
      mediaRecorderRef.current.stop(); // 여기서 'onstop' 핸들러가 트리거됨 (타이머도 중지됨)
      console.log('중지 요청됨...');
    } else {
        // 이미 중지되었거나 유휴 상태인 경우 스트림 정리 (만약을 위해)
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        stopTimer(); // 타이머 중지 확인
        setRecordingState(RecordingState.Idle);
        setAudioBlob(null);
        setElapsedTime(0); // 유휴 상태에서 중지 시 시간 리셋
    }
  };

  // 녹음 저장/업로드 처리 함수 (오류 시뮬레이션 포함)
  const uploadAudio = () => {
      if (!audioBlob) return;
      setRecordingState(RecordingState.Uploading);
      setError(null); // 이전 오류 제거
      console.log("업로드 시뮬레이션 시작:", audioBlob);

      // 잠재적 실패 가능성이 있는 API 호출 시뮬레이션
      new Promise<void>((resolve, reject) => {
          setTimeout(() => {
              // 50% 실패 확률 시뮬레이션
              if (Math.random() > 0.5) {
                  console.log("업로드 시뮬레이션 완료.");
                  resolve();
              } else {
                  console.error("업로드 시뮬레이션 실패.");
                  reject(new Error("업로드 중 시뮬레이션된 네트워크 오류."));
              }
          }, 1500);
      })
      .then(() => {
          // 성공 시
          setRecordingState(RecordingState.Idle);
          setAudioBlob(null); 
          setElapsedTime(0); 
          toast.success("녹음이 성공적으로 저장되었습니다!"); 
      })
      .catch((uploadError) => {
          // 실패 시
          console.error('업로드 실패:', uploadError);
          let message = "녹음 저장에 실패했습니다."; 
          if (uploadError instanceof Error) {
              // 필요시 오류 유형에 따라 메시지 사용자 정의 가능
              message = uploadError.message.includes("network") 
                        ? "네트워크 오류로 녹음 저장에 실패했습니다. 다시 시도해주세요."
                        : "녹음 저장에 실패했습니다. 다시 시도해주세요."; 
          }
          setError(message); // 필요시 상태에 오류 메시지 유지
          setRecordingState(RecordingState.Stopped); // 재시도를 위해 상태 되돌리기
          toast.error(message, { id: 'upload-error' }); 
      });
  };
  // -------------------------------------

  // 언마운트 시 인터벌 정리
  useEffect(() => {
      return () => {
          stopTimer();
          // 컴포넌트 언마운트 시 녹음 중이었다면 미디어 스트림도 중지 확인
          streamRef.current?.getTracks().forEach(track => track.stop());
      };
  }, [stopTimer]); 

  // 컨트롤 렌더링 (텍스트 번역됨)
  const renderControls = () => {
    const buttonBase = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out flex items-center justify-center space-x-2";
    const iconBase = "h-5 w-5";

    switch (recordingState) {
      case RecordingState.Idle:
      case RecordingState.Error: // 오류 상태에서도 시작/다시 시도 버튼 표시
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
            <span className="sr-only">{recordingState === RecordingState.Error ? '다시 시도' : '녹음 시작'}</span>
          </button>
        );
      case RecordingState.RequestingPermission:
          return <div className="text-gray-500 text-sm">마이크 권한 요청 중...</div>;
      case RecordingState.Recording:
        return (
          <div className="flex items-center space-x-4">
            {/* Pause Button - using standard button style */}
            <button onClick={pauseRecording} className={`${buttonBase} bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 6a1 1 0 011-1h1a1 1 0 110 2H10a1 1 0 01-1-1zm1 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-1 5a1 1 0 011-1h1a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /> </svg>
                 <span>일시정지</span>
            </button>
             {/* Stop Button - more prominent red square like iOS */}
            <button onClick={stopRecording} className="h-12 w-12 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"> <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" /> </svg>
                 <span className="sr-only">중지</span>
            </button>
            {/* Timer remains the same */}
            <span className="text-red-500 animate-pulse font-mono text-sm w-16 text-center">녹음 중 {formatTime(elapsedTime)}</span>
          </div>
        );
      case RecordingState.Paused:
         return (
          <div className="flex items-center space-x-4">
             {/* Resume Button */}
            <button onClick={resumeRecording} className={`${buttonBase} bg-green-500 text-white hover:bg-green-600 focus:ring-green-500`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} viewBox="0 0 20 20" fill="currentColor"> <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm7-4a1 1 0 011-1h2a1 1 0 110 2H10a1 1 0 01-1-1zm4 4a1 1 0 100 2H7a1 1 0 100-2h6z" /> </svg>
                <span>계속</span>
            </button>
             {/* Stop Button - consistent style */}
            <button onClick={stopRecording} className="h-12 w-12 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"> <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" /> </svg>
                 <span className="sr-only">중지</span>
            </button>
            {/* Timer remains the same */}
            <span className="text-yellow-600 font-mono text-sm w-16 text-center">{formatTime(elapsedTime)}</span>
          </div>
        );
       case RecordingState.Stopped:
        return (
          <div className="flex flex-col items-center space-y-3">
            <span className="text-gray-600 font-mono text-sm">길이: {formatTime(elapsedTime)}</span>
            <div className="flex items-center space-x-4">
              {/* Save Button */}
              <button onClick={uploadAudio} className={`${buttonBase} bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 shadow-sm`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /> </svg>
                 <span>녹음 저장</span>
              </button>
              {/* Record Again Button */}
              <button onClick={startRecording} className={`${buttonBase} bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className={iconBase} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /> </svg>
                 <span>다시 녹음</span>
              </button>
            </div>
          </div>
        );
      case RecordingState.Uploading:
        // Potentially add a spinner icon here
        return <div className="text-blue-500 text-sm flex items-center space-x-2"><svg className="animate-spin h-4 w-4 text-blue-500" /* ... spinner path ... */></svg> <span>저장 중...</span></div>;
      // Error case handled by Idle case
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200/60 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold mb-2">새 녹음</h2>
        <p className="text-gray-500 text-sm h-5">
          {recordingState === RecordingState.Idle && "아래 버튼을 눌러 녹음을 시작하세요."}
          {recordingState === RecordingState.RequestingPermission && "마이크 접근 권한 요청 중..."}
          {(recordingState === RecordingState.Recording || recordingState === RecordingState.Paused) && " "}
          {recordingState === RecordingState.Stopped && `녹음 완료 (${formatTime(elapsedTime)}). 저장 준비됨.`}
          {recordingState === RecordingState.Uploading && "녹음을 저장하는 중입니다..."}
          {recordingState === RecordingState.Error && "오류가 발생했습니다."}
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
          <p className="mt-2 text-xs text-red-600 text-center max-w-xs">오류: {error}</p>
      )}
    </div>
  );
};

export default NewRecording;