import { useEffect, useState, useCallback } from "react";

// Global registry of active unsaved forms across the page
type UnsavedFormEntry = { id: string; name: string; isDirty: boolean };

const dirtyFormsRegistry = new Map<string, UnsavedFormEntry>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function registerFormDirty(id: string, name: string, isDirty: boolean) {
  if (isDirty) {
    dirtyFormsRegistry.set(id, { id, name, isDirty: true });
  } else {
    dirtyFormsRegistry.delete(id);
  }
  notifyListeners();
}

export function clearAllUnsavedForms() {
  dirtyFormsRegistry.clear();
  notifyListeners();
}

export function getUnsavedFormsList(): string[] {
  return Array.from(dirtyFormsRegistry.values()).map((f) => f.name);
}

// Hook for individual components or forms to register their state
export function useFormDirtyState(formId: string, formName: string, isDirty: boolean) {
  useEffect(() => {
    registerFormDirty(formId, formName, isDirty);
    return () => {
      registerFormDirty(formId, formName, false);
    };
  }, [formId, formName, isDirty]);
}

// Hook for Switch Role control to observe any unsaved forms
export function useUnsavedChanges() {
  const [unsavedForms, setUnsavedForms] = useState<string[]>([]);

  useEffect(() => {
    const update = () => setUnsavedForms(getUnsavedFormsList());
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const hasUnsavedChanges = unsavedForms.length > 0;

  const resetUnsaved = useCallback(() => {
    clearAllUnsavedForms();
  }, []);

  return {
    hasUnsavedChanges,
    unsavedForms,
    resetUnsaved
  };
}
