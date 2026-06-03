/* ============================================================
   PKV Forms — Core Engine
   State management, navigation, branching, validation,
   webhook submission, progress, animations, screens.
   ============================================================ */
const { useState, useCallback, useMemo, useEffect, useRef } = React;

/* ---- Helpers ---------------------------------------------- */
const QUESTION_TYPES = [
  'short-text','long-text','email','phone','number','date','website','address',
  'choice','multi-choice','yes-no','dropdown','picture-choice',
  'nps','opinion-scale','rating','ranking','matrix',
  'file-upload','legal','checkbox','contact-info','multi-question','signature'
];
const isQuestion = (s) => s && QUESTION_TYPES.includes(s.type);
const AUTO_ADVANCE_TYPES = ['yes-no', 'choice', 'nps', 'opinion-scale', 'rating'];

function getUTMParams() {
  const p = new URLSearchParams(window.location.search);
  const utms = {};
  for (const k of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','gclid','fbclid']) {
    if (p.get(k)) utms[k] = p.get(k);
  }
  return utms;
}

/* ---- Numbering -------------------------------------------- */
function computeNumbering(slides) {
  let mainNum = 0;
  let inGroup = false;
  let subNum = 0;
  return slides.map((slide) => {
    if (['welcome','end','redirect','partial-submit'].includes(slide.type)) return null;
    if (slide.type === 'group-intro') {
      mainNum++; inGroup = true; subNum = 0;
      return { main: mainNum, type: 'group' };
    }
    if (slide.type === 'statement') return null;
    if (inGroup && slide.grouped !== false) {
      subNum++;
      return { main: mainNum, sub: String.fromCharCode(96 + subNum), type: 'sub' };
    }
    inGroup = false; mainNum++;
    return { main: mainNum, type: 'standalone' };
  });
}

/* ---- Validation ------------------------------------------- */
function validateAnswer(slide, value) {
  if (!isQuestion(slide)) return { valid: true };

  // Multi-question: validate each sub-question
  if (slide.type === 'multi-question' || slide.type === 'contact-info') {
    const fields = slide.fields || slide.questions || [];
    for (const f of fields) {
      if (f.required && (!value || !value[f.id] || String(value[f.id]).trim() === '')) {
        return { valid: false, error: f.errorMessage || `Pole "${f.label || f.id}" je povinné.` };
      }
      if (f.type === 'email' && value && value[f.id]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value[f.id]))
          return { valid: false, error: 'Zadejte platný e-mail.' };
      }
      if (f.pattern && value && value[f.id]) {
        if (!new RegExp(f.pattern).test(value[f.id]))
          return { valid: false, error: f.errorMessage || 'Neplatný formát.' };
      }
    }
    return { valid: true };
  }

  // Matrix: check all rows answered
  if (slide.type === 'matrix') {
    if (slide.required && slide.rows) {
      const unanswered = slide.rows.some((_, i) => !value || value[i] == null);
      if (unanswered) return { valid: false, error: 'Vyplňte prosím všechny řádky.' };
    }
    return { valid: true };
  }

  const v = Array.isArray(value) ? value : (value != null ? String(value) : '');
  const isEmpty = Array.isArray(v) ? v.length === 0 : v.trim() === '';

  if (slide.required && isEmpty) {
    return { valid: false, error: slide.errorMessage || 'Toto pole je povinné.' };
  }
  if (isEmpty) return { valid: true };

  if (slide.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { valid: false, error: 'Zadejte platný e-mail.' };
  }
  if (slide.type === 'phone' && v.replace(/[\s\-\+\(\)]/g,'').length < 6) {
    return { valid: false, error: 'Zadejte platné telefonní číslo.' };
  }
  if (slide.pattern && !new RegExp(slide.pattern).test(v)) {
    return { valid: false, error: slide.errorMessage || 'Neplatný formát.' };
  }
  if (slide.minLength && v.length < slide.minLength) {
    return { valid: false, error: `Minimální délka: ${slide.minLength} znaků.` };
  }
  if (slide.maxLength && v.length > slide.maxLength) {
    return { valid: false, error: `Maximální délka: ${slide.maxLength} znaků.` };
  }
  if (slide.type === 'number') {
    const n = parseFloat(v);
    if (isNaN(n)) return { valid: false, error: 'Zadejte číslo.' };
    if (slide.min != null && n < slide.min) return { valid: false, error: `Minimum: ${slide.min}` };
    if (slide.max != null && n > slide.max) return { valid: false, error: `Maximum: ${slide.max}` };
  }
  return { valid: true };
}

