\
import { useEffect, useMemo, useRef, useState } from 'react';

// No CSS import to avoid missing-file build errors.
// Uses utility class names; even without Tailwind the app remains functional.

/*********************************
 * Utility: Web Speech (TTS)
 *********************************/
function speak(text, lang = 'ar-SA') {
  if (!text) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang; // prefer Arabic voice if available
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const arVoice = voices.find(v => v.lang?.toLowerCase().startsWith('ar'));
    if (arVoice) utter.voice = arVoice;
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utter);
  } catch (_) { /* ignore */ }
}

/*********************************
 * Runtime self-tests (dataset QA)
 *********************************/
function runSelfTests(bank) {
  const errors = [];
  const add = (msg) => errors.push(msg);
  const catKeys = Object.keys(bank);
  if (catKeys.length === 0) add('No categories found.');
  for (const key of catKeys) {
    const arr = bank[key];
    if (!Array.isArray(arr) || arr.length === 0) add(`Category "${key}" is empty.`);
    arr.forEach((q, i) => {
      const id = `${key}#${i + 1}`;
      if (!q) add(`${id}: question is null/undefined.`);
      const { type, arabic, translit, hebrew, options, answer } = q || {};
      if (!['AR_HE', 'HE_AR'].includes(type)) add(`${id}: invalid/missing type (AR_HE or HE_AR).`);
      if (type === 'AR_HE' && (!arabic || !translit)) add(`${id}: AR_HE requires arabic+translit.`);
      if (type === 'HE_AR' && !hebrew) add(`${id}: HE_AR requires hebrew prompt.`);
      if (!Array.isArray(options) || options.length < 3) add(`${id}: options must have >=3 items.`);
      if (typeof answer !== 'string') add(`${id}: answer must be string.`);
      if (Array.isArray(options) && !options.includes(answer)) add(`${id}: answer not in options.`);
    });
  }
  return errors;
}

/*********************************
 * Question types by category
 * Types:
 *  - AR_HE: prompt shows Arabic + translit; options are Hebrew glosses.
 *  - HE_AR: prompt shows Hebrew; options are Arabic + translit combined.
 *********************************/
