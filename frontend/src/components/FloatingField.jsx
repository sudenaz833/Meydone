export default function FloatingField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  maxLength,
  pattern,
  title,
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        placeholder=" "
        className="peer block w-full appearance-none rounded-xl border border-rose-100 bg-white/90 px-3 pb-2.5 pt-5 text-sm text-stone-800 focus:border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-100/80"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-2 z-10 origin-[0] -translate-y-1 scale-75 transform text-sm text-stone-400 duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-1 peer-focus:scale-75 peer-focus:text-violet-500"
      >
        {label}
      </label>
    </div>
  );
}
