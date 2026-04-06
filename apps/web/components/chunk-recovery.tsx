"use client";

import { useEffect } from "react";

const RECOVERY_FLAG = "resumeforge.chunk-recovery-attempted";

function isChunkLoadFailure(reason: unknown) {
  const message = reason instanceof Error
    ? `${reason.name} ${reason.message} ${reason.stack ?? ""}`
    : String(reason ?? "");
  return /chunkloaderror|loading chunk \d+ failed|_next\/static\/chunks/i.test(message);
}

function hasRecoveryAttempted() {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

function markRecoveryAttempted() {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, "1");
  } catch {
    // Ignore storage limitations and still attempt reload.
  }
}

function clearRecoveryFlag() {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG);
  } catch {
    // Ignore storage limitations.
  }
}

export function ChunkRecovery() {
  useEffect(() => {
    clearRecoveryFlag();

    const recover = (reason: unknown) => {
      if (!isChunkLoadFailure(reason) || hasRecoveryAttempted()) {
        return;
      }
      markRecoveryAttempted();
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => recover(event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) => recover(event.reason);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
