import { useState } from 'react';

export default function App() {
  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState('quiz');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-100 to-pink-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white/90 shadow-xl rounded-2xl p-6 w-full max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-purple-700 mb-4">🎮 שיח ערבי – המשחק שלי</h1>
        <p className="text-gray-700 mb-6">גרסה מותאמת ל-GitHub Pages</p>

        <div className="flex justify-center gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded-xl ${mode === 'quiz' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('quiz')}
          >🎯 מצב תרגול</button>

          <button
            className={`px-4 py-2 rounded-xl ${mode === 'study' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('study')}
          >📚 מצב לימוד</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {['🌸 ברכות', '📅 ימות השבוע', '🔢 מספרים', '👨‍👩‍👧‍👦 משפחה', '🕒 זמן', '🤝 נימוס'].map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setCategory(cat)}
              className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl"
            >{cat}</button>
          ))}
        </div>

        {category && (
          <div className="mt-8 bg-purple-50 p-4 rounded-xl shadow-inner">
            <h2 className="text-2xl font-bold mb-3">{category}</h2>
            <p>כאן יוצגו השאלות והתרגולים של הקטגוריה הנבחרת.</p>
            <button
              onClick={() => setCategory(null)}
              className="mt-4 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl"
            >⬅️ חזרה</button>
          </div>
        )}

        <footer className="mt-8 text-sm text-gray-600">
          🌐 גרסה מוכנה לפרסום מהיר ב־GitHub Pages — פשוט העלה לריפו והרץ:<br />
          <code>npm run deploy</code>
        </footer>
      </div>
    </div>
  );
}
