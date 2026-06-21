import React, { useState, useEffect } from 'react';
import { Plus, Minus, CheckCircle, Clock, Award, Lock, Save, AlertCircle } from 'lucide-react';

export interface MatchData {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  home_odd: number;
  draw_odd: number;
  away_odd: number;
  home_score?: number;
  away_score?: number;
  status?: string;
}

interface PredictionCardProps {
  match: MatchData;
  initialPrediction?: { outcome: 'home' | 'draw' | 'away'; diff: number };
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => Promise<void>;
}

// Map English country names to Turkish for display
const englishToTurkish: Record<string, string> = {
  // --- EUROPE (UEFA) ---
  'france': 'Fransa',
  'germany': 'Almanya',
  'spain': 'İspanya',
  'italy': 'İtalya',
  'england': 'İngiltere',
  'netherlands': 'Hollanda',
  'belgium': 'Belçika',
  'portugal': 'Portekiz',
  'croatia': 'Hırvatistan',
  'switzerland': 'İsviçre',
  'denmark': 'Danimarka',
  'sweden': 'İsveç',
  'poland': 'Polonya',
  'austria': 'Avusturya',
  'norway': 'Norveç',
  'turkey': 'Türkiye',
  'scotland': 'İskoçya',
  'wales': 'Galler',
  'ukraine': 'Ukrayna',
  'hungary': 'Macaristan',
  'czech republic': 'Çekya',
  'czechia': 'Çekya',
  'serbia': 'Sırbistan',
  'romania': 'Romanya',
  'slovakia': 'Slovakya',
  'georgia': 'Gürcistan',
  'albania': 'Arnavutluk',
  'slovenia': 'Slovenya',
  'greece': 'Yunanistan',
  'bulgaria': 'Bulgaristan',
  'iceland': 'İzlanda',
  'ireland': 'İrlanda',
  'northern ireland': 'Kuzey İrlanda',
  'finland': 'Finlandiya',

  // --- SOUTH AMERICA (CONMEBOL) ---
  'argentina': 'Arjantin',
  'brazil': 'Brezilya',
  'uruguay': 'Uruguay',
  'colombia': 'Kolombiya',
  'ecuador': 'Ekvador',
  'chile': 'Şili',
  'peru': 'Peru',
  'paraguay': 'Paraguay',
  'venezuela': 'Venezuela',
  'bolivia': 'Bolivya',

  // --- NORTH & CENTRAL AMERICA (CONCACAF) ---
  'usa': 'ABD',
  'united states': 'ABD',
  'america': 'ABD',
  'mexico': 'Meksika',
  'canada': 'Kanada',
  'panama': 'Panama',
  'costa rica': 'Kosta Rika',
  'jamaica': 'Jamaika',
  'honduras': 'Honduras',
  'el salvador': 'El Salvador',
  'haiti': 'Haiti',
  'curacao': 'Curaçao',

  // --- AFRICA (CAF) ---
  'morocco': 'Fas',
  'senegal': 'Senegal',
  'tunisia': 'Tunus',
  'algeria': 'Cezayir',
  'egypt': 'Mısır',
  'nigeria': 'Nijerya',
  'cameroon': 'Kamerun',
  'ivory coast': 'Fildişi Sahili',
  'ghana': 'Gana',
  'mali': 'Mali',
  'south africa': 'Güney Afrika',
  'cabo verde': 'Yeşil Burun',
  'cape verde': 'Yeşil Burun',
  'angola': 'Angola',
  'dr congo': 'Demokratik Kongo Cumhuriyeti',
  'congo': 'Kongo',
  'guinea': 'Gine',

  // --- ASIA (AFC) ---
  'japan': 'Japonya',
  'south korea': 'Güney Kore',
  'iran': 'İran',
  'saudi arabia': 'Suudi Arabistan',
  'australia': 'Avustralya',
  'uzbekistan': 'Özbekistan',
  'jordan': 'Ürdün',
  'qatar': 'Katar',
  'iraq': 'Irak',
  'uae': 'BAE',
  'united arab emirates': 'BAE',
  'china': 'Çin',
  'oman': 'Umman',
  'bahrain': 'Bahreyn',
  'syria': 'Suriye',
  'palestine': 'Filistin',
  'kyrgyzstan': 'Kırgızistan',

  // --- OCEANIA (OFC) ---
  'new zealand': 'Yeni Zelanda',
  'solomon islands': 'Solomon Adaları'
};

