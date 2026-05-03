import { useI18n } from '../i18n';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="relative flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent text-sm text-slate-300 border-none focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="en" className="text-slate-900 bg-white">English</option>
        <option value="rw" className="text-slate-900 bg-white">Kinyarwanda</option>
      </select>
    </div>
  );
}
