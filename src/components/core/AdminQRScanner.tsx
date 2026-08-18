import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, Scan, Info, Camera, Sparkles, Check, AlertCircle } from 'lucide-react';

interface AdminQRScannerProps {
  onScanSuccess: (text: string) => void;
  onScanError?: (error: any) => void;
  onClose?: () => void;
}

export const AdminQRScanner: React.FC<AdminQRScannerProps> = ({
  onScanSuccess,
  onScanError,
  onClose
}) => {
  const [cameraState, setCameraState] = useState<'scanning' | 'permission-denied' | 'error' | 'simulated'>('scanning');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Predefined demo admin keys that can be simulated/copied
  const demoKeys = [
    { name: "Chave Mestra Local", key: "AdminSecret2026!" },
    { name: "Chave de Demonstração", key: "LingoLiveAdminAccess" }
  ];

  const handleSimulatedScan = (keyText: string) => {
    onScanSuccess(keyText);
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden relative" id="admin-qr-scanner-wrapper">
      {/* Dynamic Laser scanner line css */}
      <style>{`
        @keyframes laser-sweep {
          0%, 100% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
          50% { opacity: 1; box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <QrCode className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold tracking-wider uppercase text-slate-300">Scanner de Alta Precisão</h4>
            <p className="text-[10px] text-slate-400">Posicionamento inteligente guiado por IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cameraState === 'scanning' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="text-[10px] text-slate-400 font-mono capitalize">{cameraState === 'scanning' ? 'Live Cam' : 'Simulado'}</span>
        </div>
      </div>

      {/* Main scanner container with high-contrast target area overlay */}
      <div className="relative aspect-video sm:h-52 w-full bg-black rounded-xl overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
        {/* Real camera scanner or error view */}
        {cameraState !== 'simulated' ? (
          <div className="absolute inset-0 w-full h-full z-10">
            <Scanner
              onResult={(result) => {
                if (result) {
                  onScanSuccess(result.getText());
                }
              }}
              onError={(err) => {
                console.warn("Camera QR Scanner error or permission denied:", err);
                setErrorMessage(err?.message || "Não foi possível aceder à câmara.");
                setCameraState('permission-denied');
                if (onScanError) onScanError(err);
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-xs font-bold text-slate-300">Modo de Simulação Ativo</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[240px]">
              Use as chaves de simulação rápida abaixo para validar as credenciais de administrador instantaneamente.
            </p>
          </div>
        )}

        {/* High-Contrast Target Grid & Overlay (Z-Index 20) */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
          {/* Top Mask / Vignette */}
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px]" />

          {/* Centered High Contrast Frame Target Area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-44 sm:h-44 border border-indigo-500/30 rounded-2xl flex items-center justify-center pointer-events-auto">
            
            {/* Pulsing Scan corner markers */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl animate-pulse" style={{ animation: 'pulse-glow 2s infinite' }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl animate-pulse" style={{ animation: 'pulse-glow 2s infinite' }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl animate-pulse" style={{ animation: 'pulse-glow 2s infinite' }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl animate-pulse" style={{ animation: 'pulse-glow 2s infinite' }} />

            {/* Glowing Laser line */}
            <div 
              className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.8)] pointer-events-none" 
              style={{
                animation: 'laser-sweep 2.4s infinite ease-in-out'
              }}
            />

            {/* Center target cursor */}
            <Scan className="w-10 h-10 text-indigo-400/20" />
          </div>

          {/* Quick Guidance Alert overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700/60 rounded-full px-3 py-1 flex items-center gap-1.5 backdrop-blur-md">
            <Info className="w-3 h-3 text-indigo-400" />
            <span className="text-[9px] font-bold text-slate-300 tracking-wide uppercase">Alinhe o QR Code</span>
          </div>
        </div>
      </div>

      {/* Permission denied or browser camera block fallback UI */}
      {cameraState === 'permission-denied' && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed">
              <p className="font-bold">Câmara Indisponível ou Bloqueada</p>
              <p className="opacity-85 mt-0.5">As restrições de segurança do iframe ou as permissões do browser podem bloquear o acesso direto à câmara.</p>
              <button 
                type="button" 
                onClick={() => setCameraState('simulated')} 
                className="mt-2 text-indigo-300 hover:text-indigo-100 font-extrabold underline flex items-center gap-1"
              >
                Ativar simulador de leitura credencial &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Scanner Options - Perfect for high-reliability scans */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credenciais Rápidas de Teste</span>
          <button
            type="button"
            onClick={() => setCameraState(cameraState === 'simulated' ? 'scanning' : 'simulated')}
            className="text-[9px] font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Camera className="w-3 h-3" />
            {cameraState === 'simulated' ? 'Usar Câmara Real' : 'Usar Simulador'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {demoKeys.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSimulatedScan(item.key)}
              className="flex items-center justify-between p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 rounded-xl hover:border-indigo-500/50 transition-all text-left group"
            >
              <div className="truncate pr-1">
                <span className="block text-[9px] font-bold text-slate-300 truncate">{item.name}</span>
                <span className="block text-[8px] text-slate-500 font-mono truncate">{item.key}</span>
              </div>
              <div className="p-1 bg-slate-700/30 rounded-lg group-hover:bg-indigo-500/10 text-slate-400 group-hover:text-indigo-400 transition-colors">
                <Check className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
