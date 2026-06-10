import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CodeSnippetGame } from '../components/CodeSnippetGame';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL ?? 'https://medhax-2.onrender.com') + '/api';

interface CodeSnippet {
  id: string;
  language: string;
  topic: string;
  difficulty: string;
  code_snippet: string;
  expected_output: string;
  explanation: string;
}

export default function CodeSnippetsPage() {
  const navigate = useNavigate();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch random snippets for training
    // We'll use a mocked endpoint or just fetch a sample for now if backend is not ready
    const fetchSnippets = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/snippets/training`);
        setSnippets(res.data.snippets || []);
      } catch (err) {
        console.error('Failed to fetch snippets:', err);
        // Fallback mock data if endpoint is not fully implemented yet
        setSnippets([{
          id: 'snip-mock-01',
          language: 'JavaScript',
          topic: 'Closures',
          difficulty: 'medium',
          code_snippet: 'function makeCounter() {\n  let count = 0;\n  return function() {\n    return count++;\n  };\n}\n\nconst counter = makeCounter();\ncounter();\nconsole.log(counter());',
          expected_output: '1',
          explanation: 'The first call returns 0 and increments. The second call returns 1.'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchSnippets();
  }, []);

  const handleNext = () => {
    if (currentIndex < snippets.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop or fetch more
      setCurrentIndex(0);
    }
  };

  return (
    <div className="page min-h-screen flex flex-col bg-[#0f172a]">
      <Navbar />
      <div className="page-content flex-1 flex flex-col items-center justify-center p-6 relative">
        <button 
          onClick={() => navigate('/dashboard')}
          className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center text-cyan-400 gap-4">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-lg font-semibold tracking-widest uppercase">Loading Snippets...</p>
          </div>
        ) : snippets.length > 0 ? (
          <div className="w-full animate-fade-in-up">
            <CodeSnippetGame 
              key={snippets[currentIndex].id} 
              snippet={snippets[currentIndex]} 
              onNext={handleNext} 
            />
          </div>
        ) : (
          <div className="text-slate-400 text-lg">No snippets found.</div>
        )}
      </div>
    </div>
  );
}