const BANK = {
  // 🌸 Greetings (ברכות) — KEEP existing first items unchanged
  greetings: [
    { type: 'AR_HE', arabic: 'صباح الخير', translit: 'סבַּאח אלְחֵ׳יר', hebrew: 'בוקר טוב', options: ['ערב טוב', 'בוקר טוב', 'להתראות'], answer: 'בוקר טוב' },
    { type: 'AR_HE', arabic: 'مساء الخير', translit: 'מַסַאא׳ אלְחֵ׳יר', hebrew: 'ערב טוב', options: ['ערב טוב', 'שלום', 'תודה'], answer: 'ערב טוב' },
    { type: 'AR_HE', arabic: 'مع السلامة', translit: 'מַעַ א(ל)סַּלַאמֶה', hebrew: 'להתראות', options: ['להתראות', 'בוקר טוב', 'תודה'], answer: 'להתראות' },
    { type: 'AR_HE', arabic: 'شكرًا', translit: 'שֻכְּרַן', hebrew: 'תודה', options: ['שלום', 'תודה', 'בבקשה'], answer: 'תודה' },
    { type: 'AR_HE', arabic: 'مرحبا', translit: 'מַרְחַבַּא', hebrew: 'שלום / ברוך הבא', options: ['שלום / ברוך הבא', 'מה נשמע', 'לילה טוב'], answer: 'שלום / ברוך הבא' },
    { type: 'HE_AR', hebrew: 'בוקר טוב', arabic: 'صباح الخير', translit: 'סבַּאח אלְחֵ׳יר', options: ['مساء الخير — מַסַאא׳ אלְחֵ׳יר', 'صباح الخير — סבַּאח אלְחֵ׳יר', 'شكراً — שֻכְּרַן'], answer: 'صباح الخير — סבַּאח אלְחֵ׳יר' },
    // New items
    { type: 'AR_HE', arabic: 'أهلًا وسهلًا', translit: 'אַהְלַא וּסַהְלַא', hebrew: 'ברוכים הבאים', options: ['ברוכים הבאים', 'לילה טוב', 'תודה'], answer: 'ברוכים הבאים' },
    { type: 'AR_HE', arabic: 'تصبح على خير', translit: 'תִצְבַּח עַלַא חֵ׳יר', hebrew: 'לילה טוב (כשנפרדים)', options: ['לילה טוב (כשנפרדים)', 'צהריים טובים', 'ברוכים הבאים'], answer: 'לילה טוב (כשנפרדים)' },
    { type: 'HE_AR', hebrew: 'נעים להכיר', arabic: 'تشرفنا', translit: 'תַשַרַפְנַא', options: ['تشرفنا — תַשַרַפְנַא', 'سلام — סַלַאם', 'يعطيك العافية — יַעְטִיק אלְעַאפִיֶה'], answer: 'تشرفنا — תַשַרַפְנַא' },
    { type: 'AR_HE', arabic: 'سلام', translit: 'סַלַאם', hebrew: 'שלום', options: ['שלום', 'תודה', 'להתראות'], answer: 'שלום' },
  ],

  // 📅 Days of week
  days: [
    { type: 'AR_HE', arabic: 'الأحد', translit: 'אֶלְאַחַד', hebrew: 'יום ראשון', options: ['יום ראשון', 'יום שלישי', 'יום שבת'], answer: 'יום ראשון' },
    { type: 'AR_HE', arabic: 'الإثنين', translit: 'אֶתְנֵין', hebrew: 'יום שני', options: ['יום שישי', 'יום שני', 'יום רביעי'], answer: 'יום שני' },
    { type: 'AR_HE', arabic: 'الثلاثاء', translit: 'תְלָאתַא', hebrew: 'יום שלישי', options: ['יום ראשון', 'יום שלישי', 'יום חמישי'], answer: 'יום שלישי' },
    { type: 'AR_HE', arabic: 'الأربعاء', translit: 'אַרְבַּעַא', hebrew: 'יום רביעי', options: ['יום רביעי', 'יום שישי', 'יום שני'], answer: 'יום רביעי' },
    { type: 'AR_HE', arabic: 'الخميس', translit: 'חַמִיס', hebrew: 'יום חמישי', options: ['יום חמישי', 'יום שבת', 'יום שני'], answer: 'יום חמישי' },
    { type: 'AR_HE', arabic: 'الجمعة', translit: 'גֻ׳מְעַה', hebrew: 'יום שישי', options: ['יום שני', 'יום שישי', 'יום שלישי'], answer: 'יום שישי' },
    { type: 'AR_HE', arabic: 'السّبت', translit: 'א(ל)סַּבְּת', hebrew: 'יום שבת', options: ['יום שבת', 'יום ראשון', 'יום חמישי'], answer: 'יום שבת' },
    { type: 'HE_AR', hebrew: 'יום ראשון', arabic: 'الأحد', translit: 'אֶלְאַחַד', options: ['الأحد — אֶלְאַחַד', 'الخميس — חַמִיס', 'الثلاثاء — תְלָאתַא'], answer: 'الأحد — אֶלְאַחַד' },
  ],

  // 🔢 Numbers 0–10
  numbers: [
    { type: 'AR_HE', arabic: 'صفر', translit: 'סִפְר', hebrew: 'אפס', options: ['אפס', 'אחד', 'עשרה'], answer: 'אפס' },
    { type: 'AR_HE', arabic: 'واحد', translit: 'וַאחֶד', hebrew: 'אחד', options: ['שניים', 'שלושה', 'אחד'], answer: 'אחד' },
    { type: 'HE_AR', hebrew: 'שניים', arabic: 'اثنين/إثنين', translit: 'אִתְנֵין', options: ['اثنين — אִתְנֵין', 'ستة — סִתֶּה', 'خمسة — חַמְסֶה'], answer: 'اثنين — אִתְנֵין' },
    { type: 'AR_HE', arabic: 'تلاتة/ثلاثة', translit: 'תַלַאתֶה', hebrew: 'שלושה', options: ['שלושה', 'ארבעה', 'שניים'], answer: 'שלושה' },
    { type: 'AR_HE', arabic: 'أربعة', translit: 'אַרְבַּעַה', hebrew: 'ארבעה', options: ['ארבעה', 'שבעה', 'שישה'], answer: 'ארבעה' },
    { type: 'AR_HE', arabic: 'خمسة', translit: 'חַמְסֶה', hebrew: 'חמישה', options: ['חמישה', 'שישה', 'שמונה'], answer: 'חמישה' },
    { type: 'AR_HE', arabic: 'ستة', translit: 'סִתֶּה', hebrew: 'שישה', options: ['ארבעה', 'שישה', 'שניים'], answer: 'שישה' },
    { type: 'AR_HE', arabic: 'سبعة', translit: 'סַבְעַה', hebrew: 'שבעה', options: ['שניים', 'שבעה', 'עשרה'], answer: 'שבעה' },
    { type: 'AR_HE', arabic: 'تمانية', translit: 'תַמַאנְיֶה', hebrew: 'שמונה', options: ['תשעה', 'שמונה', 'שלושה'], answer: 'שמונה' },
    { type: 'AR_HE', arabic: 'تسعة', translit: 'תִסְעַה', hebrew: 'תשעה', options: ['תשעה', 'עשרה', 'אחד'], answer: 'תשעה' },
    { type: 'AR_HE', arabic: 'عشرة', translit: 'עַשְרַה', hebrew: 'עשרה', options: ['אחד', 'עשרה', 'שמונה'], answer: 'עשרה' },
  ],

  // 👨‍👩‍👧‍👦 Family
  family: [
    { type: 'AR_HE', arabic: 'أمّ', translit: 'אֻםّ', hebrew: 'אמא', options: ['אמא', 'אבא', 'בת'], answer: 'אמא' },
    { type: 'AR_HE', arabic: 'أب', translit: 'אַבּ', hebrew: 'אבא', options: ['אח', 'אבא', 'דוד'], answer: 'אבא' },
    { type: 'AR_HE', arabic: 'أخ', translit: 'אַחְ', hebrew: 'אח', options: ['אח', 'סבא', 'בת'], answer: 'אח' },
    { type: 'AR_HE', arabic: 'أخت', translit: 'אֻחְת', hebrew: 'אחות', options: ['דוד', 'אחות', 'אמא'], answer: 'אחות' },
    { type: 'AR_HE', arabic: 'جدّ', translit: 'ג׳דּ', hebrew: 'סבא', options: ['סבא', 'אבא', 'אח'], answer: 'סבא' },
    { type: 'AR_HE', arabic: 'جدّة', translit: 'ג׳דֶּה', hebrew: 'סבתא', options: ['סבתא', 'אחות', 'בת'], answer: 'סבתא' },
    { type: 'AR_HE', arabic: 'ابن', translit: 'אִבֶּן', hebrew: 'בן', options: ['בת', 'דוד', 'בן'], answer: 'בן' },
    { type: 'AR_HE', arabic: 'بنت', translit: 'בִּנְת', hebrew: 'בת', options: ['דוד', 'בת', 'סבתא'], answer: 'בת' },
    { type: 'AR_HE', arabic: 'عمّ', translit: 'עַםּ', hebrew: 'דוד (מצד אבא)', options: ['דוד (מצד אבא)', 'סבא', 'אח'], answer: 'דוד (מצד אבא)' },
    { type: 'AR_HE', arabic: 'خال', translit: 'ח׳אל', hebrew: 'דוד (מצד אמא)', options: ['דוד (מצד אמא)', 'בן', 'בת'], answer: 'דוד (מצד אמא)' },
    { type: 'HE_AR', hebrew: 'סבתא', arabic: 'جدّة', translit: 'ג׳דֶּה', options: ['جدّة — ג׳דֶּה', 'أمّ — אֻםּ', 'أב — אַבּ'], answer: 'جدّة — ג׳דֶּה' },
  ],

  // 🕒 Time words
  timeWords: [
    { type: 'AR_HE', arabic: 'اليوم', translit: 'אֶלְיוֹם', hebrew: 'היום', options: ['מחר', 'היום', 'אתמול'], answer: 'היום' },
    { type: 'AR_HE', arabic: 'امبارح', translit: 'אֶמְבַּארֶח', hebrew: 'אתמול', options: ['שלשום', 'אתמול', 'היום'], answer: 'אתמול' },
    { type: 'AR_HE', arabic: 'أول امبارح', translit: 'אוּל אֶמְבַּארֶח', hebrew: 'שלשום', options: ['שלשום', 'היום', 'מחרתיים'], answer: 'שלשום' },
    { type: 'AR_HE', arabic: 'بكرة', translit: 'בֻכְּרַא', hebrew: 'מחר', options: ['מחר', 'היום', 'אתמול'], answer: 'מחר' },
    { type: 'AR_HE', arabic: 'بعد بكرة', translit: 'בַּעְד בֻכְּרַא', hebrew: 'מחרתיים', options: ['שלשום', 'מחרתיים', 'מחר'], answer: 'מחרתיים' },
    { type: 'HE_AR', hebrew: 'אתמול', arabic: 'امبارح', translit: 'אֶמְבַּארֶח', options: ['امبارح — אֶמְבַּארֶח', 'اليوم — אֶלְיוֹם', 'بكرة — בֻכְּרַא'], answer: 'امبارح — אֶמְבַּארֶח' },
  ],

  // 🤝 Politeness
  politeness: [
    { type: 'AR_HE', arabic: 'عفواً', translit: 'עַפְוַאן', hebrew: 'בבקשה / על לא דבר', options: ['סליחה', 'בבקשה / על לא דבר', 'תודה'], answer: 'בבקשה / על לא דבר' },
    { type: 'AR_HE', arabic: 'لو سمحت', translit: 'לַו סַמַחְת', hebrew: 'בבקשה (פנייה מנומסת)', options: ['בבקשה (פנייה מנומסת)', 'סליחה', 'להתראות'], answer: 'בבקשה (פנייה מנומסת)' },
    { type: 'AR_HE', arabic: 'من فضلك', translit: 'מִן פַצ׳לַכּ', hebrew: 'בבקשה (פנייה מנומסת)', options: ['תודה', 'בבקשה (פנייה מנומסת)', 'שלום'], answer: 'בבקשה (פנייה מנומסת)' },
    { type: 'AR_HE', arabic: 'تمام', translit: 'תַמַאם', hebrew: 'בסדר גמור', options: ['בסדר גמור', 'שלום', 'לילה טוב'], answer: 'בסדר גמור' },
    { type: 'HE_AR', hebrew: 'תודה', arabic: 'شكراً', translit: 'שֻכְּרַן', options: ['شكراً — שֻכְּרַן', 'عفواً — עַפְוַאן', 'سلام — סַלַאם'], answer: 'شكراً — שֻכְּרַן' },
    { type: 'HE_AR', hebrew: 'בבקשה / על לא דבר', arabic: 'عفواً', translit: 'עַפְוַאן', options: ['عفواً — עַפְוַאן', 'مع السلامة — מַעַ א(ל)סלאמה', 'مرحبا — מַרְחַבַּא'], answer: 'عفواً — עַפְוַאן' },
  ],
};

