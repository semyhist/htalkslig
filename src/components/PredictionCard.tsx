import { useState } from 'react';
import { Plus, Minus, CheckCircle, Clock, Award, Lock } from 'lucide-react';

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
  onPredict: (matchId: string, outcome: 'home' | 'draw' | 'away', diff: number) => void;
}

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

export const PredictionCard: React.FC<PredictionCardProps> = ({
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

  const handleSelectOutcome = (selected: 'home' | 'draw' | 'away') => {
    setOutcome(selected);
    const diffVal = selected === 'draw' ? 0 : (parseInt(diff, 10) || 0);
    if (selected === 'draw') setDiff('0');
    onPredict(match.id, selected, diffVal);
  };

  const handleDiffChange = (val: string) => {
    setDiff(val);
    if (outcome) {
      const diffVal = outcome === 'draw' ? 0 : (parseInt(val, 10) || 0);
      onPredict(match.id, outcome, diffVal);
    }
  };

  const handleIncrement = () => {
    if (outcome === 'draw') return;
    const current = parseInt(diff, 10) || 0;
    const nextVal = String(current + 1);
    handleDiffChange(nextVal);
  };

  const handleDecrement = () => {
    if (outcome === 'draw') return;
    const current = parseInt(diff, 10) || 0;
    if (current > 0) {
      const nextVal = String(current - 1);
      handleDiffChange(nextVal);
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
              {match.home_team}
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
              {match.away_team}
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
                  ? match.home_team
                  : outcome === 'away'
                  ? match.away_team
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
                    {outcome === 'home' ? match.home_team : outcome === 'away' ? match.away_team : 'Beraberlik'}
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
              <span className="truncate max-w-full font-mono text-[9px] font-bold uppercase tracking-wider mb-1">{match.home_team}</span>
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
              <span className="truncate max-w-full font-mono text-[9px] font-bold uppercase tracking-wider mb-1">{match.away_team}</span>
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
        </div>
      )}
    </div>
  );
};