/* ---- Branching logic engine ------------------------------- */
function evalCondition(cond, answers) {
  const val = answers[cond.question];
  if (cond.equals != null) return val === cond.equals || String(val) === String(cond.equals);
  if (cond.notEquals != null) return val !== cond.notEquals && String(val) !== String(cond.notEquals);
  if (cond.greaterThan != null) return parseFloat(val) > cond.greaterThan;
  if (cond.lessThan != null) return parseFloat(val) < cond.lessThan;
  if (cond.contains != null) return Array.isArray(val) ? val.includes(cond.contains) : String(val || '').includes(cond.contains);
  if (cond.isEmpty) return val == null || String(val).trim() === '';
  if (cond.isNotEmpty) return val != null && String(val).trim() !== '';
  return false;
}

function evaluateLogic(logic, answers, currentSlideId, slides) {
  if (!logic || !logic.length) return null;
  for (const rule of logic) {
    let match = false;
    if (rule.if.and) {
      match = rule.if.and.every(c => evalCondition(c, answers));
    } else if (rule.if.or) {
      match = rule.if.or.some(c => evalCondition(c, answers));
    } else {
      match = evalCondition(rule.if, answers);
    }
    if (!match) continue;
    // Only apply rule if current slide matches the question in the condition
    const ruleQ = rule.if.question || (rule.if.and || rule.if.or || [])[0]?.question;
    if (ruleQ && currentSlideId !== ruleQ) {
      const currentSlide = slides.find((s, i) => s.id === currentSlideId);
      if (currentSlide) continue;
    }
    if (rule.then.jump === 'end') {
      const endIdx = slides.findIndex(s => s.type === 'end');
      return endIdx >= 0 ? endIdx : null;
    }
    if (rule.then.jump) {
      const targetIdx = slides.findIndex(s => s.id === rule.then.jump);
      return targetIdx >= 0 ? targetIdx : null;
    }
    if (rule.then.skip) return null; // handled by caller
  }
  return null;
}

/* ---- Webhook submission ----------------------------------- */
async function submitToWebhook(config, answers, metadata) {
  if (!config.webhook) { console.warn('PKV Forms: No webhook URL configured.'); return; }
  const payload = {
    form_id: config.id || 'unknown',
    submitted_at: new Date().toISOString(),
    utm: getUTMParams(),
    metadata: {
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      ...metadata,
    },
    answers: answers,
  };
  try {
    await fetch(config.webhook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) { console.error('PKV Forms: Webhook submission failed:', err); }
}

/* ---- Icons (inline SVGs) ---------------------------------- */
const IconArrow = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 8h10M9 4l4 4-4 4"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8.5l3.5 3.5 6.5-7"/>
  </svg>
);
const IconBack = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10 3L5 8l5 5"/>
  </svg>
);
const IconAlert = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a.85.85 0 110-1.7.85.85 0 010 1.7z"/>
  </svg>
);
const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:36,height:36}}>
    <path d="M12 16V4m0 0L8 8m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
  </svg>
);

/* ---- Progress bar ----------------------------------------- */
function FormProgress({ current, total, percent, show }) {
  if (!show) return null;
  return (
    <React.Fragment>
      <div className="pkv-f-progress">
        <div className="pkv-f-progress-fill" style={{ width: `${percent}%` }}></div>
      </div>
    </React.Fragment>
  );
}

