import { motion } from "framer-motion";
import { Swirling } from "./Swirling";

/**
 * Splash — full-screen boot screen shown while the app initializes.
 *
 * Renders the Swirling loader and the brand mark. The parent flips `visible`
 * to false once the app is ready; framer-motion handles the fade-out via
 * AnimatePresence at the call site.
 */
export default function Splash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg"
      role="status"
      aria-live="polite"
      aria-label="Loading Paperly"
    >
      <div className="flex flex-col items-center gap-app-md">
        <Swirling
          className="size-12 text-text"
          style={{ "--duration": "1.1s" }}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[1rem] font-semibold tracking-tight text-text">
            Paperly
          </span>
          <span className="text-label uppercase tracking-wider text-text-subtle">
            Loading your notebook
          </span>
        </div>
      </div>
    </motion.div>
  );
}
