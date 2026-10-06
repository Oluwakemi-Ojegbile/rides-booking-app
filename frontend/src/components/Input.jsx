import { useState } from "react";

export function Input({ label, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === "password";
  return (
    <label className="field">
      <span>{label}</span>
      <span className={isPassword ? "password-field" : "input-field"}>
        <input {...props} type={isPassword && visible ? "text" : props.type} />
        {isPassword && (
          <button
            className="password-toggle"
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={(event) => { event.preventDefault(); setVisible((current) => !current); }}
          >
            {visible ? "Hide" : "Show"}
          </button>
        )}
      </span>
    </label>
  );
}
