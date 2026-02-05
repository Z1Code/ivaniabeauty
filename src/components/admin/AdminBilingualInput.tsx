"use client";

interface AdminBilingualInputProps {
  label: string;
  valueEn: string;
  valueEs: string;
  onChangeEn: (value: string) => void;
  onChangeEs: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
}

export default function AdminBilingualInput({
  label,
  valueEn,
  valueEs,
  onChangeEn,
  onChangeEs,
  placeholder,
  required,
  textarea,
  rows = 3,
}: AdminBilingualInputProps) {
  const inputClasses =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rosa/30 focus:border-rosa transition-all";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-rosa ml-1">*</span>}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              ES
            </span>
          </div>
          {textarea ? (
            <textarea
              value={valueEs}
              onChange={(e) => onChangeEs(e.target.value)}
              placeholder={placeholder ? `${placeholder} (ES)` : ""}
              required={required}
              rows={rows}
              className={inputClasses + " resize-none"}
            />
          ) : (
            <input
              type="text"
              value={valueEs}
              onChange={(e) => onChangeEs(e.target.value)}
              placeholder={placeholder ? `${placeholder} (ES)` : ""}
              required={required}
              className={inputClasses}
            />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              EN
            </span>
          </div>
          {textarea ? (
            <textarea
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholder ? `${placeholder} (EN)` : ""}
              required={required}
              rows={rows}
              className={inputClasses + " resize-none"}
            />
          ) : (
            <input
              type="text"
              value={valueEn}
              onChange={(e) => onChangeEn(e.target.value)}
              placeholder={placeholder ? `${placeholder} (EN)` : ""}
              required={required}
              className={inputClasses}
            />
          )}
        </div>
      </div>
    </div>
  );
}
