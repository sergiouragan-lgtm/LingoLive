import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Delete } from 'lucide-react';

type GateStep = 'intro' | 'create' | 'success' | 'verify';

interface KidsParentGateProps {
  onAuthenticated: () => void;
  onClose: () => void;
}

const PIN_STORAGE_KEY = 'lingolive_parent_pin';
const PIN_LENGTH = 4;

function PinDots({ filled, shake }: { filled: number; shake: boolean }) {
  return (
    <motion.div
      className="flex gap-4 justify-center my-6"
      animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
      transition={{ duration: 0.35 }}
    >
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ scale: i === filled - 1 ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.15 }}
          className="w-4 h-4 rounded-full border-2"
          style={{
            background: i < filled ? '#7C3AED' : 'transparent',
            borderColor: i < filled ? '#7C3AED' : '#D1D5DB',
          }}
        />
      ))}
    </motion.div>
  );
}

function Numpad({ onPress, onDelete }: { onPress: (n: string) => void; onDelete: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','del'];
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {keys.map((k, i) => {
        if (k === '') return <div key={i} />;
        if (k === 'del') return (
          <motion.button
            key="del"
            whileTap={{ scale: 0.88 }}
            onClick={onDelete}
            className="h-14 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-600 font-bold text-lg shadow-sm"
          >
            <Delete className="w-5 h-5" />
          </motion.button>
        );
        return (
          <motion.button
            key={k}
            whileTap={{ scale: 0.88 }}
            onClick={() => onPress(k)}
            className="h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-slate-800 bg-white shadow-sm border border-gray-100"
            style={{ boxShadow: '0 2px 0 #D1D5DB' }}
          >
            {k}
          </motion.button>
        );
      })}
    </div>
  );
}

export const KidsParentGate: React.FC<KidsParentGateProps> = ({ onAuthenticated, onClose }) => {
  const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
  const hasPin = !!storedPin;

  const [step, setStep] = useState<GateStep>(hasPin ? 'verify' : 'intro');
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleKey = useCallback((k: string) => {
    setErrorMsg('');
    setPin(prev => prev.length < PIN_LENGTH ? prev + k : prev);
  }, []);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  useEffect(() => {
    if (step === 'create' && pin.length === PIN_LENGTH) {
      localStorage.setItem(PIN_STORAGE_KEY, pin);
      setPin('');
      setStep('success');
    }
    if (step === 'verify' && pin.length === PIN_LENGTH) {
      if (pin === storedPin) {
        setTimeout(onAuthenticated, 200);
      } else {
        setShake(true);
        setErrorMsg('PIN incorreto. Tenta novamente.');
        setTimeout(() => { setShake(false); setPin(''); }, 600);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, step]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
          style={{ zIndex: 10 }}
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {/* ── INTRO ─────────────────────────────────── */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-8 py-10 flex flex-col items-center text-center gap-4"
            >
              <div className="text-[80px] leading-none animate-kids-float">🔒</div>
              <h2 className="font-display font-extrabold text-slate-800 text-2xl">Área dos Pais</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Esta área é protegida. Cria um PIN secreto para continuar.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('create')}
                className="w-full py-4 rounded-2xl font-display font-extrabold text-white text-lg mt-2"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', boxShadow: '0 4px 0 #5B21B6' }}
              >
                Continuar
              </motion.button>
            </motion.div>
          )}

          {/* ── CREATE PIN ────────────────────────────── */}
          {step === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="px-6 pt-12 pb-8"
            >
              <h2 className="font-display font-extrabold text-slate-800 text-xl text-center">Criar PIN secreto</h2>
              <PinDots filled={pin.length} shake={shake} />
              <Numpad onPress={handleKey} onDelete={handleDelete} />
            </motion.div>
          )}

          {/* ── SUCCESS ───────────────────────────────── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="px-8 py-10 flex flex-col items-center text-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="text-[80px] leading-none"
              >
                ⭐
              </motion.div>
              <h2 className="font-display font-extrabold text-slate-800 text-2xl">PIN criado!</h2>
              <p className="text-gray-500 text-sm">Guarda bem o teu PIN secreto.</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAuthenticated}
                className="w-full py-4 rounded-2xl font-display font-extrabold text-white text-lg mt-2"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', boxShadow: '0 4px 0 #5B21B6' }}
              >
                Ir para as Definições
              </motion.button>
            </motion.div>
          )}

          {/* ── VERIFY PIN ────────────────────────────── */}
          {step === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="px-6 pt-12 pb-8"
            >
              <h2 className="font-display font-extrabold text-slate-800 text-xl text-center">Introduz o PIN</h2>
              <PinDots filled={pin.length} shake={shake} />
              {errorMsg && (
                <p className="text-center text-red-500 text-xs mb-2">{errorMsg}</p>
              )}
              <Numpad onPress={handleKey} onDelete={handleDelete} />
              <button
                onClick={() => { localStorage.removeItem(PIN_STORAGE_KEY); setPin(''); setStep('intro'); }}
                className="w-full mt-4 text-center text-xs text-gray-400 hover:text-gray-600"
              >
                Esqueci o PIN — repor
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
