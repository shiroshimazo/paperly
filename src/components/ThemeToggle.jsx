import { MoonIcon, SunIcon } from "./icons";

/**
 * ThemeToggle — flips the `dark` class on <html> and persists the choice.
 * The initial class is set inline in index.html before paint to avoid flash.
 */
export default function ThemeToggle({ theme, onToggle, className = "" }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-md " +
        "border border-border text-text-muted hover:text-text " +
        "hover:bg-bg-soft transition-colors duration-150 " +
        className
      }
    >
      {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  );
}
