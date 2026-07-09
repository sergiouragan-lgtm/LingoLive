import React, { useState, useMemo } from 'react';
import { 
  Globe, Users, BookOpen, MapPin, Sparkles, 
  TrendingUp, Award, ArrowRight, CheckCircle2, Search, Filter 
} from 'lucide-react';

interface CountryData {
  id: string;
  name: string;
  flag: string;
  studentsCount: number;
  avgGrade: number;
  avgAttendance: number;
  avgXp: number;
  languages: { name: string; students: number; percentage: number }[];
  topStudents: { name: string; level: string; grade: number }[];
  aiInsight: string;
  // Relative positioning on a 1000x500 canvas
  x: number;
  y: number;
}

// Complete mock data set for geographic distribution
const countriesData: CountryData[] = [
  {
    id: 'AO',
    name: 'Angola',
    flag: '🇦🇴',
    studentsCount: 380,
    avgGrade: 83.2,
    avgAttendance: 94.1,
    avgXp: 1850,
    languages: [
      { name: 'Inglês', students: 240, percentage: 63 },
      { name: 'Francês', students: 90, percentage: 24 },
      { name: 'Mandarim', students: 50, percentage: 13 },
    ],
    topStudents: [
      { name: 'Emanuel Neto', level: 'A1', grade: 92 },
      { name: 'Aline Cassinda', level: 'B1', grade: 78 },
      { name: 'Suzana Diogo', level: 'B1', grade: 58 }
    ],
    aiInsight: 'Angola continua sendo o hub principal de captação. Há um crescimento de 24% na busca por Mandarim corporativo, estimulado pelas novas parcerias logísticas locais.',
    x: 520,
    y: 320,
  },
  {
    id: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    studentsCount: 45,
    avgGrade: 86.5,
    avgAttendance: 95.8,
    avgXp: 2100,
    languages: [
      { name: 'Inglês', students: 30, percentage: 67 },
      { name: 'Alemão', students: 15, percentage: 33 },
    ],
    topStudents: [
      { name: 'Beatriz Gonga', level: 'B2', grade: 88 },
      { name: 'Carlos de Sousa', level: 'A2', grade: 71 }
    ],
    aiInsight: 'Crescimento constante de alunos residentes. A alta média acadêmica (86.5%) sugere excelente adaptação às simulações orais guiadas.',
    x: 440,
    y: 170,
  },
  {
    id: 'BR',
    name: 'Brasil',
    flag: '🇧🇷',
    studentsCount: 28,
    avgGrade: 81.0,
    avgAttendance: 92.4,
    avgXp: 1650,
    languages: [
      { name: 'Inglês', students: 20, percentage: 71 },
      { name: 'Francês', students: 8, percentage: 29 },
    ],
    topStudents: [
      { name: 'Mateus Silva', level: 'B2', grade: 82 },
      { name: 'Mariana Costa', level: 'A2', grade: 80 }
    ],
    aiInsight: 'Nível elevado de engajamento no aplicativo móvel. Recomendado promover eventos de conversação em grupo aos fins de semana para este fuso horário.',
    x: 290,
    y: 330,
  },
  {
    id: 'UK',
    name: 'Reino Unido',
    flag: '🇬🇧',
    studentsCount: 15,
    avgGrade: 89.2,
    avgAttendance: 96.0,
    avgXp: 2350,
    languages: [
      { name: 'Português', students: 10, percentage: 67 },
      { name: 'Espanhol', students: 5, percentage: 33 },
    ],
    topStudents: [
      { name: 'John Doe', level: 'C1', grade: 94 },
      { name: 'Emily Rose', level: 'B1', grade: 85 }
    ],
    aiInsight: 'Foco acentuado no aprendizado de Português para Negócios. Alta proficiência média (C1) e engajamento constante nos módulos avançados.',
    x: 435,
    y: 120,
  },
  {
    id: 'US',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    studentsCount: 12,
    avgGrade: 88.0,
    avgAttendance: 93.5,
    avgXp: 1980,
    languages: [
      { name: 'Português', students: 8, percentage: 67 },
      { name: 'Espanhol', students: 4, percentage: 33 },
    ],
    topStudents: [
      { name: 'James Carter', level: 'A2', grade: 89 },
      { name: 'Sarah Connor', level: 'B2', grade: 87 }
    ],
    aiInsight: 'Interesse crescente de alunos expatriados buscando reconexão linguística. Adoção de tutor de IA atingiu 98% de satisfação no fuso horário local.',
    x: 180,
    y: 160,
  },
  {
    id: 'FR',
    name: 'França',
    flag: '🇫🇷',
    studentsCount: 18,
    avgGrade: 84.7,
    avgAttendance: 95.0,
    avgXp: 1720,
    languages: [
      { name: 'Inglês', students: 12, percentage: 67 },
      { name: 'Português', students: 6, percentage: 33 },
    ],
    topStudents: [
      { name: 'Chantal Dupont', level: 'B1', grade: 86 },
      { name: 'Pierre Simon', level: 'A1', grade: 83 }
    ],
    aiInsight: 'Alunos demonstram forte engajamento em testes de Listening. Recomendado reforçar lições de Writing para o exame de certificação europeia.',
    x: 460,
    y: 155,
  },
  {
    id: 'CN',
    name: 'China',
    flag: '🇨🇳',
    studentsCount: 10,
    avgGrade: 91.5,
    avgAttendance: 98.2,
    avgXp: 2800,
    languages: [
      { name: 'Português', students: 6, percentage: 60 },
      { name: 'Inglês', students: 4, percentage: 40 },
    ],
    topStudents: [
      { name: 'Wei Zhang', level: 'C1', grade: 95 },
      { name: 'Li Na', level: 'B2', grade: 89 }
    ],
    aiInsight: 'Excelente consistência de estudo autónomo. XP acumulado 50% superior à média geral. Foco principal em comércio bilateral e vocabulário aduaneiro.',
    x: 770,
    y: 200,
  },
  {
    id: 'MZ',
    name: 'Moçambique',
    flag: '🇲🇿',
    studentsCount: 165,
    avgGrade: 84.5,
    avgAttendance: 93.8,
    avgXp: 1910,
    languages: [
      { name: 'Inglês', students: 110, percentage: 67 },
      { name: 'Português', students: 35, percentage: 21 },
      { name: 'Mandarim', students: 20, percentage: 12 },
    ],
    topStudents: [
      { name: 'Sérgio Macuácua', level: 'B2', grade: 91 },
      { name: 'Isabel Mondlane', level: 'A2', grade: 84 }
    ],
    aiInsight: 'Adoção excelente de podcasts de Listening móvel. Demanda crescente por certificações corporativas de Inglês e parcerias estratégicas em Maputo e Beira.',
    x: 555,
    y: 365,
  }
];

