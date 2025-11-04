\
import { useEffect, useMemo, useRef, useState } from 'react';

function speak(text, lang = 'ar-SA') {
  if (!text) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const arVoice = voices.find(v => v.lang?.toLowerCase().startsWith('ar'));
    if (arVoice) utter.voice = arVoice;
    window.speechSynthesis?.cancel();
    window.speechSynthesis?.speak(utter);
  } catch {}
}

function runSelfTests(bank) {
  const errors = [];
  const add = (m) => errors.push(m);
  for (const [key, arr] of Object.entries(bank)) {
    if (!Array.isArray(arr) || arr.length === 0) add(`Category "${key}" empty.`);
    arr.forEach((q, i) => {
      const id = `${key}#${i+1}`;
      if (!q) add(`${id}: missing item`);
      const { type, arabic, translit, hebrew, options, answer } = q || {};
      if (!['AR_HE','HE_AR'].includes(type)) add(`${id}: invalid type`);
      if (type === 'AR_HE' && (!arabic || !translit)) add(`${id}: AR_HE needs arabic+translit`);
      if (type === 'HE_AR' && !hebrew) add(`${id}: HE_AR needs hebrew`);
      if (!Array.isArray(options) || options.length < 3) add(`${id}: need >=3 options`);
      if (typeof answer !== 'string' || !options?.includes(answer)) add(`${id}: bad answer/options`);
    });
  }
  return errors;
}

