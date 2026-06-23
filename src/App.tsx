import React, { useState, useEffect, useRef } from 'react';
import { FormData, FinishType, UserType, FontStyle, MountingMethod } from './types';
import { FONT_OPTIONS, FINISH_OPTIONS, MOUNTING_OPTIONS, THICKNESS_OPTIONS } from './constants';
import Preview3D from './components/Preview3D';
import FontFaceLoader, { getFontFaceName } from './components/FontFaceLoader';
import {
  User,
  Anchor,
  Ship,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  UploadCloud,
  Ruler,
  Palette,
  Layers,
  AlertCircle,
  Info,
  Type,
  Loader2
} from 'lucide-react';
import { sendQuoteRequest } from './services/emailService';

const PAINTED_COLOR_OPTIONS = [
  { name: 'Blu', hex: '#1B3A6B' },
  { name: 'Bianco', hex: '#FFFFFF' },
  { name: 'Nero', hex: '#111111' },
  { name: 'Grigio', hex: '#9CA3AF' },
  { name: 'Rosso', hex: '#C0392B' },
  { name: 'Arancione', hex: '#E67E22' },
  { name: 'Giallo', hex: '#F1C40F' },
  { name: 'Verde', hex: '#2E7D32' },
  { name: 'Celeste', hex: '#38BDF8' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Viola', hex: '#7C3AED' },
  { name: 'Marrone', hex: '#8B4513' },
  { name: 'Simil Oro', hex: '#C9A227' },
] as const;

const App: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    ragioneSociale: '',
    partitaIva: '',
    userType: null,
    boatName: '',
    length: '',
    height: '',
    thickness: '3mm',
    projectImage: null,
    fontStylePreference: FontStyle.CORSIVO,
    selectedFontFamily: FONT_OPTIONS[0].family,
    selectedFontName: FONT_OPTIONS[0].name,
    fontIndex: 1,
    finishType: FinishType.GLOSSY,
    paintColor: '#1B3A6B',
    paintColorCode: '',
    mountingMethod: MountingMethod.TAPE,
    notes: ''
  });

  const [textAspectRatio, setTextAspectRatio] = useState<number>(0);
  const [isValid, setIsValid] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const previewRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Validation Logic - 4 Steps
  useEffect(() => {
    const validateStep = () => {
      switch (step) {
        case 1: // Font + Nome Barca
          // Require boat name (font is always selected by default)
          return formData.boatName.trim().length > 0;
        case 2: // Dimensioni + Spessore
          // Require a positive length, height (auto-calculated), and thickness
          const len = parseFloat(formData.length);
          const isLengthValid = !isNaN(len) && len > 0;
          const hasHeight = formData.height.trim().length > 0;
          const hasThickness = !!formData.thickness;
          return isLengthValid && hasHeight && hasThickness;
        case 3: // Finitura e Montaggio
          // Finish selection is always set (default to GLOSSY), but if PAINTED need color
          if (formData.projectImage) {
            // When user uploaded a project image, require mounting method
            const hasMounting = !!formData.mountingMethod;
            if (formData.finishType === FinishType.PAINTED) {
              return hasMounting && !!formData.paintColor;
            }
            return hasMounting;
          }
          if (formData.finishType === FinishType.PAINTED) {
            return !!formData.paintColor;
          }
          return true;
        case 4: // Tipologia Utente + Dati Personali
          if (!formData.userType) return false;
          if (formData.userType === UserType.PRIVATE) {
            return (
              formData.firstName.trim().length > 0 &&
              formData.lastName.trim().length > 0 &&
              formData.email.trim().includes('@') &&
              formData.phone.trim().length > 0
            );
          }
          if (formData.userType === UserType.SHIPYARD) {
            return (
              formData.ragioneSociale.trim().length > 0 &&
              formData.partitaIva.trim().length > 0 &&
              formData.email.trim().includes('@') &&
              formData.phone.trim().length > 0
            );
          }
          if (formData.userType === UserType.AZIENDE) {
            return (
              formData.ragioneSociale.trim().length > 0 &&
              formData.partitaIva.trim().length > 0 &&
              formData.email.trim().includes('@') &&
              formData.phone.trim().length > 0
            );
          }
          return false;
        default:
          return false;
      }
    };
    setIsValid(validateStep());
  }, [step, formData]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

  // SPB TRACKING — notifica GTM parent quando utente arriva allo step Dati
  useEffect(() => {
    if (step === 4) {
      window.parent.postMessage(
        { type: 'spb_event', event: 'configurator_step_dati' },
        'https://www.scrittaperbarca.com'
      );
    }
  }, [step]);

  const handleNext = () => {
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const compressImageDataUri = async (dataUri: string): Promise<string> => {
    if (!dataUri.startsWith('data:image/')) return dataUri;

    const img = new Image();
    const loaded = await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Impossibile leggere l\'immagine caricata.'));
      img.src = dataUri;
    });
    void loaded;

    const maxW = 800;
    const maxH = 560;
    let { width, height } = img;
    const scale = Math.min(maxW / width, maxH / height, 1);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUri;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.5;
    let out = canvas.toDataURL('image/jpeg', quality);
    const MAX_LEN = 65_000; // keep payload small for EmailJS limits
    while (out.length > MAX_LEN && quality > 0.25) {
      quality -= 0.1;
      out = canvas.toDataURL('image/jpeg', quality);
    }
    return out;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE = 500 * 1024; // 500 KB max
      if (file.size > MAX_FILE_SIZE) {
        setSendError(`File troppo grande (${(file.size/1024).toFixed(0)}KB). Massimo 500KB. Riduci le dimensioni e riprova.`);
        setTimeout(() => setSendError(null), 5000);
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const dataUri = event.target?.result as string;
          const preparedDataUri = dataUri.startsWith('data:image/')
            ? await compressImageDataUri(dataUri)
            : dataUri;
          updateField('projectImage', { name: file.name, dataUri: preparedDataUri });
          setSendError(null); // Clear any previous file size error
          // If user uploaded a project image, skip dimensions and go directly to finish/mount step
          setStep(3);
        } catch (err) {
          setSendError('Impossibile elaborare il file caricato. Prova con un\'immagine JPG/PNG più leggera.');
          setTimeout(() => setSendError(null), 5000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Callback from Preview3D to update height based on measured aspect ratio
  const handleAspectRatioChange = (ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    if (Math.abs(textAspectRatio - ratio) > 0.001) {
      setTextAspectRatio(ratio);
    }

    // If we have a valid length, recalculate height immediately when ratio changes (e.g. font change)
    const lengthVal = parseFloat(formData.length);
    if (!isNaN(lengthVal) && lengthVal > 0) {
      const calculatedHeight = (lengthVal * ratio).toFixed(1);
      if (calculatedHeight !== formData.height) {
        updateField('height', calculatedHeight);
      }
    }
  };

  // Recalculate height if length changes manually (using stored ratio)
  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = e.target.value;
    updateField('length', newLength);

    const lengthVal = parseFloat(newLength);
    if (!isNaN(lengthVal) && lengthVal > 0 && textAspectRatio > 0) {
      const calculatedHeight = (lengthVal * textAspectRatio).toFixed(1);
      updateField('height', calculatedHeight);
    } else if (newLength === '') {
      updateField('height', '');
    }
  };

  const getStyleFontNumber = (style: FontStyle, filteredIndex: number) =>
    style === FontStyle.CORSIVO ? 100 + filteredIndex : 300 + filteredIndex;

  // Try to capture the preview screenshot, with small retries if the canvas/mesh isn't ready yet
  const capturePreviewWithRetry = async (tries = 8, delayMs = 500) => {
    for (let i = 0; i < tries; i++) {
      try {
        const data = await previewRef.current?.handleCapture?.();
        if (data) return data;
      } catch (e) {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return null;
  };

  // ----- Render Functions -----

  const renderStep1Personal = () => (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dati Personali</h2>
      <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>Compila tutti i campi obbligatori per procedere.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Nome <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Cognome <span className="text-red-500">*</span></label>
          <input
            type="text"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">Telefono <span className="text-red-500">*</span></label>
          <input
            type="tel"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2UserType = () => (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800">Tipologia Utente</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <button
          onClick={() => updateField('userType', UserType.PRIVATE)}
          className={`p-6 md:p-8 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-4 group ${formData.userType === UserType.PRIVATE
            ? 'border-blue-600 bg-blue-50 shadow-lg'
            : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
        >
          <User size={40} className={formData.userType === UserType.PRIVATE ? 'text-blue-600' : 'text-slate-400'} />
          <span className="text-base md:text-lg font-semibold text-slate-700">{UserType.PRIVATE}</span>
        </button>
        <button
          onClick={() => updateField('userType', UserType.SHIPYARD)}
          className={`p-6 md:p-8 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-4 group ${formData.userType === UserType.SHIPYARD
            ? 'border-blue-600 bg-blue-50 shadow-lg'
            : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
        >
          <Anchor size={40} className={formData.userType === UserType.SHIPYARD ? 'text-blue-600' : 'text-slate-400'} />
          <span className="text-base md:text-lg font-semibold text-slate-700">{UserType.SHIPYARD}</span>
        </button>
      </div>
    </div>
  );

  const renderStep3TechDetails = () => (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800">Dettagli Scritta</h2>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Boat Name Input + (thickness moved to combined layout) */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600">Nome della Barca <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type="text"
              className="w-full p-3 pl-12 text-lg md:text-xl font-serif border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.boatName}
              onChange={(e) => updateField('boatName', e.target.value)}
              placeholder="Es. Andromeda"
            />
            <Ship className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
        </div>
      </div>

      {/* Project Upload (moved to combined layout) */}
    </div>
  );

  const renderStep4FontsAndDimensions = () => {
    // Filter fonts based on style preference
    const filteredFonts = FONT_OPTIONS.filter(f => f.style === formData.fontStylePreference);

    return (
      <div className="space-y-4 md:space-y-6 h-full flex flex-col animate-fade-in">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Font e Misure</h2>

        {/* SEZIONE 1: SCELTA FONT */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Type size={18} /> 1. Scegli Stile</h3>
          </div>
          {/* Style Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => updateField('fontStylePreference', FontStyle.CORSIVO)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.fontStylePreference === FontStyle.CORSIVO
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Corsivo
            </button>
            <button
              onClick={() => updateField('fontStylePreference', FontStyle.STAMPATELLO)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.fontStylePreference === FontStyle.STAMPATELLO
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Stampatello
            </button>
          </div>

          {/* Font List */}
          <div className="font-scroll overflow-y-auto max-h-[250px] border rounded-xl p-3 md:p-4 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredFonts.map((font, idx) => {
                const globalIdx = FONT_OPTIONS.findIndex((f) => f.family === font.family);
                const styleFontNumber = getStyleFontNumber(font.style, idx);
                let typoClass = 'stampatello-text';
                if (font.style === FontStyle.CORSIVO) typoClass = 'corsivo-text';
                else if (font.family.toLowerCase().includes('serif') && !font.family.toLowerCase().includes('sans-serif')) typoClass = 'serif-text';

                const fontFaceName = getFontFaceName(font.family, globalIdx);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      updateField('selectedFontFamily', font.family);
                      updateField('selectedFontName', font.name);
                      updateField('fontIndex', styleFontNumber);
                    }}
                    className={`relative p-3 md:p-4 border rounded-lg hover:shadow-md transition-all group ${formData.selectedFontFamily === font.family
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-800 border-slate-200'
                      }`}
                  >
                    <div className="min-w-0 w-full flex flex-col items-center justify-center text-center">
                      <span
                        className={`text-xl md:text-2xl block mb-1 truncate w-full ${typoClass}`}
                        style={{ fontFamily: fontFaceName }}
                      >
                        {formData.boatName || 'Anteprima'}
                      </span>
                      <span className={`text-xs font-semibold ${formData.selectedFontFamily === font.family ? 'text-blue-100' : 'text-slate-600'}`}>
                        Font #{styleFontNumber}
                      </span>
                    </div>
                    {formData.selectedFontFamily === font.family && <CheckCircle2 size={20} className="absolute right-3 top-1/2 -translate-y-1/2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEZIONE 2: DIMENSIONI */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Ruler size={18} /> 2. Definisci Misure (cm)</h3>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 min-h-[2.5rem]">Lunghezza (cm)</label>
                <input
                  type="number"
                  value={formData.length}
                  onChange={handleLengthChange}
                  className="w-full h-12 px-3 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-base"
                  placeholder="Inserisci la lunghezza"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 min-h-[2.5rem]">Altezza (Auto)</label>
                <input
                  type="number"
                  value={formData.height}
                  readOnly
                  className="w-full h-12 px-3 border border-slate-200 rounded bg-white text-slate-500 font-bold text-base"
                />
              </div>
            </div>
            <div className="mt-3 text-xs text-blue-700 flex items-start gap-1">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>L'altezza si calcola <strong>automaticamente</strong> in base al font scelto e alla lunghezza inserita.</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2DimensionsAndThickness = () => (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800">Misure e Spessore</h2>

      <div className="grid grid-cols-2 gap-2 md:gap-6 items-stretch">
        {/* DIMENSIONI */}
        <div className="flex flex-col gap-3 md:gap-4 h-full">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm md:text-base"><Ruler size={16} /> Dimensioni (cm)</h3>
          <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100 flex-1">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lunghezza (cm)</label>
                <input
                  type="number"
                  value={formData.length}
                  onChange={handleLengthChange}
                  className="w-full h-11 md:h-12 px-3 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                  placeholder="Lunghezza"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Altezza (Auto)</label>
                <input
                  type="number"
                  value={formData.height}
                  readOnly
                  className="w-full h-11 md:h-12 px-3 border border-slate-200 rounded bg-white text-slate-500 font-bold text-sm md:text-base"
                />
              </div>
            </div>
            <div className="mt-2 md:mt-3 text-[11px] md:text-xs text-blue-700 flex items-start gap-1">
              <Info size={12} className="mt-0.5 shrink-0 md:w-[14px] md:h-[14px]" />
              <span>L'altezza si calcola <strong>automaticamente</strong> in base al font scelto e alla lunghezza inserita.</span>
            </div>
          </div>
        </div>

        {/* SPESSORE */}
        <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-200 h-full flex flex-col gap-3 md:gap-4">
          <h3 className="font-semibold flex items-center gap-2 text-slate-700 text-sm md:text-base"><Layers size={16} /> Spessore</h3>
          <div className="grid grid-cols-1 gap-2 flex-1">
            {THICKNESS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => updateField('thickness', opt)}
                className={`w-full h-full min-h-[44px] py-2 px-3 rounded border text-sm font-medium transition-all ${formData.thickness === opt
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5FinishAndMount = () => (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800">Finitura e Montaggio</h2>

      {/* If user uploaded a project image, ask for length and thickness here */}
      {formData.projectImage && (
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-700">Specifiche progetto caricato</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 min-h-[2.5rem]">Lunghezza (cm)</label>
              <input
                type="number"
                value={formData.length}
                onChange={handleLengthChange}
                className="w-full h-12 px-3 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-base"
                placeholder="Inserisci la lunghezza"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 min-h-[2.5rem]">Altezza (Auto)</label>
              <input
                type="number"
                value={formData.height}
                readOnly
                className="w-full h-12 px-3 border border-slate-200 rounded bg-white text-slate-500 font-bold text-base"
              />
            </div>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Spessore</h4>
            <div className="flex flex-wrap gap-2">
              {THICKNESS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateField('thickness', opt)}
                  className={`py-2 px-3 rounded border text-sm font-medium transition-all min-w-[60px] ${formData.thickness === opt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3D Preview (hidden if user uploaded a project image) */}
      {!formData.projectImage && (
        <Preview3D
          ref={previewRef}
          text={formData.boatName}
          finishType={formData.finishType}
          paintColor={formData.paintColor}
          fontFamily={formData.selectedFontFamily}
          thickness={formData.thickness}
          mountingMethod={formData.mountingMethod}
          lengthCm={formData.length}
          heightCm={formData.height}
          onAspectRatioChange={handleAspectRatioChange}
          measurementsEnabled={false}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Col: Finish */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-slate-700 text-sm md:text-base"><Palette size={18} /> Finitura</h3>
          <div className="space-y-3">
            {FINISH_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateField('finishType', opt.id)}
                className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${formData.finishType === opt.id
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="font-medium text-slate-800 text-sm md:text-base">{opt.label}</div>
                  <div className="text-xs text-slate-500">{opt.description}</div>
                </div>
                {formData.finishType === opt.id && <CheckCircle2 size={18} className="text-blue-500" />}
              </button>
            ))}
          </div>

          {/* Painted colors */}
          {formData.finishType === FinishType.PAINTED && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
              <label className="text-sm font-bold text-slate-700 block mb-3">
                🎨 Scegli un colore
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAINTED_COLOR_OPTIONS.map(({ name, hex }) => (
                  <button
                    key={name}
                    onClick={() => updateField('paintColor', hex)}
                    className={`p-2 rounded-lg border text-sm font-semibold transition-all flex items-center gap-2 ${formData.paintColor === hex
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-800 border-slate-300 hover:border-blue-400'
                      }`}
                  >
                    <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: hex }} />
                    <span>{name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 bg-white border border-slate-200 rounded-lg p-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hai un codice RAL?</label>
                <input
                  type="text"
                  value={formData.paintColorCode}
                  onChange={(e) => updateField('paintColorCode', e.target.value)}
                  placeholder="Es. RAL 9010"
                  className="w-full p-2 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Mounting & Notes */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-slate-700 text-sm md:text-base"><Anchor size={18} /> Metodo di Montaggio</h3>
            <div className="flex flex-col gap-3">
              {/* Biadesivo */}
              <label
                className={`grid grid-cols-1 md:grid-cols-2 gap-1 p-4 rounded-xl border-2 cursor-pointer 
                                           transition-all duration-200
                                           ${formData.mountingMethod === MountingMethod.TAPE
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="mountingMethod"
                    value={MountingMethod.TAPE}
                    checked={formData.mountingMethod === MountingMethod.TAPE}
                    onChange={(e) => updateField('mountingMethod', e.target.value)}
                    className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {MountingMethod.TAPE}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                        Il più utilizzato
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      Non richiede fori, mantiene lo scafo integro e garantisce
                      un'ottima tenuta. Perfetto per vetroresina, plexiglass
                      e superfici lisce.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <img src="/mounting-methods/biadesivo.png" alt="Biadesivo" className="w-24 h-20 object-contain" />
                </div>
              </label>

              {/* Perni Meccanici */}
              <label
                className={`grid grid-cols-1 md:grid-cols-2 gap-1 p-4 rounded-xl border-2 cursor-pointer 
                                           transition-all duration-200
                                           ${formData.mountingMethod === MountingMethod.PINS
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="mountingMethod"
                    value={MountingMethod.PINS}
                    checked={formData.mountingMethod === MountingMethod.PINS}
                    onChange={(e) => updateField('mountingMethod', e.target.value)}
                    className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {MountingMethod.PINS}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      Perni passanti, utilizzati quando è possibile accedere allo
                      scafo dall'interno. Perni e dadi permettono di fissare in modo
                      stabile le scritte in acciaio inox alla superficie della barca,
                      garantendo un montaggio sicuro e duraturo.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <img src="/mounting-methods/perni-meccanici.png" alt="Perni Meccanici" className="w-24 h-20 object-contain" />
                </div>
              </label>

              {/* Viti Autofilettanti */}
              <label
                className={`grid grid-cols-1 md:grid-cols-2 gap-1 p-4 rounded-xl border-2 cursor-pointer 
                                           transition-all duration-200
                                           ${formData.mountingMethod === MountingMethod.SCREWS
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="mountingMethod"
                    value={MountingMethod.SCREWS}
                    checked={formData.mountingMethod === MountingMethod.SCREWS}
                    onChange={(e) => updateField('mountingMethod', e.target.value)}
                    className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm md:text-base font-bold text-slate-800">
                        {MountingMethod.SCREWS}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                      Le viti autofilettanti consentono un fissaggio diretto su
                      vetroresina, plexiglass e legno, assicurando elevata
                      tenuta meccanica.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <img src="/mounting-methods/viti-autofilettanti.png" alt="Viti Autofilettanti" className="w-24 h-20 object-contain" />
                </div>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderStep4UserAndPersonal = () => (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-slate-800">Tipologia e Dati</h2>

      {/* Tipologia Utente */}
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-700 text-sm md:text-base">Sei un privato o un cantiere?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              updateField('userType', UserType.PRIVATE);
              updateField('ragioneSociale', '');
              updateField('partitaIva', '');
            }}
            className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.userType === UserType.PRIVATE
              ? 'border-blue-600 bg-blue-50 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
          >
            <User size={32} className={formData.userType === UserType.PRIVATE ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-sm md:text-base font-semibold text-slate-700">{UserType.PRIVATE}</span>
          </button>
          <button
            onClick={() => {
              updateField('userType', UserType.SHIPYARD);
              updateField('firstName', '');
              updateField('lastName', '');
            }}
            className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.userType === UserType.SHIPYARD
              ? 'border-blue-600 bg-blue-50 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
          >
            <Anchor size={32} className={formData.userType === UserType.SHIPYARD ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-sm md:text-base font-semibold text-slate-700">{UserType.SHIPYARD}</span>
          </button>
          <button
            onClick={() => {
              updateField('userType', UserType.AZIENDE);
              updateField('firstName', '');
              updateField('lastName', '');
            }}
            className={`p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.userType === UserType.AZIENDE
              ? 'border-blue-600 bg-blue-50 shadow-lg'
              : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
          >
            <Layers size={32} className={formData.userType === UserType.AZIENDE ? 'text-blue-600' : 'text-slate-400'} />
            <span className="text-sm md:text-base font-semibold text-slate-700">{UserType.AZIENDE}</span>
          </button>
        </div>
      </div>

      {/* Dati Personali */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <h3 className="font-semibold text-slate-700 text-sm md:text-base">I tuoi dati</h3>
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>Compila tutti i campi per ricevere il preventivo.</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {formData.userType === UserType.PRIVATE ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nome <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Cognome <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>
            </>
          ) : formData.userType === UserType.SHIPYARD ? (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Ragione Sociale <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.ragioneSociale}
                  onChange={(e) => updateField('ragioneSociale', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Partita IVA <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.partitaIva}
                  onChange={(e) => updateField('partitaIva', e.target.value)}
                />
              </div>
            </>
          ) : formData.userType === UserType.AZIENDE ? (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Ragione Sociale <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.ragioneSociale}
                  onChange={(e) => updateField('ragioneSociale', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">Partita IVA <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.partitaIva}
                  onChange={(e) => updateField('partitaIva', e.target.value)}
                />
              </div>
            </>
          ) : null}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Telefono <span className="text-red-500">*</span></label>
            <input
              type="tel"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
        </div>
        {/* Note Aggiuntive: spostate qui in fondo al form dati */}
        <div className="mt-6">
          <h3 className="font-semibold text-slate-700 mb-2 text-sm md:text-base">Note Aggiuntive</h3>
          <textarea
            className="w-full border border-slate-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  // ----- Main Render -----

  return (
    <div className="min-h-screen bg-slate-100 py-4 px-2 md:py-10 md:px-4 font-sans">
      <FontFaceLoader />
      <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden min-h-[85vh] md:min-h-[800px] flex flex-col">

        {/* Header / Stepper */}
        <div className="bg-slate-900 text-white p-4 md:p-6">
          <div className="flex justify-between items-center gap-2 mb-4 md:mb-6">
            <h1 className="min-w-0 flex-1 text-[9px] sm:text-[10px] md:text-xl font-bold flex items-center gap-1 md:gap-2 leading-tight whitespace-nowrap">
              <Ship className="text-blue-400" />
              CREA LA TUA SCRITTA IN ACCIAIO INOX AISI 316L
            </h1>
            <span className="shrink-0 text-slate-400 text-[10px] md:text-sm whitespace-nowrap">Step {step} di 4</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-4 text-[10px] md:text-xs text-slate-400 mt-2 text-center gap-1">
            <span className={step >= 1 ? 'text-blue-400 font-bold' : ''}>Font</span>
            <span className={step >= 2 ? 'text-blue-400 font-bold' : ''}>Misure</span>
            <span className={step >= 3 ? 'text-blue-400 font-bold' : ''}>Finitura</span>
            <span className={step >= 4 ? 'text-blue-400 font-bold' : ''}>Dati</span>
          </div>
        </div>

        {/* Content Area */}
        <div ref={contentRef} className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* PERSISTENT PREVIEW - Sticky at top for Steps 1-2 */}
          {(step === 1 || step === 2) && !formData.projectImage && formData.boatName.length > 0 && (
            <div className="sticky top-0 bg-white z-10 mb-6 pb-4 border-b border-slate-200">
              <Preview3D
                ref={previewRef}
                text={formData.boatName}
                finishType={formData.finishType}
                paintColor={formData.paintColor}
                fontFamily={formData.selectedFontFamily}
                thickness={formData.thickness}
                lengthCm={formData.length}
                heightCm={formData.height}
                onAspectRatioChange={handleAspectRatioChange}
                measurementsEnabled={step === 2 && Number.parseFloat(String(formData.length)) > 0}
              />
            </div>
          )}

          {/* STEP 1: Font Selection + Boat Name */}
          {step === 1 && (
            <div className="space-y-6 md:space-y-8 animate-fade-in">

              {/* Nome Barca */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-600">Nome della Barca <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 pl-12 text-lg md:text-xl font-serif border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.boatName}
                    onChange={(e) => updateField('boatName', e.target.value)}
                    placeholder="Es. Andromeda"
                  />
                  <Ship className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
              </div>

              {/* Scelta Font (estratto) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2"><Type size={18} /> 1. Scegli Stile</h3>
                </div>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => updateField('fontStylePreference', FontStyle.CORSIVO)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.fontStylePreference === FontStyle.CORSIVO
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Corsivo
                  </button>
                  <button
                    onClick={() => updateField('fontStylePreference', FontStyle.STAMPATELLO)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.fontStylePreference === FontStyle.STAMPATELLO
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Stampatello
                  </button>
                </div>

                <div className="font-scroll overflow-y-auto max-h-[250px] border rounded-xl p-3 md:p-4 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {FONT_OPTIONS.filter(f => f.style === formData.fontStylePreference).map((font, filteredIdx) => {
                      const globalIdx = FONT_OPTIONS.findIndex(f => f.family === font.family);
                      const styleFontNumber = getStyleFontNumber(font.style, filteredIdx);
                      let typoClass = 'stampatello-text';
                      if (font.style === FontStyle.CORSIVO) typoClass = 'corsivo-text';
                      else if (font.family.toLowerCase().includes('serif') && !font.family.toLowerCase().includes('sans-serif')) typoClass = 'serif-text';

                      const fontFaceName = getFontFaceName(font.family, globalIdx);

                      return (
                        <button
                          key={filteredIdx}
                          onClick={() => {
                            updateField('selectedFontFamily', font.family);
                            updateField('selectedFontName', font.name);
                            updateField('fontIndex', styleFontNumber);
                          }}
                          className={`relative p-3 md:p-4 border rounded-lg hover:shadow-md transition-all group ${formData.selectedFontFamily === font.family
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-800 border-slate-200'
                            }`}
                        >
                          <div className="min-w-0 w-full flex flex-col items-center justify-center text-center">
                            <span
                              className={`text-xl md:text-2xl block mb-1 truncate w-full ${typoClass}`}
                              style={{ fontFamily: fontFaceName }}
                            >
                              {formData.boatName || 'Anteprima'}
                            </span>
                            <span className={`text-xs font-semibold ${formData.selectedFontFamily === font.family ? 'text-blue-100' : 'text-slate-600'}`}>
                              Font #{styleFontNumber}
                            </span>
                          </div>
                          {formData.selectedFontFamily === font.family && <CheckCircle2 size={20} className="absolute right-3 top-1/2 -translate-y-1/2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hai già un progetto in mente? (upload) */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                <input
                  type="file"
                  id="projectUpload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,application/pdf"
                />
                <label htmlFor="projectUpload" className="cursor-pointer flex flex-col items-center gap-2">
                  <UploadCloud size={32} className="text-slate-400" />
                  <span className="font-medium text-slate-700 text-sm md:text-base">Hai già un progetto in mente?</span>
                  <span className="text-xs text-slate-500">Clicca per caricare (JPG, PNG, PDF)</span>
                  <span className="text-xs text-slate-500">Dimensione massima file: 500 KB</span>
                  {formData.projectImage && (
                    <div className="mt-2 text-green-600 text-sm font-semibold flex items-center gap-1">
                      <CheckCircle2 size={14} /> {formData.projectImage.name}
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
          {step === 2 && renderStep2DimensionsAndThickness()}
          {step === 3 && renderStep5FinishAndMount()}
          {step === 4 && renderStep4UserAndPersonal()}
          {/* Preview3D sempre montato all'ultimo step per mantenere il ref valido per lo screenshot */}
          {step === 4 && !formData.projectImage && (
            // Mount preview off-screen but with a reasonable size so canvas is rendered at full resolution
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 800, height: 600, overflow: 'hidden' }}>
              <Preview3D
                ref={previewRef}
                text={formData.boatName}
                finishType={formData.finishType}
                paintColor={formData.paintColor}
                fontFamily={formData.selectedFontFamily}
                thickness={formData.thickness}
                mountingMethod={formData.mountingMethod}
                lengthCm={formData.length}
                heightCm={formData.height}
                onAspectRatioChange={handleAspectRatioChange}
                measurementsEnabled={false}
              />
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center sticky bottom-0 z-20">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base ${step === 1
              ? 'text-slate-300 cursor-not-allowed'
              : 'text-slate-600 hover:bg-slate-200'
              }`}
          >
            <ChevronLeft size={18} />
            Indietro
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!isValid}
              className={`flex items-center gap-1 md:gap-2 px-5 md:px-8 py-2 md:py-3 text-white rounded-lg font-bold shadow-lg transition-all transform active:scale-95 text-sm md:text-base ${isValid
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                : 'bg-slate-400 cursor-not-allowed shadow-none active:scale-100'
                }`}
            >
              Avanti
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={async () => {
                if (!isValid) return;
                setIsSending(true);
                setSendError(null);
                try {
                  const screenshot = await capturePreviewWithRetry();
                  // client-side debug log
                  if (screenshot) console.log('DEBUG (client): preview_screenshot length =', screenshot.length, screenshot.slice(0,40));
                  else console.log('DEBUG (client): no preview_screenshot captured');
                  
                  // Log total payload size estimate
                  const projectDataSize = formData.projectImage?.dataUri?.length || 0;
                  const screenshotSize = screenshot?.length || 0;
                  console.log(`DEBUG (client): Total payload estimate - Screenshot: ${screenshotSize}B, ProjectFile: ${projectDataSize}B, Total: ${screenshotSize + projectDataSize}B`);
                  
                  await sendQuoteRequest(formData, screenshot);
                  setIsSent(true);

                  // SPB TRACKING — invia evento Lead al GTM parent con dati per CAPI
                  const spbEventId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                  window.parent.postMessage(
                    {
                      type: 'spb_event',
                      event: 'configurator_lead',
                      event_id: spbEventId,
                      email: formData.email || '',
                      phone: formData.phone || '',
                      first_name: formData.firstName || '',
                      last_name: formData.lastName || '',
                      boat_name: formData.boatName || '',
                      user_type: formData.userType || '',
                      ragione_sociale: formData.ragioneSociale || '',
                    },
                    'https://www.scrittaperbarca.com'
                  );
                } catch (error) {
                  console.error("DEBUG - Errore invio EmailJS:", error);
                  setSendError("Si è verificato un errore durante l'invio. Riprova più tardi.");
                } finally {
                  setIsSending(false);
                }
              }}
              disabled={!isValid || isSending || isSent}
              className={`flex items-center gap-1 md:gap-2 px-5 md:px-8 py-2 md:py-3 text-white rounded-lg font-bold shadow-lg transition-all transform active:scale-95 text-sm md:text-base ${isSent
                ? 'bg-slate-500 cursor-not-allowed'
                : isValid && !isSending
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                  : 'bg-slate-400 cursor-not-allowed shadow-none active:scale-100'
                }`}
            >
              {isSending ? (
                <>
                  Invio in corso...
                  <Loader2 size={18} className="animate-spin" />
                </>
              ) : isSent ? (
                <>
                  Richiesta Inviata
                  <CheckCircle2 size={18} />
                </>
              ) : (
                <>
                  Richiedi Preventivo
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          )}

        </div>

        {/* Success/Error Overlay */}
        {isSent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Richiesta Inviata!</h3>
              <p className="text-slate-600 mb-6">
                Grazie {formData.userType === UserType.PRIVATE ? formData.firstName : formData.ragioneSociale}. Abbiamo ricevuto i dettagli della tua configurazione della tua scritta <strong>{formData.boatName}</strong>.
                Ti risponderemo al più presto all'indirizzo {formData.email}.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}

        {sendError && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{sendError}</p>
              <button onClick={() => setSendError(null)} className="ml-auto text-red-400 hover:text-red-600">
                &times;
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;
