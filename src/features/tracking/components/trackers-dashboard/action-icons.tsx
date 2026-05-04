"use client";

import { AnimatePresence, motion } from "motion/react";
import { IconLoader2, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";

import type { ActionFeedbackState } from "@/features/tracking/components/trackers-dashboard/types";

export function ResumeActionIcon({ state }: { state: ActionFeedbackState }) {
  return (
    <span className="relative grid size-3.5 place-items-center">
      <AnimatePresence mode="wait" initial={false}>
        {state === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.86 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="grid place-items-center"
          >
            <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
          </motion.span>
        ) : null}

        {state === "idle" ? (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="grid place-items-center"
          >
            <IconPlayerPlay className="size-3.5" stroke={1.5} />
          </motion.span>
        ) : null}

        {state === "success" ? (
          <motion.svg
            key="success"
            viewBox="0 0 18 18"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: [0.82, 1.08, 1] }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <motion.path
              d="M4.5 9.2L7.4 12.1L13.4 6.2"
              strokeWidth="2.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.05 }}
            />
          </motion.svg>
        ) : null}

        {state === "error" ? (
          <motion.svg
            key="error"
            viewBox="0 0 18 18"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: [0.82, 1.06, 1] }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.path
              d="M5.3 5.3L12.7 12.7"
              strokeWidth="2.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.02 }}
            />
            <motion.path
              d="M12.7 5.3L5.3 12.7"
              strokeWidth="2.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.08 }}
            />
          </motion.svg>
        ) : null}
      </AnimatePresence>
    </span>
  );
}

export function PauseActionIcon({ state }: { state: ActionFeedbackState }) {
  return (
    <span className="relative grid size-3.5 place-items-center">
      <AnimatePresence mode="wait" initial={false}>
        {state === "loading" ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.86 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="grid place-items-center"
          >
            <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
          </motion.span>
        ) : null}

        {state === "idle" ? (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="grid place-items-center"
          >
            <IconPlayerPause className="size-3.5" stroke={1.5} />
          </motion.span>
        ) : null}

        {state === "success" ? (
          <motion.svg
            key="success"
            viewBox="0 0 18 18"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: [0.82, 1.08, 1] }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <motion.path
              d="M4.5 9.2L7.4 12.1L13.4 6.2"
              strokeWidth="2.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.24, ease: "easeOut", delay: 0.05 }}
            />
          </motion.svg>
        ) : null}

        {state === "error" ? (
          <motion.svg
            key="error"
            viewBox="0 0 18 18"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: [0.82, 1.06, 1] }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.path
              d="M5.3 5.3L12.7 12.7"
              strokeWidth="2.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.02 }}
            />
            <motion.path
              d="M12.7 5.3L5.3 12.7"
              strokeWidth="2.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.08 }}
            />
          </motion.svg>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
