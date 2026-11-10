"use client";
import { useId, useState } from "react";
import { UiIcon } from "./ui-icon";
export function PasswordField() {
  const [visible, setVisible] = useState(false),
    id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        Password
      </label>
      <div className="password-field">
        <input
          id={id}
          type={visible ? "text" : "password"}
          name="password"
          required
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="button"
          aria-label={visible ? "Nascondi password" : "Mostra password"}
          aria-controls={id}
          onClick={() => setVisible((value) => !value)}
        >
          <UiIcon name={visible ? "eye-off" : "eye"} />
        </button>
      </div>
    </div>
  );
}