// Map country names (Turkish & English) to ISO-2 codes
const countryCodes: Record<string, string> = {
  // --- EUROPE (UEFA) ---
  'fransa': 'fr', 'france': 'fr',
  'almanya': 'de', 'germany': 'de',
  'ispanya': 'es', 'spain': 'es',
  'italya': 'it', 'italy': 'it',
  'ingiltere': 'gb', 'england': 'gb',
  'hollanda': 'nl', 'netherlands': 'nl',
  'belcika': 'be', 'belgium': 'be',
  'portekiz': 'pt', 'portugal': 'pt',
  'hirvatistan': 'hr', 'croatia': 'hr',
  'isvicre': 'ch', 'switzerland': 'ch',
  'danimarka': 'dk', 'denmark': 'dk',
  'isvec': 'se', 'sweden': 'se',
  'polonya': 'pl', 'poland': 'pl',
  'avusturya': 'at', 'austria': 'at',
  'norvec': 'no', 'norway': 'no',
  'turkiye': 'tr', 'turkey': 'tr',
  'iscocya': 'gb-sct', 'scotland': 'gb-sct',
  'galler': 'gb-wls', 'wales': 'gb-wls',
  'ukrayna': 'ua', 'ukraine': 'ua',
  'macaristan': 'hu', 'hungary': 'hu',
  'cekya': 'cz', 'czechia': 'cz', 'czech republic': 'cz',
  'sirbistan': 'rs', 'serbia': 'rs',
  'romanya': 'ro', 'romania': 'ro',
  'slovakya': 'sk', 'slovakia': 'sk',
  'gurcistan': 'ge', 'georgia': 'ge',
  'arnavutluk': 'al', 'albania': 'al',
  'slovenya': 'si', 'slovenia': 'si',
  'yunanistan': 'gr', 'greece': 'gr',
  'bulgaristan': 'bg', 'bulgaria': 'bg',
  'izlanda': 'is', 'iceland': 'is',
  'irlanda': 'ie', 'ireland': 'ie',
  'kuzey irlanda': 'gb-nir', 'northern ireland': 'gb-nir',
  'finlandiya': 'fi', 'finland': 'fi',

  // --- SOUTH AMERICA (CONMEBOL) ---
  'arjantin': 'ar', 'argentina': 'ar',
  'brezilya': 'br', 'brazil': 'br',
  'uruguay': 'uy',
  'kolombiya': 'co', 'colombia': 'co',
  'ekvador': 'ec', 'ecuador': 'ec',
  'sili': 'cl', 'chile': 'cl',
  'peru': 'pe',
  'paraguay': 'py',
  'venezuela': 've',
  'bolivya': 'bo', 'bolivia': 'bo',

  // --- NORTH & CENTRAL AMERICA (CONCACAF) ---
  'abd': 'us', 'usa': 'us', 'amerika': 'us', 'united states': 'us',
  'meksika': 'mx', 'mexico': 'mx',
  'kanada': 'ca', 'canada': 'ca',
  'panama': 'pa',
  'kosta rika': 'cr', 'costa rica': 'cr',
  'jamaika': 'jm', 'jamaica': 'jm',
  'honduras': 'hn',
  'el salvador': 'sv',
  'haiti': 'ht',
  'curacao': 'cw',

  // --- AFRICA (CAF) ---
  'fas': 'ma', 'morocco': 'ma',
  'senegal': 'sn',
  'tunus': 'tn', 'tunisia': 'tn',
  'cezayir': 'dz', 'algeria': 'dz',
  'misir': 'eg', 'egypt': 'eg',
  'nijerya': 'ng', 'nigeria': 'ng',
  'kamerun': 'cm', 'cameroon': 'cm',
  'fildisi sahili': 'ci', 'ivory coast': 'ci',
  'gana': 'gh', 'ghana': 'gh',
  'mali': 'ml',
  'guney afrika': 'za', 'south africa': 'za',
  'yesil burun': 'cv', 'yesil burun adalari': 'cv', 'cabo verde': 'cv', 'cape verde': 'cv',
  'angola': 'ao',
  'demokratik kongo cumhuriyeti': 'cd', 'dr congo': 'cd', 'kongo': 'cd',
  'gine': 'gn', 'guinea': 'gn',

  // --- ASIA (AFC) ---
  'japonya': 'jp', 'japan': 'jp',
  'guney kore': 'kr', 'south korea': 'kr',
  'iran': 'ir',
  'suudi arabistan': 'sa', 'saudi arabia': 'sa',
  'avustralya': 'au', 'australia': 'au',
  'ozbekistan': 'uz', 'uzbekistan': 'uz',
  'urdun': 'jo', 'jordan': 'jo',
  'katar': 'qa', 'qatar': 'qa',
  'irak': 'iq', 'iraq': 'iq',
  'bae': 'ae', 'uae': 'ae', 'birlesik arap emirlikleri': 'ae', 'united arab emirates': 'ae',
  'cin': 'cn', 'china': 'cn',
  'umman': 'om', 'oman': 'om',
  'bahreyn': 'bh', 'bahrain': 'bh',
  'suriye': 'sy', 'syria': 'sy',
  'filistin': 'ps', 'palestine': 'ps',
  'kirgizistan': 'kg', 'kyrgyzstan': 'kg',

  // --- OCEANIA (OFC) ---
  'yeni zelanda': 'nz', 'new zealand': 'nz',
  'solomon adalari': 'sb', 'solomon islands': 'sb'
};