const CATEGORY_META = {
  greetings: { title: '🌸 ברכות' },
  days: { title: '📅 ימות השבוע' },
  numbers: { title: '🔢 מספרים' },
  family: { title: '👨‍👩‍👧‍👦 משפחה' },
  timeWords: { title: '🕒 מילות זמן' },
  politeness: { title: '🤝 ביטויי נימוס' },
  mixed: { title: '🧠 אתגר משולב' },
};

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildMixed(bank, limit = 12) {
  const all = Object.keys(bank).filter(k => k !== 'mixed').flatMap(k => bank[k]);
  return shuffle(all).slice(0, limit);
}

// Timing + bonus
const QUESTION_TIME_MS = 15000; // 15s per item
const TICK_MS = 100;            // update rate

function loadHighScore() {
  try { return Number(localStorage.getItem('arabicGameHighScore') || 0) || 0; } catch { return 0; }
}
function saveHighScore(v) {
  try { localStorage.setItem('arabicGameHighScore', String(v)); } catch { /* ignore */ }
}

export default function App() {
  const [category, setCategory] = useState(null); // key from CATEGORY_META
  const [mode, setMode] = useState('quiz'); // 'quiz' | 'study'
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(loadHighScore());
  const [feedback, setFeedback] = useState('');
  const [showDiag, setShowDiag] = useState(false);

  // NEW: summary & correctness tracking and per-question lock
  const [showSummary, setShowSummary] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false); // prevents multi-click scoring on a question

  // Timer state
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS);
  const timerRef = useRef(null);

  // Dataset for the selected category
  const data = useMemo(() => {
    if (!category) return [];
    if (category === 'mixed') return buildMixed(BANK, 12);
    return BANK[category] || [];
  }, [category]);

  const q = data[step];

  // Self-tests once
  const testResults = useMemo(() => runSelfTests(BANK), []);

  useEffect(() => {
    if (testResults.length === 0) console.info('✅ Dataset self-tests passed.');
    else console.error('❌ Dataset self-tests issues:', testResults);
  }, [testResults]);

  // Start/restart timer on new question in QUIZ mode
  useEffect(() => {
    clearInterval(timerRef.current);
    setTimeLeft(QUESTION_TIME_MS);
    setLocked(false); // unlock on new question
    if (!q || mode !== 'quiz' || showSummary) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - TICK_MS);
        if (next === 0) {
          clearInterval(timerRef.current);
          setFeedback('⏰ הזמן נגמר');
          // auto-advance after short pause; counts as answered but not correct
          setTimeout(() => {
            setFeedback('');
            if (step + 1 < data.length) setStep(i => i + 1); else setShowSummary(true);
          }, 700);
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [step, category, mode, showSummary]);

  // Persist high score whenever score exceeds it
  useEffect(() => {
    if (score > high) {
      setHigh(score);
      saveHighScore(score);
    }
  }, [score]);

  function answeredCount() {
    // step is zero-based index of current question; number answered is
    //  - if summary or finished: data.length
    //  - else: step (already answered) count
    if (showSummary) return Math.min(step, data.length);
    return Math.min(step, data.length);
  }

  function resetRun() {
    setStep(0);
    setScore(0);
    setCorrectCount(0);
    setFeedback('');
    setTimeLeft(QUESTION_TIME_MS);
    setLocked(false);
    setShowSummary(false);
  }

  function bonusForSpeed(remainingMs) {
    // Base 10 pts + speed bonus up to +5 for instant answers
    const ratio = Math.max(0, Math.min(1, remainingMs / QUESTION_TIME_MS));
    return Math.ceil(ratio * 5); // 0..5
  }

  function advanceAfterCorrect() {
    setTimeout(() => {
      setFeedback('');
      if (step + 1 < data.length) setStep(i => i + 1); else setShowSummary(true);
    }, 700);
  }

  function handlePick(opt) {
    if (!q || mode !== 'quiz' || locked) return; // prevent multi-score
    clearInterval(timerRef.current);
    if (opt === q.answer) {
      const bonus = bonusForSpeed(timeLeft);
      const add = 10 + bonus;
      setScore(s => s + add);
      setCorrectCount(c => c + 1);
      setFeedback(`✅ נכון! +${add} נק׳ (כולל בונוס מהירות ${bonus})`);
      setLocked(true); // lock to avoid duplicate scoring
      advanceAfterCorrect();
    } else {
      setFeedback('❌ נסה שוב');
    }
  }

  function nextStudy() {
    if (step + 1 < data.length) setStep(i => i + 1); else setShowSummary(true);
  }

  function exitToSummary() {
    clearInterval(timerRef.current);
    setShowSummary(true);
  }

  function renderTimer() {
    if (mode !== 'quiz' || showSummary) return null;
    const pct = Math.round((timeLeft / QUESTION_TIME_MS) * 100);
    return (
      <div className="mb-3">
        <div className="text-sm text-gray-600">⏳ זמן: {(timeLeft / 1000).toFixed(1)}s</div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-400 to-red-400" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  function renderPrompt() {
    if (!q) return null;
    if (q.type === 'AR_HE') {
      return (
        <div className="mb-4">
          <div className="text-4xl mb-2">{q.arabic}</div>
          <div className="text-xl text-gray-600 mb-3">{q.translit}</div>
          <button className="text-sm px-3 py-1 rounded-xl bg-blue-100 hover:bg-blue-200" onClick={() => speak(q.arabic, 'ar-SA')}>🔊 נגן</button>
        </div>
      );
    }
    // HE_AR
    return (
      <div className="mb-4">
        <div className="text-2xl mb-1">בחר/י את התשובה הנכונה לערך:</div>
        <div className="text-3xl font-semibold mb-2">{q.hebrew}</div>
        <div className="text-sm text-gray-600">(האופציות מציגות ערבית + תעתיק)</div>
      </div>
    );
  }

  function renderOptions() {
    if (!q || mode !== 'quiz') return null;
    return (
      <div className="grid gap-3">
        {q.options.map((opt) => (
          <div key={opt} className="flex items-stretch gap-2">
            <button
              onClick={() => handlePick(opt)}
              disabled={locked}
              className={`flex-1 py-2 px-4 rounded-xl text-lg text-center text-white ${locked ? 'bg-purple-300' : 'bg-purple-500 hover:bg-purple-600'}`}
            >
              {opt}
            </button>
            {/* Speaker per option for HE_AR so learner can hear Arabic per choice */}
            {q.type === 'HE_AR' && (
              <button
                title="נגן הקראה לאפשרות"
                className="px-3 rounded-xl bg-blue-100 hover:bg-blue-200"
                onClick={() => {
                  const [ar] = opt.split(' — ');
                  speak(ar, 'ar-SA');
                }}
              >🔊</button>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderStudyCard() {
    if (!q || mode !== 'study') return null;
    if (q.type === 'AR_HE') {
      return (
        <div className="bg-white shadow rounded-2xl p-6">
          <div className="text-4xl mb-2">{q.arabic}</div>
          <div className="text-xl text-gray-600 mb-4">{q.translit}</div>
          <div className="text-lg">המשמעות בעברית: <b>{q.hebrew}</b></div>
          <button className="mt-3 text-sm px-3 py-1 rounded-xl bg-blue-100 hover:bg-blue-200" onClick={() => speak(q.arabic, 'ar-SA')}>🔊 נגן</button>
        </div>
      );
    }
    // HE_AR
    return (
      <div className="bg-white shadow rounded-2xl p-6">
        <div className="text-2xl mb-1">עברית:</div>
        <div className="text-3xl font-semibold mb-3">{q.hebrew}</div>
        <div className="text-lg">בערבית: <b>{q.arabic}</b></div>
        <div className="text-lg">תעתיק: <b>{q.translit}</b></div>
        <button className="mt-3 text-sm px-3 py-1 rounded-xl bg-blue-100 hover:bg-blue-200" onClick={() => speak(q.arabic, 'ar-SA')}>🔊 נגן</button>
      </div>
    );
  }

  // SUMMARY SCREEN
  if (category && showSummary) {
    const total = data.length;
    const answered = Math.min(step, total); // how many advanced through
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-200 flex flex-col items-center p-6">
        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-purple-700 mb-3">סיכום תרגול</h2>
          <p className="text-lg mb-2">ענית על <b>{answered}</b> שאלות מתוך <b>{total}</b>.</p>
          <p className="text-lg mb-2">תשובות נכונות: <b>{correctCount}</b>.</p>
          <p className="text-xl mb-4">סה״כ ניקוד: <b>{score}</b> · 🏁 שיא: <b>{high}</b></p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { resetRun(); setCategory(null); }} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl">לתפריט הראשי</button>
            <button onClick={() => { resetRun(); }} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl">שחק שוב 🔁</button>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-100 to-pink-100 flex items-center justify-center p-6">
        <div className="bg-white/90 shadow-xl rounded-2xl p-6 w-full max-w-3xl">
          <h1 className="text-3xl font-bold text-purple-700 mb-2">🎮 שיח ערבי – המשחק שלי</h1>
          <p className="text-gray-700 mb-1">בחר/י קטגוריה ומצב משחק: תרגול (Quiz) עם ניקוד, או מצב לימוד (Study) עם הצגת התשובה והקראה.</p>
          <p className="text-gray-700 mb-4">🏁 שיא אישי: <b>{high}</b> נק׳ (נשמר בדפדפן)</p>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('quiz')} className={`px-3 py-2 rounded-xl ${mode === 'quiz' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>🎯 מצב תרגול (Quiz)</button>
            <button onClick={() => setMode('study')} className={`px-3 py-2 rounded-xl ${mode === 'study' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>📚 מצב לימוד (Study)</button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button key={key} onClick={() => { setCategory(key); resetRun(); }} className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl">
                {meta.title}
              </button>
            ))}
          </div>

          {/* Diagnostics */}
          <div className="mt-6">
            <button className="text-sm underline text-gray-600" onClick={() => setShowDiag(v => !v)}>
              {showDiag ? 'הסתר בדיקות נתונים' : 'הצג בדיקות נתונים'}
            </button>
            {showDiag && (
              <div className="text-left bg-white/80 rounded-xl p-4 mt-2 text-sm">
                {runSelfTests(BANK).length === 0 ? (
                  <p className="text-green-700">✅ כל הבדיקות עברו בהצלחה.</p>
                ) : (
                  <ul className="list-disc ml-5">
                    {runSelfTests(BANK).map((e, i) => (<li key={i} className="text-red-700">{e}</li>))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const title = CATEGORY_META[category]?.title || 'תרגול';
  const finished = step >= data.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-purple-200 flex flex-col items-center p-4">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCategory(null)} className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl">⬅️ תפריט</button>
          <h2 className="text-2xl font-bold text-purple-700">{title} — {mode === 'quiz' ? '🎯 תרגול' : '📚 לימוד'}</h2>
          <div className="px-3 py-2 rounded-xl bg-yellow-100">🏅 ניקוד: <b>{score}</b> · 🏁 שיא: <b>{high}</b></div>
        </div>

        {!finished ? (
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <p className="text-lg text-gray-700 mb-2">פריט {step + 1} מתוך {data.length}</p>
              <button onClick={exitToSummary} className="text-sm px-3 py-1 rounded-xl bg-red-100 hover:bg-red-200">🚪 יציאה</button>
            </div>
            {renderTimer()}
            {renderPrompt()}
            {mode === 'quiz' ? (
              <>
                {renderOptions()}
                <p className="mt-4 text-md {feedback ? 'text-blue-600' : 'text-gray-400'}">{feedback}</p>
              </>
            ) : (
              <>
                {renderStudyCard()}
                <div className="mt-4 flex gap-2 justify-center">
                  <button onClick={() => nextStudy()} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl">הלאה ▶️</button>
                  <button onClick={exitToSummary} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl">סיים</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">🎉 כל הכבוד!</p>
            <p className="mb-2">ענית על <b>{data.length}</b> שאלות מתוך <b>{data.length}</b>.</p>
            <p className="mb-2">תשובות נכונות: <b>{correctCount}</b>.</p>
            <p className="mb-4">הניקוד שלך: <b>{score}</b> · 🏁 שיא אישי: <b>{high}</b></p>
            <div className="flex gap-3 justify-center">
              <button onClick={resetRun} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl">שחק שוב 🔁</button>
              <button onClick={() => setCategory(null)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl">לתפריט</button>
            </div>
          </div>
        )}

        {/* Toggle diagnostics */}
        <div className="mt-4 flex justify-center">
          <button className="text-sm underline text-gray-600" onClick={() => setShowDiag(v => !v)}>
            {showDiag ? 'הסתר בדיקות' : 'הצג בדיקות'}
          </button>
        </div>
        {showDiag && (
          <div className="text-left bg-white/80 rounded-xl p-4 mt-2 text-sm">
            {testResults.length === 0 ? (
              <p className="text-green-700">✅ כל הבדיקות עברו בהצלחה.</p>
            ) : (
              <ul className="list-disc ml-5">
                {testResults.map((e, i) => (<li key={i} className="text-red-700">{e}</li>))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
