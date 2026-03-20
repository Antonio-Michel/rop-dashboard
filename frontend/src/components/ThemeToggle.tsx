import { useTheme } from "./ThemeContext";

function ThemeToggle() {
  const { dark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-gray-300 dark:bg-gray-600 transition-colors focus:outline-none"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-sm transition-transform duration-200 ${
          dark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}

export default ThemeToggle;
