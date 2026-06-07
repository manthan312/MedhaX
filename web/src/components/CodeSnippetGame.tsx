import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Terminal, Send, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface CodeSnippet {
  id: string;
  language: string;
  topic: string;
  difficulty: string;
  code_snippet: string;
  expected_output: string;
  explanation: string;
}

interface Props {
  snippet: CodeSnippet;
  onNext: () => void;
}

export function CodeSnippetGame({ snippet, onNext }: Props) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect' | 'almost'>('idle');
  
  // Clean string for almost correct comparison (ignore case and extreme whitespace differences)
  const cleanStr = (s: string) => s.trim().toLowerCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input.trim();
    const expected = snippet.expected_output.trim();

    if (userInput === expected) {
      setStatus('correct');
    } else if (cleanStr(userInput) === cleanStr(expected)) {
      setStatus('almost');
    } else {
      setStatus('incorrect');
    }
  };

  const handleCopyPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    // Inform user maybe?
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-4">
        <div className="flex items-center space-x-3">
          <Terminal className="text-cyan-400 w-6 h-6" />
          <h2 className="text-2xl font-bold text-white tracking-wide">Predict the Output</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full uppercase tracking-wider">
            {snippet.language}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider
            ${snippet.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
              snippet.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
              snippet.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
              'bg-purple-900/50 text-purple-400'}`}
          >
            {snippet.difficulty}
          </span>
        </div>
      </div>

      <p className="text-slate-300 mb-6 text-lg">
        Read the {snippet.language} code below carefully. What will be printed to the console?
      </p>

      {/* Code Block with disabled copy/paste */}
      <div 
        className="rounded-xl overflow-hidden mb-6 shadow-inner border border-slate-700/50 relative group select-none"
        onCopy={handleCopyPaste}
        onCut={handleCopyPaste}
        onPaste={handleCopyPaste}
      >
        <div className="absolute top-0 right-0 p-2 opacity-50 text-xs text-slate-400 bg-slate-800 rounded-bl-lg pointer-events-none">
          Selection Disabled
        </div>
        <SyntaxHighlighter
          language={snippet.language.toLowerCase() === 'c++' ? 'cpp' : snippet.language.toLowerCase()}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '2rem 1.5rem',
            background: '#1e1e1e',
            fontSize: '15px',
            fontFamily: '"Fira Code", "JetBrains Mono", monospace',
            lineHeight: '1.6',
            userSelect: 'none',
          }}
          showLineNumbers={true}
          wrapLines={true}
        >
          {snippet.code_snippet}
        </SyntaxHighlighter>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 relative">
        <label className="block text-slate-400 text-sm font-medium mb-2" htmlFor="output-input">
          Expected Output:
        </label>
        <div className="flex gap-4">
          <input
            id="output-input"
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setStatus('idle'); }}
            placeholder="Type your answer here..."
            autoComplete="off"
            spellCheck="false"
            className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all font-mono text-lg placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={status === 'correct'}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Check
          </button>
        </div>
      </form>

      {/* Feedback Area */}
      <div className={`transition-all duration-300 ease-in-out ${status === 'idle' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        {status === 'correct' && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 text-green-500/10">
              <CheckCircle2 className="w-32 h-32" />
            </div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <h3 className="text-2xl font-bold text-green-400">Correct!</h3>
            </div>
            <p className="text-green-100 relative z-10 text-lg mb-6">{snippet.explanation}</p>
            <button
              onClick={onNext}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg relative z-10"
            >
              Next Question
            </button>
          </div>
        )}

        {status === 'almost' && (
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-xl font-bold text-yellow-400">Almost Correct!</h3>
            </div>
            <p className="text-yellow-100/80">
              You're extremely close. Make sure the case (uppercase/lowercase) matches exactly.
            </p>
          </div>
        )}

        {status === 'incorrect' && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-5 relative overflow-hidden animate-shake">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Incorrect</h3>
            </div>
            <p className="text-red-200/80 mb-1">
              That's not quite right. Look closely at the code again. Unlimited tries are allowed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