/* ---- Navigation ------------------------------------------- */
function FormNav({ onOk, onBack, canGoBack, isSubmit, show, okLabel }) {
  if (!show) return null;
  return (
    <div className="pkv-f-nav">
      <div>
        {canGoBack && (
          <button className="pkv-f-back-btn" onClick={onBack} type="button">
            <IconBack /> Zpět
          </button>
        )}
      </div>
      <div className="pkv-f-nav-right">
        <button className="pkv-f-ok-btn" onClick={onOk} type="button">
          {isSubmit ? (okLabel || 'Odeslat') : 'OK'} <IconCheck />
        </button>
        <span className="pkv-f-hint">
          stiskněte <kbd>Enter ↵</kbd>
        </span>
      </div>
    </div>
  );
}

/* ---- Welcome screen --------------------------------------- */
function WelcomeScreen({ config, onStart }) {
  return (
    <div className="pkv-f-welcome">
      <h1 className="pkv-f-welcome-title">{config.title}</h1>
      {config.subtitle && <p className="pkv-f-welcome-sub">{config.subtitle}</p>}
      <button className="pkv-f-welcome-btn" onClick={onStart} type="button">
        {config.button || 'Pokračovat'} <IconArrow />
      </button>
    </div>
  );
}

/* ---- End screen ------------------------------------------- */
function EndScreen({ config }) {
  useEffect(() => {
    if (config.redirect) {
      const timer = setTimeout(() => {
        window.location.href = config.redirect.url;
      }, (config.redirect.delay || 5) * 1000);
      return () => clearTimeout(timer);
    }
  }, [config.redirect]);

  return (
    <div className="pkv-f-end">
      <div className="pkv-f-end-icon"><IconCheck /></div>
      <h2 className="pkv-f-end-title">{config.title || 'Děkujeme!'}</h2>
      {config.subtitle && <p className="pkv-f-end-sub">{config.subtitle}</p>}
      {config.redirect && (
        <p className="pkv-f-end-sub" style={{ marginTop: 20, fontSize: 14 }}>
          Budete přesměrováni za {config.redirect.delay || 5}s...
        </p>
      )}
    </div>
  );
}

/* ---- Group intro ------------------------------------------ */
function GroupIntroScreen({ config, number, onContinue }) {
  return (
    <div className="pkv-f-group-intro">
      {number != null && <div className="pkv-f-group-num">{number}</div>}
      <h2 className="pkv-f-group-title">{config.title}</h2>
      <button className="pkv-f-welcome-btn" onClick={onContinue} type="button" style={{ marginTop: 32 }}>
        {config.button || 'Pokračovat'} <IconArrow />
      </button>
    </div>
  );
}

/* ---- Statement -------------------------------------------- */
function StatementScreen({ config, onContinue }) {
  return (
    <div className="pkv-f-statement">
      <h2 className="pkv-f-statement-title">{config.title}</h2>
      {config.subtitle && <p className="pkv-f-q-subtitle" style={{ textAlign: 'center' }}>{config.subtitle}</p>}
      <button className="pkv-f-welcome-btn" onClick={onContinue} type="button" style={{ marginTop: 24 }}>
        {config.button || 'Pokračovat'} <IconArrow />
      </button>
    </div>
  );
}

/* ---- Question wrapper ------------------------------------- */
function QuestionHeader({ numbering, title, subtitle, required }) {
  return (
    <div>
      {numbering && (
        <div className="pkv-f-q-number">
          {numbering.type === 'sub' && <span>{numbering.sub}.</span>}
          {numbering.type === 'standalone' && (
            <React.Fragment><span>{numbering.main}</span><IconArrow /></React.Fragment>
          )}
        </div>
      )}
      <h2 className="pkv-f-q-title">
        {title}
        {required && <span className="pkv-f-required">*</span>}
      </h2>
      {subtitle && <p className="pkv-f-q-subtitle">{subtitle}</p>}
    </div>
  );
}

/* ---- Error display ---------------------------------------- */
function FormError({ error }) {
  if (!error) return null;
  return <div className="pkv-f-error"><IconAlert /> {error}</div>;
}