const BANK = {
  greetings: [
    { type: 'AR_HE', arabic: 'صباح الخير', translit: 'סבַּאח אלְחֵ׳יר', hebrew: 'בוקר טוב', options: ['ערב טוב', 'בוקר טוב', 'להתראות'], answer: 'בוקר טוב' },
    { type: 'AR_HE', arabic: 'مساء الخير', translit: 'מַסַאא׳ אלְחֵ׳יר', hebrew: 'ערב טוב', options: ['ערב טוב', 'שלום', 'תודה'], answer: 'ערב טוב' },
    { type: 'AR_HE', arabic: 'مع السلامة', translit: 'מַעַ א(ל)סַּלַאמֶה', hebrew: 'להתראות', options: ['להתראות', 'בוקר טוב', 'תודה'], answer: 'להתראות' },
    { type: 'AR_HE', arabic: 'شكرًا', translit: 'שֻכְּרַן', hebrew: 'תודה', options: ['שלום', 'תודה', 'בבקשה'], answer: 'תודה' },
    { type: 'AR_HE', arabic: 'مرحبا', translit: 'מַרְחַבַּא', hebrew: 'שלום / ברוך הבא', options: ['שלום / ברוך הבא', 'מה נשמע', 'לילה טוב'], answer: 'שלום / ברוך הבא' },
    { type: 'HE_AR', hebrew: 'בוקר טוב', arabic: 'صباح الخير', translit: 'סבַּאח אלְחֵ׳יר', options: ['مساء الخير — מַסַאא׳ אלְחֵ׳יר', 'صباح الخير — סבַּאח אלְחֵ׳יר', 'شكراً — שֻכְּרַן'], answer: 'صباح الخير — סבַּאח אלְחֵ׳יר' },
    { type: 'AR_HE', arabic: 'أهلًا وسهلًا', translit: 'אַהְלַא וּסַהְלַא', hebrew: 'ברוכים הבאים', options: ['ברוכים הבאים', 'לילה טוב', 'תודה'], answer: 'ברוכים הבאים' },
    { type: 'AR_HE', arabic: 'تصبح على خير', translit: 'תִצְבַּח עַלַא חֵ׳יר', hebrew: 'לילה טוב (כשנפרדים)', options: ['לילה טוב (כשנפרדים)', 'צהריים טובים', 'ברוכים הבאים'], answer: 'לילה טוב (כשנפרדים)' },
    { type: 'HE_AR', hebrew: 'נעים להכיר', arabic: 'تشرفنا', translit: 'תַשַרַפְנַא', options: ['تشرفنا — תַשַרַפְנַא', 'سلام — סַלַאם', 'يعطيك العافية — יַעְטִיק אלְעַאפִיֶה'], answer: 'تشرفنا — תַשַרַפְנַא' },
    { type: 'AR_HE', arabic: 'سلام', translit: 'סַלַאם', hebrew: 'שלום', options: ['שלום', 'תודה', 'להתראות'], answer: 'שלום' },
  ],
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
  timeWords: [
    { type: 'AR_HE', arabic: 'اليوم', translit: 'אֶלְיוֹם', hebrew: 'היום', options: ['מחר', 'היום', 'אתמול'], answer: 'היום' },
    { type: 'AR_HE', arabic: 'امبارح', translit: 'אֶמְבַּארֶח', hebrew: 'אתמול', options: ['שלשום', 'אתמול', 'היום'], answer: 'אתמול' },
    { type: 'AR_HE', arabic: 'أول امبارح', translit: 'אוּל אֶמְבַּארֶח', hebrew: 'שלשום', options: ['שלשום', 'היום', 'מחרתיים'], answer: 'שלשום' },
    { type: 'AR_HE', arabic: 'بكرة', translit: 'בֻכְּרַא', hebrew: 'מחר', options: ['מחר', 'היום', 'אתמול'], answer: 'מחר' },
    { type: 'AR_HE', arabic: 'بعد بكرة', translit: 'בַּעְד בֻכְּרַא', hebrew: 'מחרתיים', options: ['שלשום', 'מחרתיים', 'מחר'], answer: 'מחרתיים' },
    { type: 'HE_AR', hebrew: 'אתמול', arabic: 'امبارح', translit: 'אֶמְבַּארֶח', options: ['امبارح — אֶמְבַּארֶח', 'اليوم — אֶלְיוֹם', 'بكرة — בֻכְּרַא'], answer: 'امبارح — אֶמְבַּארֶח' },
  ],
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

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function buildMixed(bank, limit = 12) {
  const all = Object.keys(bank).filter(k => k !== 'mixed').flatMap(k => bank[k]);
  return shuffle(all).slice(0, limit);
}

const QUESTION_TIME_MS = 15000;
const TICK_MS = 100;
function loadHighScore(){ try { return Number(localStorage.getItem('arabicGameHighScore')||0)||0 } catch { return 0 } }
function saveHighScore(v){ try { localStorage.setItem('arabicGameHighScore', String(v)) } catch {} }

export default function App(){
  const [category, setCategory] = useState(null);
  const [mode, setMode] = useState('quiz');
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [high, setHigh] = useState(loadHighScore());
  const [feedback, setFeedback] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_MS);
  const timerRef = useRef(null);

  const data = useMemo(() => {
    if (!category) return [];
    if (category === 'mixed') return buildMixed(BANK, 12);
    return BANK[category] || [];
  }, [category]);

  const q = data[step];
  const testResults = useMemo(() => runSelfTests(BANK), []);
  useEffect(() => { if (testResults.length===0) console.info('Dataset OK'); else console.error(testResults)}, [testResults]);

  useEffect(() => {
    clearInterval(timerRef.current);
    setTimeLeft(QUESTION_TIME_MS);
    setLocked(false);
    if (!q || mode!=='quiz' || showSummary) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - TICK_MS);
        if (next === 0) {
          clearInterval(timerRef.current);
          setFeedback('⏰ הזמן נגמר');
          setTimeout(() => {
            setFeedback('');
            if (step + 1 < data.length) setStep(i=>i+1); else setShowSummary(true);
          }, 700);
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timerRef.current);
  }, [step, category, mode, showSummary]);

  useEffect(() => { if (score > high) { setHigh(score); saveHighScore(score); }}, [score]);

  function resetRun(){ setStep(0); setScore(0); setCorrectCount(0); setFeedback(''); setTimeLeft(QUESTION_TIME_MS); setLocked(false); setShowSummary(false); }
  function bonusForSpeed(ms){ const ratio = Math.max(0, Math.min(1, ms/QUESTION_TIME_MS)); return Math.ceil(ratio * 5); }
  function handlePick(opt){
    if (!q || mode!=='quiz' || locked) return;
    clearInterval(timerRef.current);
    if (opt === q.answer){
      const bonus = bonusForSpeed(timeLeft);
      const add = 10 + bonus;
      setScore(s=>s+add);
      setCorrectCount(c=>c+1);
      setFeedback(`✅ נכון! +${add} נק׳ (בונוס מהירות ${bonus})`);
      setLocked(true);
      setTimeout(() => { setFeedback(''); if (step+1 < data.length) setStep(i=>i+1); else setShowSummary(true); }, 700);
    } else {
      setFeedback('❌ נסה שוב');
    }
  }
  function nextStudy(){ if (step+1 < data.length) setStep(i=>i+1); else setShowSummary(true); }
  function exitToSummary(){ clearInterval(timerRef.current); setShowSummary(true); }

  function Timer(){
    if (mode!=='quiz' || showSummary) return null;
    const pct = Math.round((timeLeft/QUESTION_TIME_MS)*100);
    return (<div><div className="sm">⏳ זמן: {(timeLeft/1000).toFixed(1)}s</div><div className="timerWrap"><div className="timerBar" style={{width: pct+'%'}}/></div></div>);
  }

  function Prompt(){
    if (!q) return null;
    if (q.type==='AR_HE'){
      return (<div className="center" style={{marginBottom:12}}><div style={{fontSize:36, marginBottom:6}}>{q.arabic}</div><div className="sm" style={{fontSize:18, marginBottom:10}}>{q.translit}</div><button className="btn" style={{background:'#e0f2fe', borderRadius:12, padding:'6px 10px'}} onClick={()=>speak(q.arabic,'ar-SA')}>🔊 נגן</button></div>);
    }
    return (<div className="center" style={{marginBottom:12}}><div style={{fontSize:18, marginBottom:4}}>בחר/י את התשובה הנכונה לערך:</div><div style={{fontSize:28, fontWeight:700, marginBottom:4}}>{q.hebrew}</div><div className="sm">(האופציות מציגות ערבית + תעתיק)</div></div>);
  }

  function Options(){
    if (!q || mode!=='quiz') return null;
    return (<div className="options">{q.options.map(opt => (<div className="optionRow" key={opt}><button className="option" onClick={()=>handlePick(opt)} disabled={locked}>{opt}</button>{q.type==='HE_AR' && (<button className="speaker" title="נגן הקראה" onClick={()=>{ const [ar] = opt.split(' — '); speak(ar,'ar-SA'); }}>🔊</button>)}</div>))}</div>);
  }

  function StudyCard(){
    if (!q || mode!=='study') return null;
    if (q.type==='AR_HE'){
      return (<div className="cardWhite"><div style={{fontSize:36, marginBottom:6}}>{q.arabic}</div><div className="sm" style={{fontSize:18, marginBottom:10}}>{q.translit}</div><div style={{fontSize:18}}>המשמעות בעברית: <b>{q.hebrew}</b></div><button className="btn" style={{marginTop:10, background:'#e0f2fe'}} onClick={()=>speak(q.arabic,'ar-SA')}>🔊 נגן</button></div>);
    }
    return (<div className="cardWhite"><div className="sm">עברית:</div><div style={{fontSize:28, fontWeight:700, marginBottom:8}}>{q.hebrew}</div><div style={{fontSize:18}}>בערבית: <b>{q.arabic}</b></div><div style={{fontSize:18}}>תעתיק: <b>{q.translit}</b></div><button className="btn" style={{marginTop:10, background:'#e0f2fe'}} onClick={()=>speak(q.arabic,'ar-SA')}>🔊 נגן</button></div>);
  }

  if (category && showSummary){
    const total = data.length;
    const answered = Math.min(step, total);
    return (<div className="app"><div className="card center"><h2 className="title2">סיכום תרגול</h2><p>ענית על <b>{answered}</b> שאלות מתוך <b>{total}</b>.</p><p>תשובות נכונות: <b>{correctCount}</b>.</p><p style={{fontSize:18, marginTop:8}}>סה״כ ניקוד: <b>{score}</b> · 🏁 שיא: <b>{high}</b></p><div className="row"><button className="btn secondary" onClick={()=>{ resetRun(); setCategory(null); }}>לתפריט הראשי</button><button className="btn primary" onClick={()=>resetRun()}>שחק שוב 🔁</button></div></div></div>);
  }

  if (!category){
    return (<div className="app"><div className="card"><h1 className="h1">🎮 שיח ערבי – המשחק שלי</h1><p className="p">בחר/י קטגוריה ומצב משחק: תרגול (Quiz) עם ניקוד, או מצב לימוד (Study) עם הקראה ותשובה.</p><p className="p"><span className="badge">🏁 שיא אישי: <b>{high}</b> נק׳</span></p><div className="row"><button className={`btn ${mode==='quiz'?'primary':'secondary'}`} onClick={()=>setMode('quiz')}>🎯 מצב תרגול</button><button className={`btn ${mode==='study'?'primary':'secondary'}`} onClick={()=>setMode('study')}>📚 מצב לימוד</button></div><div className="grid">{Object.entries(CATEGORY_META).map(([key, meta]) => (<button key={key} className="tile" onClick={()=>{ setCategory(key); resetRun(); }}>{meta.title}</button>))}</div></div></div>);
  }

  const title = CATEGORY_META[category]?.title || 'תרגול';
  const dataArr = data;
  const stepNum = step;
  const finished = stepNum >= dataArr.length;

  return (
    <div className="app">
      <div className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <button className="btn secondary" onClick={()=>setCategory(null)}>⬅️ תפריט</button>
          <div className="title2">{title} — {mode==='quiz'?'🎯 תרגול':'📚 לימוד'}</div>
          <div className="badge">🏅 ניקוד: <b>{score}</b></div>
        </div>

        {!finished ? (
          <div className="cardWhite">
            <div className="row" style={{justifyContent:'space-between', marginBottom:8}}>
              <div className="sm">פריט {stepNum+1} מתוך {dataArr.length}</div>
              <button className="btn" style={{background:'#fee2e2'}} onClick={()=>{clearInterval(timerRef.current); setShowSummary(true);}}>🚪 יציאה</button>
            </div>
            <Timer />
            <Prompt />
            {mode==='quiz' ? (<><Options /><div className="feedback sm">{feedback}</div></>) : (<><StudyCard /><div className="row" style={{justifyContent:'center'}}><button className="btn primary" onClick={()=>{ if (stepNum+1 < dataArr.length) setStep(i=>i+1); else setShowSummary(true); }}>הלאה ▶️</button><button className="btn secondary" onClick={()=>{clearInterval(timerRef.current); setShowSummary(true);}}>סיים</button></div></>)}
          </div>
        ) : (
          <div className="center"><p style={{fontSize:24}}>🎉 כל הכבוד!</p><p>ענית על <b>{dataArr.length}</b> שאלות.</p><p>הניקוד שלך: <b>{score}</b> · 🏁 שיא אישי: <b>{high}</b></p><div className="row"><button className="btn primary" onClick={()=>{ setStep(0); setScore(0); setCorrectCount(0); setFeedback(''); setShowSummary(false); }}>שחק שוב 🔁</button><button className="btn secondary" onClick={()=>setCategory(null)}>לתפריט</button></div></div>
        )}

        <div className="footer">טיפ: אם ההקראה לא עובדת, ודאו שפתחתם את האתר ב־HTTPS ובדפדפן כרום/Edge.</div>
      </div>
    </div>
  );
}