export const PredictionCard: React.FC<PredictionCardProps> = React.memo(({
  match,
  initialPrediction,
  onPredict,
}) => {
  const [outcome, setOutcome] = useState<'home' | 'draw' | 'away' | null>(
    initialPrediction?.outcome || null
  );
  const [diff, setDiff] = useState<string>(
    initialPrediction ? String(Math.abs(initialPrediction.diff)) : ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(!!initialPrediction);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Saved value: son başarıyla kaydedilen tahmini takip eder
  const [savedPrediction, setSavedPrediction] = useState(initialPrediction || null);

  // initialPrediction değişirse (farklı maç render edilirse) state'i sıfırla
  useEffect(() => {
    setOutcome(initialPrediction?.outcome || null);
    setDiff(initialPrediction ? String(Math.abs(initialPrediction.diff)) : '');
    setIsSaved(!!initialPrediction);
    setSavedPrediction(initialPrediction || null);
    setSaveError(null);
  }, [match.id]);

  // Seçim değiştiğinde "kaydedildi" badge'ini kaldır (yeni tahmin bekleniyor)
  const handleSelectOutcome = (selected: 'home' | 'draw' | 'away') => {
    setOutcome(selected);
    if (selected === 'draw') setDiff('0');
    // Önceki tahmitten farklıysa kaydet badge'ini kaldır
    if (selected !== savedPrediction?.outcome) {
      setIsSaved(false);
      setSaveError(null);
    }
  };

  const handleDiffChange = (val: string) => {
    // Maksimum 20 ile sınırla
    const num = Math.min(20, Math.max(0, parseInt(val, 10) || 0));
    setDiff(String(num));
    if (num !== Math.abs(savedPrediction?.diff ?? -1)) {
      setIsSaved(false);
      setSaveError(null);
    }
  };

  const handleIncrement = () => {
    if (outcome === 'draw') return;
    const current = parseInt(diff, 10) || 0;
    if (current < 20) handleDiffChange(String(current + 1));
  };

  const handleDecrement = () => {
    if (outcome === 'draw') return;
    const current = parseInt(diff, 10) || 0;
    if (current > 0) handleDiffChange(String(current - 1));
  };

  const handleSave = async () => {
    if (!outcome || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const diffVal = outcome === 'draw' ? 0 : (parseInt(diff, 10) || 0);
      await onPredict(match.id, outcome, diffVal);
      setSavedPrediction({ outcome, diff: outcome === 'away' ? -diffVal : diffVal });
      setIsSaved(true);
    } catch (err: any) {
      setSaveError(err?.message || 'Tahmin kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };


  const normalizeTeamName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  };

  const translateToTurkish = (name: string): string => {
    const normalizedName = normalizeTeamName(name);
    return englishToTurkish[normalizedName] || name;
  };

  const renderFlag = (teamName: string) => {
    const normalized = normalizeTeamName(teamName);
    const code = countryCodes[normalized];
    const fallbackText = teamName.slice(0, 3).toUpperCase();
    
    return (
      <div className="w-full h-full relative bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center overflow-hidden">
        {/* Fallback initials */}
        <span className="font-mono font-black text-xs text-zinc-400 select-none">
          {fallbackText}
        </span>
        
        {code && (
          <img
            src={`https://flagcdn.com/w80/${code}.png`}
            alt={`${teamName}`}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.opacity = '0';
            }}
          />
        )}
      </div>
    );
  };

  const formattedDate = new Date(match.commence_time).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCompleted = match.status === 'completed';
  // Maç başlamış ama henüz tamamlanmamış → tahmin kilitli
  const isLocked = !isCompleted && new Date(match.commence_time).getTime() <= Date.now();

  return (
    <div className={`premium-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-full ${
      isCompleted ? 'border-l-4 border-l-emerald-500/80 shadow-[0_8px_32px_rgba(16,185,129,0.08)]' : ''
    }`}>
      {/* Decorative top header glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div>
        {/* Header Badges */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 tracking-wider uppercase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0"></span>
            <span>FIFA WORLD CUP</span>
          </div>

          <div>
            {isCompleted ? (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono">
                <CheckCircle className="w-2.5 h-2.5" /> TAMAMLANDI
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider font-mono pulse-active">
                <Clock className="w-2.5 h-2.5" /> BAŞLAMADI
              </span>
            )}
          </div>
        </div>

        {/* Date line */}
        <div className="text-[10px] text-zinc-500 font-mono mb-4 bg-zinc-950/20 py-1.5 px-3 rounded-lg border border-white/5 inline-block">
          {formattedDate}
        </div>

        {/* Teams Matchup Display Row */}
        <div className="grid grid-cols-7 items-center my-4 gap-2 border-y border-white/5 py-4.5">
          {/* Home Team */}
          <div className="col-span-3 flex flex-col items-center text-center">
            <div className="w-14 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner mb-2.5 relative">
              {renderFlag(match.home_team)}
            </div>
            <span className="text-xs font-bold tracking-wide uppercase text-zinc-200 truncate max-w-full">
              {translateToTurkish(match.home_team)}
            </span>
          </div>
          
          {/* VS / Score */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            {isCompleted ? (
              <div className="text-sm md:text-base font-mono font-black bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {match.home_score} - {match.away_score}
              </div>
            ) : (
              <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-widest px-2.5 py-1 bg-white/5 rounded-lg border border-white/5 uppercase">
                VS
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-3 flex flex-col items-center text-center">
            <div className="w-14 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner mb-2.5 relative">
              {renderFlag(match.away_team)}
            </div>
            <span className="text-xs font-bold tracking-wide uppercase text-zinc-200 truncate max-w-full">
              {translateToTurkish(match.away_team)}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction UI: 3 olası durum */}
      {isCompleted ? (
        /* Tamamlanmış maç sonucu */
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
            <div className="text-xs text-zinc-400 font-mono">
              Tahminin:{' '}
              <strong className="text-violet-400 font-bold uppercase">
                {outcome === 'home'
                  ? translateToTurkish(match.home_team)
                  : outcome === 'away'
                  ? translateToTurkish(match.away_team)
                  : outcome === 'draw'
                  ? 'Beraberlik'
                  : 'Yok'}{' '}
                {outcome !== 'draw' && outcome && `• ${diff} Fark`}
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md font-mono font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-[0_2px_10px_rgba(16,185,129,0.05)]">
                <CheckCircle className="w-3 h-3" /> HESAPLANDI
              </span>
            </div>
          </div>
        </div>
      ) : isLocked ? (
        /* Maç başlamış ama henüz tamamlanmamış — tahmin kilitli */
        <div className="mt-4">
          <div className="flex items-center gap-3 bg-zinc-950/50 border border-white/5 p-3.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">Tahmin Süresi Doldu</p>
              {outcome ? (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Tahminin:{' '}
                  <span className="text-violet-400 font-bold">
                    {outcome === 'home' ? translateToTurkish(match.home_team) : outcome === 'away' ? translateToTurkish(match.away_team) : 'Beraberlik'}
                    {outcome !== 'draw' && ` • ${Math.abs(parseInt(diff, 10) || 0)} Fark`}
                  </span>
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500 mt-0.5">Bu maç için tahmin yapmadın.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Aktif tahmin formu */
        <div className="space-y-4 mt-2">
          {/* Outcome Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectOutcome('home')}
              className={`py-3 px-2 rounded-xl border transition-all duration-300 text-xs flex flex-col items-center justify-center ${
                outcome === 'home'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white font-extrabold shadow-glow scale-[1.02]'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/30 hover:text-zinc-200'
              }`}
            >
              <span className="truncate max-w-full font-mono text-[9px] font-bold uppercase tracking-wider mb-1">{translateToTurkish(match.home_team)}</span>
              <span className="text-[9px] opacity-75 font-mono font-bold bg-black/30 px-1.5 py-0.5 rounded border border-white/5">Oran: {match.home_odd}</span>
            </button>

            <button
              onClick={() => handleSelectOutcome('draw')}
              className={`py-3 px-2 rounded-xl border transition-all duration-300 text-xs flex flex-col items-center justify-center ${
                outcome === 'draw'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white font-extrabold shadow-glow scale-[1.02]'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/30 hover:text-zinc-200'
              }`}
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider mb-1">Beraberlik</span>
              <span className="text-[9px] opacity-75 font-mono font-bold bg-black/30 px-1.5 py-0.5 rounded border border-white/5">Oran: {match.draw_odd}</span>
            </button>

            <button
              onClick={() => handleSelectOutcome('away')}
              className={`py-3 px-2 rounded-xl border transition-all duration-300 text-xs flex flex-col items-center justify-center ${
                outcome === 'away'
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500 text-white font-extrabold shadow-glow scale-[1.02]'
                  : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/30 hover:text-zinc-200'
              }`}
            >
              <span className="truncate max-w-full font-mono text-[9px] font-bold uppercase tracking-wider mb-1">{translateToTurkish(match.away_team)}</span>
              <span className="text-[9px] opacity-75 font-mono font-bold bg-black/30 px-1.5 py-0.5 rounded border border-white/5">Oran: {match.away_odd}</span>
            </button>
          </div>

          {/* Goal Difference Input */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/30 p-3.5 rounded-xl border border-white/5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-violet-400" /> GOL FARKI TAHMİNİ
              </label>
              <span className="text-[9px] text-zinc-500 block mt-0.5">Kazanan takımın atacağı gol farkı.</span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                type="button"
                disabled={outcome === 'draw' || !outcome}
                onClick={handleDecrement}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                type="number"
                min="0"
                max="20"
                disabled={outcome === 'draw' || !outcome}
                placeholder={outcome === 'draw' ? '0' : 'Fark'}
                className="bg-black/40 border border-white/10 hover:border-white/20 focus:border-violet-500 focus:outline-none rounded-lg px-2 py-1.5 text-sm text-center font-mono font-bold w-16 text-white disabled:opacity-40 disabled:pointer-events-none"
                value={diff}
                onChange={(e) => handleDiffChange(e.target.value)}
              />

              <button
                type="button"
                disabled={outcome === 'draw' || !outcome}
                onClick={handleIncrement}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── KAYDET BUTONU ── */}
          <div className="pt-1 space-y-2">
            {/* Hata mesajı */}
            {saveError && (
              <div className="flex items-center gap-2 text-red-400 text-[10px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {saveError}
              </div>
            )}

            <button
              type="button"
              disabled={!outcome || isSaving || isSaved}
              onClick={handleSave}
              className={`w-full py-3 rounded-xl font-bold text-sm font-mono tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                isSaved
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
                  : !outcome
                  ? 'bg-white/5 border border-white/5 text-zinc-600 cursor-not-allowed'
                  : 'neon-btn-primary text-white'
              }`}
            >
              {isSaving ? (
                <>
                  {/* Küçük spinner */}
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  <span>Kaydediliyor...</span>
                </>
              ) : isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Tahmin Kaydedildi ✓</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{outcome ? 'Tahminini Kaydet' : 'Önce Bir Sonuç Seç'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

