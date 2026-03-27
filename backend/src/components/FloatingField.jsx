import { authFloatInput, authFloatLabel, authFloatLabelDate, textSmall } from "../utils/ui";

/**
 * Floating label input. Text-like fields use placeholder + peer; date uses a fixed top label.
 */
export default function FloatingField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  maxLength,
  helperText,
  className = "",
}) {
  const isDate = type === "date";

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        name={id}
        type={type}
        className={authFloatInput}
        placeholder=" "
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
      />
      <label htmlFor={id} className={isDate ? authFloatLabelDate : authFloatLabel}>
        {label}
      </label>
      {helperText ? <p className={`mt-2 pl-1 ${textSmall} text-stone-500`}>{helperText}</p> : null}
    </div>
  );
}
