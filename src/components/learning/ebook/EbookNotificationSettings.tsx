import React, { useEffect, useState } from "react";
import { Bell, BellOff, BookOpen, TrendingUp, RefreshCw, CheckCircle } from "lucide-react";
import { auth } from "../../../firebase";

interface NotificationPrefs {
  studentId: string;
  studyReminders: boolean;
  reminderHour: number;
  newEbookAlerts: boolean;
  progressMilestones: boolean;
  fcmTokens: string[];
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(`/api/ebook/notifications${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg mt-0.5 ${checked ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
          <Icon className={`w-4 h-4 ${checked ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}

export function EbookNotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch("/preferences")
      .then((d) => setPrefs(d.prefs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updatePref = async (key: keyof NotificationPrefs, value: unknown) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/preferences", {
        method: "PUT",
        body: JSON.stringify({ [key]: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setPrefs(prefs); // rollback
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm p-4">
        <RefreshCw className="w-4 h-4 animate-spin" />
        A carregar preferências...
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Notificações</h3>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <RefreshCw className="w-3 h-3 animate-spin" />
            A guardar...
          </div>
        )}
        {saved && !saving && (
          <div className="flex items-center gap-1.5 text-green-600 text-xs">
            <CheckCircle className="w-3 h-3" />
            Guardado
          </div>
        )}
      </div>

      <Toggle
        checked={prefs.studyReminders}
        onChange={(v) => updatePref("studyReminders", v)}
        label="Lembretes de Estudo"
        description="Receba uma notificação diária para manter a consistência de leitura."
        icon={Bell}
      />

      {prefs.studyReminders && (
        <div className="ml-11 pb-4 border-b border-gray-100 dark:border-gray-700">
          <label className="text-xs text-gray-500 dark:text-gray-400">
            Hora do lembrete
          </label>
          <input
            type="range"
            min={0}
            max={23}
            value={prefs.reminderHour}
            onChange={(e) => updatePref("reminderHour", parseInt(e.target.value, 10))}
            className="w-full mt-1 accent-indigo-600"
          />
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
            {String(prefs.reminderHour).padStart(2, "0")}:00 UTC
            {(() => {
              const offsetH = -(new Date().getTimezoneOffset() / 60);
              const localH = ((prefs.reminderHour + offsetH) % 24 + 24) % 24;
              if (offsetH === 0) return null;
              return (
                <span className="ml-1.5 text-gray-400 font-normal">
                  ({String(Math.floor(localH)).padStart(2, "0")}:{String(0).padStart(2, "0")} local)
                </span>
              );
            })()}
          </p>
        </div>
      )}

      <Toggle
        checked={prefs.newEbookAlerts}
        onChange={(v) => updatePref("newEbookAlerts", v)}
        label="Novos E-books"
        description="Seja notificado quando novos e-books forem publicados na plataforma."
        icon={BookOpen}
      />

      <Toggle
        checked={prefs.progressMilestones}
        onChange={(v) => updatePref("progressMilestones", v)}
        label="Marcos de Progresso"
        description="Receba felicitações ao atingir 25%, 50%, 75% e 100% de um e-book."
        icon={TrendingUp}
      />

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {prefs.fcmTokens.length > 0 ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {prefs.fcmTokens.length} dispositivo{prefs.fcmTokens.length !== 1 ? "s" : ""} registado{prefs.fcmTokens.length !== 1 ? "s" : ""}
              </span>
            </>
          ) : (
            <>
              <BellOff className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">
                Nenhum dispositivo registado. Abra a app móvel para activar notificações push.
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