interface GeographicIntelligenceMapProps {
  onCountrySelect?: (countryName: string) => void;
  selectedCountryName?: string;
}

export function GeographicIntelligenceMap({ onCountrySelect, selectedCountryName }: GeographicIntelligenceMapProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);

  // Set default country on load
  React.useEffect(() => {
    if (!selectedCountry) {
      const initial = countriesData.find(c => c.name.toLowerCase() === 'moçambique') || countriesData[0];
      setSelectedCountry(initial);
    }
  }, []);

  // Sync selection from props
  React.useEffect(() => {
    if (selectedCountryName) {
      const found = countriesData.find(c => c.name.toLowerCase() === selectedCountryName.toLowerCase());
      if (found) {
        setSelectedCountry(found);
      }
    }
  }, [selectedCountryName]);

  // Filter countries data based on selected target language
  const filteredCountries = useMemo(() => {
    if (selectedLanguage === 'all') return countriesData;
    return countriesData.map(country => {
      const hasLang = country.languages.some(l => l.name === selectedLanguage);
      return {
        ...country,
        // Reduce opacity or visual indicator if country does not have this target language
        isActiveForLanguage: hasLang
      };
    });
  }, [selectedLanguage]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalStudents = 0;
    const langMap: Record<string, number> = {};

    countriesData.forEach(c => {
      totalStudents += c.studentsCount;
      c.languages.forEach(l => {
        langMap[l.name] = (langMap[l.name] || 0) + l.students;
      });
    });

    const langBreakdown = Object.entries(langMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalStudents) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      totalStudents,
      totalCountries: countriesData.length,
      langBreakdown
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="geo-intel-map-root">
      {/* Header section */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
        <div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 w-max">
            <Globe size={11} className="animate-spin-slow" />
            <span>Distribuição Geográfica Global</span>
          </span>
          <h3 className="text-base font-extrabold text-slate-800 mt-2">Geographic Intelligence Hub</h3>
          <p className="text-xs text-slate-400">Distribuição física e fluxo de idiomas dos alunos matriculados ao redor do globo.</p>
        </div>

        {/* Target language quick filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter size={13} />
            <span>Filtrar Idioma de Destino:</span>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {['all', 'Inglês', 'Francês', 'Português', 'Mandarim'].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLanguage(lang);
                  // Reset country selection if it doesn't match the new language to avoid confusion
                  if (lang !== 'all' && selectedCountry) {
                    const hasLang = selectedCountry.languages.some(l => l.name === lang);
                    if (!hasLang) {
                      const match = countriesData.find(c => c.languages.some(l => l.name === lang));
                      setSelectedCountry(match || null);
                    }
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  (selectedLanguage === lang) 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'all' ? 'Todos' : lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Summary metrics & language breakdown */}
        <div className="p-5 border-r border-slate-100 lg:col-span-3 bg-slate-50/30 flex flex-col justify-between">
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Métricas de Conectividade</h4>
            
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Alunos Ativos</p>
                  <p className="text-lg font-black text-slate-800">{stats.totalStudents}</p>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Países Conectados</p>
                  <p className="text-lg font-black text-slate-800">{stats.totalCountries}</p>
                </div>
              </div>
            </div>

            {/* Language Breakdown progression list */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <BookOpen size={12} />
                <span>Idiomas mais Estudados</span>
              </h5>
              
              <div className="space-y-2.5">
                {stats.langBreakdown.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <span className="font-mono text-slate-500 font-semibold">{item.count} alunos ({item.percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-indigo-500' :
                          index === 1 ? 'bg-emerald-500' :
                          index === 2 ? 'bg-amber-500' : 'bg-slate-400'
                        }`} 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                <Sparkles size={14} className="animate-pulse text-indigo-500" />
                <span>Visualização Ativa</span>
              </div>
              <p className="text-[10px] text-indigo-600 mt-1 leading-relaxed">
                Clique nos pins do mapa para extrair o perfil socioeducativo do país com recomendações personalizadas da IA.
              </p>
            </div>
          </div>
        </div>

        {/* Middle Area: Interactive Vector Map Projection */}
        <div className="lg:col-span-6 relative bg-slate-900 flex flex-col justify-between p-4 min-h-[350px] md:min-h-[450px]">
          {/* Map info bar */}
          <div className="flex justify-between items-center z-10">
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase font-mono">
              Vector Map Projection • WGS84 Centered
            </span>
            {hoveredCountry && (
              <div className="bg-slate-800 text-white border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 animate-fade-in">
                <span>{hoveredCountry.flag}</span>
                <span className="text-slate-200">{hoveredCountry.name}:</span>
                <span className="text-indigo-400">{hoveredCountry.studentsCount} alunos</span>
              </div>
            )}
          </div>

          {/* SVG Map Container */}
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center my-auto py-4">
            <svg 
              viewBox="0 0 1000 500" 
              className="w-full h-auto max-w-full opacity-80 select-none transition-all duration-300"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Modern Grid Background representing Latitude / Longitude lines */}
              <g stroke="rgba(71, 85, 105, 0.2)" strokeWidth="0.5" fill="none">
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" />
                ))}
                {Array.from({ length: 5 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} />
                ))}
              </g>

              {/* Stylized Simplified Continents */}
              <g fill="#1E293B" stroke="#334155" strokeWidth="1" className="transition-all duration-300">
                {/* North America */}
                <path d="M 120 70 L 260 70 L 300 120 L 250 180 L 190 200 L 170 240 L 150 240 L 120 180 L 100 140 Z" />
                {/* Greenland */}
                <path d="M 320 30 L 400 30 L 370 80 L 330 70 Z" fill="#0F172A" />
                {/* South America */}
                <path d="M 230 250 L 310 270 L 330 330 L 300 420 L 270 470 L 250 450 L 240 370 L 220 290 Z" />
                {/* Eurasia (Europe + Asia) */}
                <path d="M 390 130 L 480 80 L 650 80 L 850 80 L 920 130 L 940 180 L 880 260 L 840 280 L 760 310 L 710 280 L 610 240 L 530 220 L 480 230 L 400 200 L 370 170 Z" />
                {/* Africa */}
                <path d="M 420 220 L 480 210 L 540 230 L 580 280 L 530 390 L 500 450 L 480 450 L 460 380 L 430 330 L 400 280 Z" />
                {/* Australia */}
                <path d="M 800 360 L 880 350 L 910 400 L 860 440 L 780 400 Z" />
                {/* Island groups / Madagascar */}
                <circle cx="560" cy="380" r="4" />
                {/* Japan */}
                <path d="M 890 140 L 910 170 L 895 200 Z" />
                {/* Iceland */}
                <circle cx="380" cy="70" r="5" fill="#0F172A" />
              </g>

              {/* Dynamic Interactive Glowing Country Markers */}
              {filteredCountries.map((country) => {
                const isSelected = selectedCountry?.id === country.id;
                const isHovered = hoveredCountry?.id === country.id;
                
                // Determine active state based on language filter
                const matchesLanguage = selectedLanguage === 'all' || country.languages.some(l => l.name === selectedLanguage);
                const opacityStyle = matchesLanguage ? 'opacity-100 scale-100' : 'opacity-30 scale-75';

                return (
                  <g 
                    key={country.id}
                    className={`cursor-pointer transition-all duration-300 ${opacityStyle}`}
                    onClick={() => {
                      setSelectedCountry(country);
                      onCountrySelect?.(country.name);
                    }}
                    onMouseEnter={() => setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    {/* Pulsing ring behind selected or hovered pins */}
                    {(isSelected || isHovered) && (
                      <>
                        <circle 
                          cx={country.x} 
                          cy={country.y} 
                          r="25" 
                          fill="none" 
                          stroke={isSelected ? '#6366F1' : '#F59E0B'} 
                          strokeWidth="1"
                          className="animate-ping opacity-25"
                        />
                        <circle 
                          cx={country.x} 
                          cy={country.y} 
                          r="14" 
                          fill={isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(245, 158, 11, 0.2)'}
                        />
                      </>
                    )}

                    {/* Outer circle pin marker */}
                    <circle 
                      cx={country.x} 
                      cy={country.y} 
                      r={isSelected ? '9' : '7'} 
                      fill={matchesLanguage ? (isSelected ? '#6366F1' : '#10B981') : '#64748B'}
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                      className="shadow-md transition-all duration-350"
                    />

                    {/* Small inner dot */}
                    <circle 
                      cx={country.x} 
                      cy={country.y} 
                      r="2.5" 
                      fill="#FFFFFF"
                    />

                    {/* Text labels for countries on map */}
                    <text
                      x={country.x}
                      y={country.y - 14}
                      textAnchor="middle"
                      fill={isSelected ? '#818CF8' : '#94A3B8'}
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none select-none font-sans"
                    >
                      {country.name} ({country.studentsCount})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map legend bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 z-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white" />
                <span>Selecionado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                <span>Alunos Ativos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-500 rounded-full border border-white" />
                <span>Inativo p/ Filtro</span>
              </div>
            </div>
            <span>Clique nos círculos para inspecionar</span>
          </div>
        </div>

        {/* Right Side: Detailed Country Analytics profile & AI recommendations */}
        <div className="p-5 lg:col-span-3 bg-white flex flex-col justify-between">
          {selectedCountry ? (
            <div className="space-y-4 animate-fade-in">
              {/* Selected Country Flag and Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedCountry.flag}</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">{selectedCountry.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Região Estratégica</p>
                  </div>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                  {selectedCountry.id}
                </span>
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Média Geral</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{selectedCountry.avgGrade}%</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Presença</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{selectedCountry.avgAttendance}%</p>
                </div>
              </div>

              {/* Target Languages inside this country */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Idiomas Alvo Regionais</h5>
                <div className="space-y-1.5 text-[11px]">
                  {selectedCountry.languages.map((l, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg">
                      <span className="font-bold text-slate-700">{l.name}</span>
                      <span className="font-mono text-indigo-600 font-extrabold">{l.students} alunos ({l.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Students in selected Country */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Líderes Académicos</h5>
                <div className="space-y-1.5">
                  {selectedCountry.topStudents.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] border-b border-slate-50 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold">
                          {st.level}
                        </span>
                        <span className="font-semibold text-slate-700">{st.name}</span>
                      </div>
                      <span className="font-bold text-emerald-600">{st.grade}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intelligent AI Recommendation Insight for Director */}
              <div className="p-3 bg-indigo-950 text-white rounded-xl border border-indigo-900 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 translate-x-3 -translate-y-3">
                  <Sparkles size={60} />
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <Sparkles size={11} className="animate-pulse" />
                  <span>Diretiva de Inteligência</span>
                </div>
                <p className="text-[11px] text-indigo-200 mt-1 leading-relaxed">
                  {selectedCountry.aiInsight}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12 bg-slate-50/20 rounded-2xl border border-dashed border-slate-200">
              <Globe size={32} className="text-slate-300 animate-pulse mb-3" />
              <h4 className="font-bold text-slate-700 text-xs">Selecione um País</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">
                Selecione qualquer ponto no mapa ao lado para gerar o relatório consolidado de rendimento.
              </p>
            </div>
          )}

          {/* Action button to export geographic metrics */}
          <div className="border-t border-slate-100 pt-3 mt-4">
            <button
              onClick={() => {
                alert(`Exportando dossiê de distribuição demográfica de alunos (${selectedCountry?.name || 'Geral'})...`);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
            >
              <span>Exportar Dados Geográficos</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
