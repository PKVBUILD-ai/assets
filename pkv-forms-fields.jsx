/* ============================================================
   PKV Forms — Field Components
   All question type renderers.
   Each receives: { config, value, onChange, onSubmit, onAutoAdvance }
   ============================================================ */

/* ---- Short Text ------------------------------------------- */
function ShortTextField({ config, value, onChange }) {
  return (
    <input
      className="pkv-f-input"
      type={config.inputType || 'text'}
      placeholder={config.placeholder || 'Napište svou odpověď...'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      maxLength={config.maxLength}
    />
  );
}

/* ---- Long Text -------------------------------------------- */
function LongTextField({ config, value, onChange }) {
  return (
    <textarea
      className="pkv-f-input pkv-f-textarea"
      placeholder={config.placeholder || 'Napište svou odpověď...'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      maxLength={config.maxLength}
      rows={config.rows || 4}
    ></textarea>
  );
}

/* ---- Email ------------------------------------------------ */
function EmailField({ config, value, onChange }) {
  return (
    <input
      className="pkv-f-input"
      type="email"
      placeholder={config.placeholder || 'jmeno@example.cz'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  );
}

/* ---- Phone ------------------------------------------------ */
function PhoneField({ config, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22, color: 'var(--fg-muted)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
        {config.prefix || '🇨🇿 +420'}
      </span>
      <input
        className="pkv-f-input"
        type="tel"
        placeholder={config.placeholder || '601 123 456'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
    </div>
  );
}

/* ---- Number ----------------------------------------------- */
function NumberField({ config, value, onChange }) {
  return (
    <input
      className="pkv-f-input"
      type="number"
      placeholder={config.placeholder || 'Zadejte číslo'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      min={config.min} max={config.max} step={config.step || 1}
      autoFocus
    />
  );
}

/* ---- Date ------------------------------------------------- */
function DateField({ config, value, onChange }) {
  return (
    <input
      className="pkv-f-input"
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      min={config.min} max={config.max}
      autoFocus
      style={{ colorScheme: 'dark' }}
    />
  );
}

/* ---- Website ---------------------------------------------- */
function WebsiteField({ config, value, onChange }) {
  return (
    <input
      className="pkv-f-input"
      type="url"
      placeholder={config.placeholder || 'https://'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  );
}

/* ---- Address ---------------------------------------------- */
function AddressField({ config, value, onChange }) {
  const v = value || {};
  const set = (key, val) => onChange({ ...v, [key]: val });
  const fields = config.addressFields || ['street', 'city', 'zip', 'country'];
  const labels = { street: 'Ulice a č.p.', city: 'Město', zip: 'PSČ', country: 'Země' };
  return (
    <div className="pkv-f-field-grid">
      {fields.includes('street') && (
        <div><label className="pkv-f-field-label">{labels.street}</label>
          <input className="pkv-f-input" value={v.street || ''} onChange={(e) => set('street', e.target.value)} autoFocus /></div>
      )}
      <div className="pkv-f-field-grid pkv-f-field-grid-2">
        {fields.includes('city') && (
          <div><label className="pkv-f-field-label">{labels.city}</label>
            <input className="pkv-f-input" value={v.city || ''} onChange={(e) => set('city', e.target.value)} /></div>
        )}
        {fields.includes('zip') && (
          <div><label className="pkv-f-field-label">{labels.zip}</label>
            <input className="pkv-f-input" value={v.zip || ''} onChange={(e) => set('zip', e.target.value)} /></div>
        )}
      </div>
      {fields.includes('country') && (
        <div><label className="pkv-f-field-label">{labels.country}</label>
          <input className="pkv-f-input" value={v.country || ''} onChange={(e) => set('country', e.target.value)} placeholder="Česká republika" /></div>
      )}
    </div>
  );
}

/* ---- Single Choice ---------------------------------------- */
function SingleChoiceField({ config, value, onChange, onAutoAdvance }) {
  const options = (config.options || []).map(o => typeof o === 'string' ? { label: o, value: o } : o);
  const handleClick = (opt) => {
    onChange(opt.value);
    if (onAutoAdvance) onAutoAdvance();
  };
  return (
    <div className="pkv-f-choices">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = value === opt.value;
        return (
          <div key={i} className={`pkv-f-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleClick(opt)}>
            <span className="pkv-f-choice-key">{letter}</span>
            <span className="pkv-f-choice-text">{opt.label}</span>
            <span className="pkv-f-choice-check"><IconCheck /></span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Multiple Choice -------------------------------------- */
function MultiChoiceField({ config, value, onChange }) {
  const options = (config.options || []).map(o => typeof o === 'string' ? { label: o, value: o } : o);
  const selected = value || [];
  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
    onChange(next);
  };
  return (
    <div className="pkv-f-choices">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = selected.includes(opt.value);
        return (
          <div key={i} className={`pkv-f-choice ${isSelected ? 'selected' : ''}`} onClick={() => toggle(opt.value)}>
            <span className="pkv-f-choice-key">{letter}</span>
            <span className="pkv-f-choice-text">{opt.label}</span>
            <span className="pkv-f-choice-check"><IconCheck /></span>
          </div>
        );
      })}
      <p style={{ fontSize: 13, color: 'var(--fg-subtle)', marginTop: 4 }}>Vyberte jednu nebo více možností</p>
    </div>
  );
}

/* ---- Yes / No --------------------------------------------- */
function YesNoField({ config, value, onChange, onAutoAdvance }) {
  const opts = config.options || [
    { label: 'Ano', value: 'Ano' },
    { label: 'Ne', value: 'Ne' },
  ];
  const options = opts.map(o => typeof o === 'string' ? { label: o, value: o } : o);
  const handleClick = (opt) => {
    onChange(opt.value);
    if (onAutoAdvance) onAutoAdvance();
  };
  return (
    <div className="pkv-f-yesno">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = value === opt.value;
        return (
          <div key={i} className={`pkv-f-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleClick(opt)}>
            <span className="pkv-f-choice-key">{letter}</span>
            <span className="pkv-f-choice-text">{opt.label}</span>
            <span className="pkv-f-choice-check"><IconCheck /></span>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Dropdown --------------------------------------------- */
function DropdownField({ config, value, onChange }) {
  const options = (config.options || []).map(o => typeof o === 'string' ? { label: o, value: o } : o);
  return (
    <select className="pkv-f-select" value={value || ''} onChange={(e) => onChange(e.target.value)} autoFocus>
      <option value="" disabled>{config.placeholder || 'Vyberte...'}</option>
      {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

/* ---- Picture Choice --------------------------------------- */
function PictureChoiceField({ config, value, onChange, onAutoAdvance }) {
  const options = config.options || [];
  const multi = config.multiple;
  const selected = multi ? (value || []) : value;

  const handleClick = (val) => {
    if (multi) {
      const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
      onChange(next);
    } else {
      onChange(val);
      if (onAutoAdvance) onAutoAdvance();
    }
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)`, gap: 14 }}>
      {options.map((opt, i) => {
        const o = typeof opt === 'string' ? { label: opt, image: '' } : opt;
        const isSel = multi ? selected.includes(o.value || o.label) : selected === (o.value || o.label);
        return (
          <div key={i} onClick={() => handleClick(o.value || o.label)}
            style={{
              background: 'var(--pkv-surface-2)', border: `2px solid ${isSel ? '#00CA85' : '#777778'}`,
              borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}>
            {o.image && <img src={o.image} alt={o.label} style={{ width: '100%', borderRadius: 10, marginBottom: 10 }} />}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{o.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- NPS (0-10) ------------------------------------------- */
function NPSField({ config, value, onChange, onAutoAdvance }) {
  const min = config.min ?? 0;
  const max = config.max ?? 10;
  const nums = [];
  for (let i = min; i <= max; i++) nums.push(i);
  return (
    <div>
      <div className="pkv-f-nps">
        {nums.map(n => (
          <button key={n} type="button" className={`pkv-f-nps-btn ${value === n ? 'selected' : ''}`}
            onClick={() => { onChange(n); if (onAutoAdvance) onAutoAdvance(); }}>
            {n}
          </button>
        ))}
      </div>
      {(config.leftLabel || config.rightLabel) && (
        <div className="pkv-f-scale-labels">
          <span>{config.leftLabel || ''}</span>
          <span>{config.rightLabel || ''}</span>
        </div>
      )}
    </div>
  );
}

/* ---- Opinion Scale ---------------------------------------- */
function OpinionScaleField({ config, value, onChange, onAutoAdvance }) {
  const min = config.min ?? 1;
  const max = config.max ?? 5;
  const nums = [];
  for (let i = min; i <= max; i++) nums.push(i);
  return (
    <div>
      <div className="pkv-f-nps">
        {nums.map(n => (
          <button key={n} type="button" className={`pkv-f-nps-btn ${value === n ? 'selected' : ''}`}
            style={{ width: 64, height: 56, fontSize: 20 }}
            onClick={() => { onChange(n); if (onAutoAdvance) onAutoAdvance(); }}>
            {n}
          </button>
        ))}
      </div>
      {(config.leftLabel || config.rightLabel) && (
        <div className="pkv-f-scale-labels">
          <span>{config.leftLabel || ''}</span>
          <span>{config.rightLabel || ''}</span>
        </div>
      )}
    </div>
  );
}

/* ---- Rating (stars) --------------------------------------- */
function RatingField({ config, value, onChange, onAutoAdvance }) {
  const max = config.max || 5;
  const [hover, setHover] = React.useState(0);
  const stars = [];
  for (let i = 1; i <= max; i++) stars.push(i);
  return (
    <div className="pkv-f-stars">
      {stars.map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`pkv-f-star ${i <= (hover || value || 0) ? 'active' : ''}`}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => { onChange(i); if (onAutoAdvance) onAutoAdvance(); }}>
          <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/>
        </svg>
      ))}
    </div>
  );
}

/* ---- Ranking (drag to reorder) ---------------------------- */
function RankingField({ config, value, onChange }) {
  const items = value || config.options || [];
  const moveUp = (idx) => {
    if (idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };
  const moveDown = (idx) => {
    if (idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };
  // Initialize if not set
  React.useEffect(() => {
    if (!value && config.options) onChange([...config.options]);
  }, []);
  return (
    <div className="pkv-f-choices">
      {items.map((item, i) => (
        <div key={item} className="pkv-f-choice" style={{ cursor: 'default' }}>
          <span className="pkv-f-choice-key" style={{ background: 'var(--pkv-green)', color: '#1E1E1E', borderColor: 'var(--pkv-green)' }}>{i + 1}</span>
          <span className="pkv-f-choice-text">{typeof item === 'string' ? item : item.label}</span>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            <button type="button" onClick={() => moveUp(i)} style={{ background: 'none', border: '1px solid #4C4C4C', borderRadius: 4, color: '#A0A0A0', cursor: 'pointer', padding: '2px 6px', fontSize: 14 }} disabled={i === 0}>↑</button>
            <button type="button" onClick={() => moveDown(i)} style={{ background: 'none', border: '1px solid #4C4C4C', borderRadius: 4, color: '#A0A0A0', cursor: 'pointer', padding: '2px 6px', fontSize: 14 }} disabled={i === items.length - 1}>↓</button>
          </div>
        </div>
      ))}
      <p style={{ fontSize: 13, color: 'var(--fg-subtle)', marginTop: 4 }}>Seřaďte položky pomocí šipek</p>
    </div>
  );
}

/* ---- Matrix ----------------------------------------------- */
function MatrixField({ config, value, onChange }) {
  const rows = config.rows || [];
  const columns = config.columns || ['ANO', 'NE'];
  const v = value || {};
  const setCell = (rowIdx, col) => onChange({ ...v, [rowIdx]: col });
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="pkv-f-matrix">
        <thead>
          <tr>
            <th></th>
            {columns.map((c, i) => <th key={i}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{typeof row === 'string' ? row : row.label}</td>
              {columns.map((col, ci) => (
                <td key={ci}>
                  <div className={`pkv-f-matrix-radio ${v[ri] === col ? 'selected' : ''}`}
                    onClick={() => setCell(ri, col)} style={{ margin: '0 auto' }}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- File Upload ------------------------------------------ */
function FileUploadField({ config, value, onChange }) {
  const [dragover, setDragover] = React.useState(false);
  const inputRef = React.useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    if (config.maxSizeMB && file.size > config.maxSizeMB * 1024 * 1024) {
      alert(`Soubor je příliš velký. Maximum: ${config.maxSizeMB} MB`);
      return;
    }
    onChange({ name: file.name, size: file.size, type: file.type, file: file });
  };
  return (
    <div>
      <div className={`pkv-f-upload-zone ${dragover ? 'dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={(e) => { e.preventDefault(); setDragover(false); handleFile(e.dataTransfer.files[0]); }}>
        <div className="pkv-f-upload-icon"><IconUpload /></div>
        <div className="pkv-f-upload-text">
          {config.uploadText || 'Přetáhněte soubor nebo klikněte pro výběr'}
        </div>
        {config.accept && <div style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 8 }}>Formáty: {config.accept}</div>}
        <input ref={inputRef} type="file" accept={config.accept} style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
      {value && value.name && (
        <div className="pkv-f-upload-file">
          <span style={{ fontSize: 20 }}>📄</span>
          <span style={{ flex: 1, color: '#fff', fontSize: 15 }}>{value.name}</span>
          <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>{(value.size / 1024).toFixed(0)} KB</span>
          <button type="button" onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', color: 'var(--pkv-red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ---- Legal Consent ---------------------------------------- */
function LegalField({ config, value, onChange, onAutoAdvance }) {
  const toggle = () => {
    const next = !value;
    onChange(next);
    if (next && onAutoAdvance) onAutoAdvance();
  };
  return (
    <div className="pkv-f-legal" onClick={toggle}>
      <div className={`pkv-f-checkbox-box ${value ? 'checked' : ''}`}>
        {value && <IconCheck />}
      </div>
      <div className="pkv-f-legal-text">{config.text || config.label || 'Souhlasím'}</div>
    </div>
  );
}

/* ---- Checkbox --------------------------------------------- */
function CheckboxField({ config, value, onChange }) {
  const options = (config.options || [config]).map(o => typeof o === 'string' ? { label: o, value: o } : o);
  const selected = value || [];
  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.map((opt, i) => (
        <div key={i} className="pkv-f-legal" onClick={() => toggle(opt.value)}>
          <div className={`pkv-f-checkbox-box ${selected.includes(opt.value) ? 'checked' : ''}`}>
            {selected.includes(opt.value) && <IconCheck />}
          </div>
          <div className="pkv-f-legal-text">{opt.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ---- Contact Info (composite) ----------------------------- */
function ContactInfoField({ config, value, onChange }) {
  const v = value || {};
  const set = (key, val) => onChange({ ...v, [key]: val });
  const fields = config.fields || ['first_name', 'last_name', 'email', 'phone'];
  const labels = {
    first_name: 'Jméno', last_name: 'Příjmení',
    email: 'E-mail', phone: 'Telefon',
    company: 'Firma', job_title: 'Pozice',
  };
  const placeholders = {
    first_name: 'Jan', last_name: 'Novák',
    email: 'jmeno@example.cz', phone: '601 123 456',
    company: 'Název firmy', job_title: 'Vaše pozice',
  };

  const hasNameRow = fields.includes('first_name') && fields.includes('last_name');
  const otherFields = fields.filter(f => f !== 'first_name' && f !== 'last_name');

  return (
    <div className="pkv-f-field-grid">
      {hasNameRow && (
        <div className="pkv-f-field-grid pkv-f-field-grid-2">
          <div>
            <label className="pkv-f-field-label">{labels.first_name}</label>
            <input className="pkv-f-input" placeholder={placeholders.first_name}
              value={v.first_name || ''} onChange={(e) => set('first_name', e.target.value)} autoFocus />
          </div>
          <div>
            <label className="pkv-f-field-label">{labels.last_name}</label>
            <input className="pkv-f-input" placeholder={placeholders.last_name}
              value={v.last_name || ''} onChange={(e) => set('last_name', e.target.value)} />
          </div>
        </div>
      )}
      {otherFields.map(f => (
        <div key={f}>
          <label className="pkv-f-field-label">{labels[f] || f}</label>
          <input className="pkv-f-input" type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
            placeholder={placeholders[f] || ''}
            value={v[f] || ''} onChange={(e) => set(f, e.target.value)} />
        </div>
      ))}
    </div>
  );
}

/* ---- Multi-Question Page ---------------------------------- */
function MultiQuestionField({ config, value, onChange }) {
  const v = value || {};
  const set = (id, val) => onChange({ ...v, [id]: val });
  const questions = config.questions || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {questions.map((q, i) => {
        const FieldComp = window.PKV_FIELD_REGISTRY[q.type];
        if (!FieldComp) return <div key={i}>Neznámý typ: {q.type}</div>;
        return (
          <div key={q.id || i}>
            <label className="pkv-f-field-label" style={{ fontSize: 15, fontWeight: 700, color: 'var(--fg)', textTransform: 'none', letterSpacing: 0, marginBottom: 10 }}>
              {q.label || q.title}
              {q.required && <span style={{ color: 'var(--pkv-red)', marginLeft: 4 }}>*</span>}
            </label>
            {q.subtitle && <p style={{ fontSize: 14, color: 'var(--fg-muted)', margin: '0 0 8px' }}>{q.subtitle}</p>}
            <FieldComp config={q} value={v[q.id]} onChange={(val) => set(q.id, val)} />
          </div>
        );
      })}
    </div>
  );
}

/* ---- Signature -------------------------------------------- */
function SignatureField({ config, value, onChange }) {
  const canvasRef = React.useRef(null);
  const [drawing, setDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00CA85';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvasRef.current.width / rect.width), y: (clientY - rect.top) * (canvasRef.current.height / rect.height) };
  };

  const startDraw = (e) => {
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };
  const endDraw = () => {
    setDrawing(false);
    onChange(canvasRef.current.toDataURL('image/png'));
  };
  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#2A2A2A';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    onChange(null);
  };

  return (
    <div>
      <canvas ref={canvasRef} width={600} height={200}
        style={{ width: '100%', height: 160, borderRadius: 12, border: '2px solid var(--pkv-gray-dark)', cursor: 'crosshair', touchAction: 'none' }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}></canvas>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" onClick={clear}
          style={{ background: 'none', border: '1px solid #4C4C4C', borderRadius: 6, color: '#A0A0A0', padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
          Vymazat
        </button>
      </div>
    </div>
  );
}

/* ---- Field Registry --------------------------------------- */
window.PKV_FIELD_REGISTRY = {
  'short-text': ShortTextField,
  'long-text': LongTextField,
  'email': EmailField,
  'phone': PhoneField,
  'number': NumberField,
  'date': DateField,
  'website': WebsiteField,
  'address': AddressField,
  'choice': SingleChoiceField,
  'multi-choice': MultiChoiceField,
  'yes-no': YesNoField,
  'dropdown': DropdownField,
  'picture-choice': PictureChoiceField,
  'nps': NPSField,
  'opinion-scale': OpinionScaleField,
  'rating': RatingField,
  'ranking': RankingField,
  'matrix': MatrixField,
  'file-upload': FileUploadField,
  'legal': LegalField,
  'checkbox': CheckboxField,
  'contact-info': ContactInfoField,
  'multi-question': MultiQuestionField,
  'signature': SignatureField,
};

Object.assign(window, {
  ShortTextField, LongTextField, EmailField, PhoneField, NumberField,
  DateField, WebsiteField, AddressField,
  SingleChoiceField, MultiChoiceField, YesNoField, DropdownField, PictureChoiceField,
  NPSField, OpinionScaleField, RatingField, RankingField, MatrixField,
  FileUploadField, LegalField, CheckboxField, ContactInfoField, MultiQuestionField, SignatureField,
});
