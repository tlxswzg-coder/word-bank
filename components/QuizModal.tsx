import React from 'react';
import { WordItem, QuizState } from '../types';
import { Button } from './Button';
import { SUCCESS_MESSAGES } from '../constants';

interface QuizModalProps {
  currentWord: WordItem;
  quizState: QuizState;
  onAnswer: (answer: string) => void;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ currentWord, quizState, onAnswer, onClose }) => {
  const isCorrect = quizState.lastAnswerCorrect === true;
  const isWrong = quizState.lastAnswerCorrect === false;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-4 border-pink-200 animate-[bounce_0.5s_ease-out]">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl text-pink-500 font-bold mb-2">小测验 / Quiz</h2>
          <p className="text-gray-500">What does this mean?</p>
          <div className="my-4 text-4xl font-bold text-pink-600 bg-pink-50 py-4 rounded-2xl border border-pink-100">
             {currentWord.emoji} {currentWord.word}
          </div>
        </div>

        {!isCorrect && !isWrong && (
          <div className="grid grid-cols-2 gap-3">
            {quizState.options.map((option, idx) => (
              <Button 
                key={idx} 
                variant="secondary" 
                onClick={() => onAnswer(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        {isCorrect && (
          <div className="text-center py-4">
            <div className="text-6xl mb-2">🌟</div>
            <h3 className="text-2xl text-green-500 font-bold mb-4">
              {SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]}
            </h3>
            <Button onClick={onClose} variant="primary" fullWidth>
              下一题 / Next
            </Button>
          </div>
        )}

        {isWrong && (
          <div className="text-center py-4">
            <div className="text-6xl mb-2">🤔</div>
            <h3 className="text-2xl text-orange-400 font-bold mb-4">再试一次！Try again!</h3>
            <Button onClick={onClose} variant="secondary" fullWidth>
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};