/* ============================================================
   MAIN PKVForm COMPONENT
   ============================================================ */
function PKVForm({ config }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [direction, setDirection] = useState('forward');
  const [submitted, setSubmitted] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const advancingRef = useRef(false);

  const slides = config.slides;
  const currentSlide = slides[currentIndex];
  const numbering = useMemo(() => computeNumbering(slides), [slides]);

  // Find last question before end
  const lastQuestionIdx = useMemo(() => {
    for (let i = slides.length - 1; i >= 0; i--) {
      if (isQuestion(slides[i])) return i;
    }
    return -1;
  }, [slides]);

  // Compute progress
  const progress = useMemo(() => {
    const qSlides = slides.filter(s => isQuestion(s));
    const answered = qSlides.filter(s => {
      const v = answers[s.id];
      if (v == null) return false;
      if (typeof v === 'string' && v.trim() === '') return false;
      if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return false;
      return true;
    }).length;
    return { current: answered, total: qSlides.length, percent: qSlides.length ? (answered / qSlides.length) * 100 : 0 };
  }, [slides, answers]);

  const navigate = useCallback((targetIndex, dir) => {
    if (advancingRef.current) return;
    setDirection(dir);
    setSlideKey(k => k + 1);
    setCurrentIndex(targetIndex);
    setError(null);
  }, []);

  const goNext = useCallback(() => {
    if (advancingRef.current) return;
    // Validate current slide
    if (isQuestion(currentSlide)) {
      const validation = validateAnswer(currentSlide, answers[currentSlide.id]);
      if (!validation.valid) { setError(validation.error); return; }
    }
    setError(null);

    // Submit on last question
    if (currentIndex === lastQuestionIdx && !submitted) {
      setSubmitted(true);
      submitToWebhook(config, answers);
    }

    // Partial submit
    if (currentSlide.type === 'partial-submit') {
      submitToWebhook({ ...config, id: config.id + '_partial' }, answers);
    }

    // Evaluate branching logic
    let nextIndex = currentIndex + 1;
    if (config.logic && currentSlide.id) {
      const jumpIdx = evaluateLogic(config.logic, answers, currentSlide.id, slides);
      if (jumpIdx != null) nextIndex = jumpIdx;
    }
    if (nextIndex >= slides.length) nextIndex = slides.length - 1;

    setHistory(prev => [...prev, currentIndex]);
    navigate(nextIndex, 'forward');
  }, [currentIndex, currentSlide, answers, config, slides, lastQuestionIdx, submitted, navigate]);

  const goPrev = useCallback(() => {
    if (history.length === 0) return;
    const prevIndex = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    navigate(prevIndex, 'backward');
  }, [history, navigate]);

  const setAnswer = useCallback((id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setError(null);
  }, []);

  // Auto-advance for choice / yes-no — use a ref+effect to avoid stale closure
  const pendingAdvanceRef = useRef(false);
  const handleAutoAdvance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    pendingAdvanceRef.current = true;
  }, []);

  // Effect: when answers change and auto-advance is pending, trigger goNext
  useEffect(() => {
    if (!pendingAdvanceRef.current) return;
    if (!currentSlide || answers[currentSlide.id] == null) return;
    const timer = setTimeout(() => {
      pendingAdvanceRef.current = false;
      advancingRef.current = false;
      goNext();
    }, 350);
    return () => clearTimeout(timer);
  }, [answers, currentSlide, goNext]);

  // Keyboard handling
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA') { if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) return; }
      if (e.key === 'Enter' && (e.target.tagName !== 'TEXTAREA' || e.metaKey || e.ctrlKey)) {
        e.preventDefault(); goNext();
      }
      if (e.key === 'ArrowUp' && e.target === document.body) { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  // Letter key shortcuts for choice questions
  useEffect(() => {
    if (!currentSlide || (currentSlide.type !== 'choice' && currentSlide.type !== 'yes-no')) return;
    const opts = currentSlide.type === 'yes-no'
      ? (currentSlide.options || [{ label: 'Ano', value: 'Ano' }, { label: 'Ne', value: 'Ne' }])
      : (currentSlide.options || []);

    const handler = (e) => {
      if (e.target !== document.body) return;
      const idx = e.key.toUpperCase().charCodeAt(0) - 65;
      const normalizedOpts = opts.map(o => typeof o === 'string' ? o : o.label || o.value || o);
      if (idx >= 0 && idx < normalizedOpts.length) {
        const val = typeof opts[idx] === 'string' ? opts[idx] : (opts[idx].value || opts[idx].label);
        setAnswer(currentSlide.id, val);
        handleAutoAdvance();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentSlide, setAnswer, handleAutoAdvance]);

  // Determine what to show
  const showProgress = currentSlide.type !== 'welcome' && currentSlide.type !== 'end';
  const showNav = isQuestion(currentSlide);
  const isSubmitSlide = currentIndex === lastQuestionIdx;

  // Render the current slide content
  const renderSlide = () => {
    const s = currentSlide;
    const num = numbering[currentIndex];

    switch (s.type) {
      case 'welcome': return <WelcomeScreen config={s} onStart={goNext} />;
      case 'end': return <EndScreen config={s} />;
      case 'group-intro': return <GroupIntroScreen config={s} number={num?.main} onContinue={goNext} />;
      case 'statement': return <StatementScreen config={s} onContinue={goNext} />;
      default:
        if (isQuestion(s) && window.PKV_FIELD_REGISTRY && window.PKV_FIELD_REGISTRY[s.type]) {
          const FieldComponent = window.PKV_FIELD_REGISTRY[s.type];
          return (
            <div>
              <QuestionHeader numbering={num} title={s.title} subtitle={s.subtitle} required={s.required} />
              <FieldComponent
                config={s}
                value={answers[s.id]}
                onChange={(val) => setAnswer(s.id, val)}
                onSubmit={goNext}
                onAutoAdvance={AUTO_ADVANCE_TYPES.includes(s.type) ? handleAutoAdvance : null}
              />
              <FormError error={error} />
            </div>
          );
        }
        return <div style={{ color: '#989898' }}>Neznámý typ otázky: {s.type}</div>;
    }
  };

  return (
    <div className="pkv-f-root">
      {/* Decorative blob */}
      <div className="pkv-f-blob" style={{ width: 600, height: 600, right: -200, bottom: -200 }}></div>
      <div className="pkv-f-blob" style={{ width: 400, height: 400, left: -150, top: -100 }}></div>

      <div className="pkv-f-header">
        {config.logo !== false && (
          <img className="pkv-f-logo" src={config.logoSrc || 'assets/logo-pkv-mark.svg'} alt="PKV" />
        )}
        {showProgress && (
          <span className="pkv-f-step-count">{progress.current} z {progress.total}</span>
        )}
      </div>

      <FormProgress current={progress.current} total={progress.total} percent={progress.percent} show={showProgress} />

      <div className="pkv-f-stage">
        <div key={slideKey} className={`pkv-f-slide ${slideKey === 0 ? '' : 'pkv-f-slide-' + direction}`}>
          <div className="pkv-f-slide-inner">
            {renderSlide()}
          </div>
        </div>
      </div>

      <FormNav
        onOk={goNext}
        onBack={goPrev}
        canGoBack={history.length > 0}
        isSubmit={isSubmitSlide}
        show={showNav}
        okLabel={config.submitLabel}
      />
    </div>
  );
}

Object.assign(window, {
  PKVForm, WelcomeScreen, EndScreen, GroupIntroScreen, StatementScreen,
  QuestionHeader, FormProgress, FormNav, FormError,
  validateAnswer, evaluateLogic, submitToWebhook, computeNumbering, getUTMParams,
  IconArrow, IconCheck, IconBack, IconAlert, IconUpload,
  AUTO_ADVANCE_TYPES, QUESTION_TYPES, isQuestion
});
