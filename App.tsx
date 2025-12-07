import React, { useState, useEffect, useRef } from 'react';
import { GRADE_2_WORDS } from './constants';
import { WordItem, GameMode, QuizState } from './types';
import { generatePronunciation, generateSimpleSentence } from './services/geminiService';
import { Button } from './components/Button';
import { QuizModal } from './components/QuizModal';

// Icons
const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<GameMode>(GameMode.LEARN);
  const [score, setScore] = useState(0);
  const [generatedSentence, setGeneratedSentence] = useState<string>("");
  const [isLoadingSentence, setIsLoadingSentence] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const [quizState, setQuizState] = useState<QuizState>({
    isActive: false,
    score: 0,
    currentQuestionIndex: 0,
    options: [],
    lastAnswerCorrect: null
  });

  const currentWord = GRADE_2_WORDS[currentIndex];
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Sentence on Word Change
  useEffect(() => {
    setIsFlipped(false);
    setGeneratedSentence("");
    // We only generate sentence when flipped to save tokens/requests, or lazy load it.
    // But for better UX, let's fetch it when the card loads if we are in learn mode.
    if (mode === GameMode.LEARN) {
      loadSentence(currentWord.word);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, mode]);

  const loadSentence = async (word: string) => {
    setIsLoadingSentence(true);
    try {
      const sentence = await generateSimpleSentence(word);
      setGeneratedSentence(sentence);
    } catch (error) {
      console.error("Failed to generate sentence", error);
      setGeneratedSentence("Try to make a sentence!");
    } finally {
      setIsLoadingSentence(false);
    }
  };

  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    try {
      const audioBuffer = await generatePronunciation(currentWord.word);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      
      const ctx = audioContextRef.current;
      // AudioContext might be suspended in some browsers until user gesture
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start();

    } catch (error) {
      console.error("Audio playback failed", error);
      setIsPlayingAudio(false);
      alert("Audio failed. Check API Key.");
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % GRADE_2_WORDS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + GRADE_2_WORDS.length) % GRADE_2_WORDS.length);
  };

  const startQuiz = () => {
    setMode(GameMode.QUIZ);
    generateQuizQuestion();
  };

  const generateQuizQuestion = () => {
    // Pick 3 random incorrect answers
    const otherWords = GRADE_2_WORDS.filter(w => w.id !== currentWord.id);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [...shuffledOthers.map(w => w.translation), currentWord.translation];
    // Shuffle options
    const shuffledOptions = options.sort(() => 0.5 - Math.random());

    setQuizState({
      isActive: true,
      score: quizState.score,
      currentQuestionIndex: currentIndex,
      options: shuffledOptions,
      lastAnswerCorrect: null
    });
  };

  const handleQuizAnswer = (answer: string) => {
    const correct = answer === currentWord.translation;
    if (correct) {
      setScore(prev => prev + 10);
      setQuizState(prev => ({ ...prev, lastAnswerCorrect: true }));
      // Generate audio for positive reinforcement could be added here
    } else {
      setQuizState(prev => ({ ...prev, lastAnswerCorrect: false }));
    }
  };

  const handleCloseQuiz = () => {
    if (quizState.lastAnswerCorrect) {
      handleNext();
    }
    setQuizState(prev => ({ ...prev, isActive: false, lastAnswerCorrect: null }));
    setMode(GameMode.LEARN);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-pink-50 relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Header */}
      <header className="z-10 w-full max-w-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pink-600 tracking-wide font-['ZCOOL_KuaiLe']">艾艾的单词本</h1>
          <p className="text-pink-400 text-sm">Ai Ai's Wordbook</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-pink-100 flex items-center gap-2">
          <span className="text-yellow-500 text-xl">⭐</span>
          <span className="font-bold text-pink-500 text-xl">{score}</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="z-10 w-full max-w-md perspective-container h-[450px] relative mb-8">
        <div 
          className={`card-inner w-full h-full relative cursor-pointer ${isFlipped ? 'card-flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Side */}
          <div className="card-front bg-white rounded-[40px] shadow-2xl border-4 border-white flex flex-col items-center justify-center p-8 select-none">
            <div className="absolute top-6 right-6 text-sm bg-blue-100 text-blue-500 px-3 py-1 rounded-full font-bold">
              {currentWord.category}
            </div>
            
            <div className="text-[120px] mb-4 animate-[bounce_2s_infinite]">
              {currentWord.emoji}
            </div>
            
            <h2 className="text-5xl font-black text-gray-800 mb-2 tracking-tight">{currentWord.word}</h2>
            
            <p className="text-gray-400 mt-4 text-sm font-semibold uppercase tracking-widest">Tap to flip</p>
            
            <button 
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              className={`mt-8 p-4 rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200 hover:scale-110 transition-all ${isPlayingAudio ? 'animate-pulse' : ''}`}
            >
              <VolumeIcon />
            </button>
          </div>

          {/* Back Side */}
          <div className="card-back bg-pink-400 rounded-[40px] shadow-2xl border-4 border-pink-300 flex flex-col items-center justify-center p-8 text-white select-none">
             <h3 className="text-5xl font-['ZCOOL_KuaiLe'] mb-6">{currentWord.translation}</h3>
             
             <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 w-full text-center min-h-[120px] flex items-center justify-center">
                {isLoadingSentence ? (
                  <div className="animate-pulse">Writing a sentence... ✍️</div>
                ) : (
                  <p className="text-xl font-medium leading-relaxed font-['Fredoka']">
                    "{generatedSentence}"
                  </p>
                )}
             </div>

             <div className="mt-8 flex gap-2">
                <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}>
                  <RefreshIcon />
                </Button>
             </div>
          </div>
        </div>
      </main>

      {/* Controls */}
      <div className="z-10 w-full max-w-md grid grid-cols-3 gap-4">
        <Button variant="icon" onClick={handlePrev} aria-label="Previous Word">
          <ArrowLeftIcon />
        </Button>

        <Button 
          variant="primary" 
          onClick={startQuiz}
          className="flex-1"
        >
          测验 / Quiz
        </Button>

        <Button variant="icon" onClick={handleNext} aria-label="Next Word">
          <ArrowRightIcon />
        </Button>
      </div>

      {/* Quiz Modal */}
      {mode === GameMode.QUIZ && quizState.isActive && (
        <QuizModal 
          currentWord={currentWord}
          quizState={quizState}
          onAnswer={handleQuizAnswer}
          onClose={handleCloseQuiz}
        />
      )}

      {/* API Key Warning (Development only usually, but good for demo) */}
      {!process.env.API_KEY && (
        <div className="absolute bottom-2 text-xs text-red-400 bg-red-100 px-2 py-1 rounded">
          Warning: API_KEY not set in environment
        </div>
      )}
    </div>
  );
}

export default App;