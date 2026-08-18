import React from 'react';
import { AppView } from '../../types';
import { Bot, Gamepad2, TrendingUp, Award } from 'lucide-react';

export const Landing: React.FC<{ setView: (view: AppView) => void }> = ({ setView }) => (
    <div className="flex flex-col items-center min-h-screen bg-white">
        <div className="flex flex-col items-center justify-center pt-20 pb-16 p-6 text-center bg-slate-50 w-full">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                Aprenda Inglês com IA por apenas $1 nos primeiros 7 dias
            </div>
            <h1 className="text-5xl font-bold mb-6 text-slate-900 font-heading">Aprenda Idiomas com IA</h1>
            <p className="text-xl mb-10 text-slate-600 max-w-lg">Uma plataforma inteligente que ensina idiomas através de IA, jogos e aprendizagem personalizada.</p>
            <div className="flex gap-4">
                <button onClick={() => setView('onboarding')} className="bg-primary text-white px-10 py-4 rounded-full font-semibold text-lg hover:bg-primary/90 transition shadow-lg">Começar Gratuitamente</button>
                <button onClick={() => setView('school-registration')} className="bg-white text-slate-900 px-10 py-4 rounded-full font-semibold text-lg hover:bg-slate-100 transition shadow-sm border border-slate-200">Para Escolas</button>
            </div>
        </div>

        <div className="max-w-6xl w-full py-16 px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Por que escolher LingoLIVE IA?</h2>
            <div className="grid md:grid-cols-4 gap-8">
                {[
                    { icon: Bot, title: "Tutor IA 24h", desc: "Pratique conversação e tire dúvidas a qualquer hora." },
                    { icon: Gamepad2, title: "Jogos Educativos", desc: "Aprenda brincando com nossos desafios diários." },
                    { icon: TrendingUp, title: "Evolua de Nível", desc: "Acompanhe seu progresso personalizado." },
                    { icon: Award, title: "Certificados", desc: "Conquiste certificados conforme avança." }
                ].map((item, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-2xl flex flex-col items-center text-center">
                        <item.icon className="w-12 h-12 text-primary mb-4" />
                        <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                        <p className="text-slate-600 text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Footer with Compliance Links */}
        <footer className="w-full bg-slate-50 border-t border-slate-200 py-12 mt-auto">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start gap-1">
                    <p className="text-sm font-semibold text-slate-900">© 2026 LingoLIVE IA</p>
                    <p className="text-xs text-slate-500">Aprenda inglês de forma acelerada com o poder da Inteligência Artificial.</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6">
                    <button
                        onClick={() => setView('privacy-policy')}
                        className="text-xs font-bold text-slate-600 hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
                        id="footer-privacy-btn"
                    >
                        <span>Política de Privacidade (GDPR & LGPD)</span>
                    </button>
                    <span className="text-slate-300 hidden md:inline">|</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        ISO 27001 Compliant
                    </span>
                </div>
            </div>
        </footer>
    </div>
);
