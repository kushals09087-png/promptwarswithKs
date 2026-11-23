import { describe, it, expect, beforeEach } from "vitest";
import {
  registerFormDirty,
  clearAllUnsavedForms,
  getUnsavedFormsList
} from "./useUnsavedChanges";

describe("useUnsavedChanges Global Registry", () => {
  beforeEach(() => {
    clearAllUnsavedForms();
  });

  it("tracks multiple dirty form components accurately", () => {
    expect(getUnsavedFormsList()).toEqual([]);

    registerFormDirty("form-booking", "Equipment Booking Wizard", true);
    registerFormDirty("form-project", "Academic Project Form", true);

    const list = getUnsavedFormsList();
    expect(list).toHaveLength(2);
    expect(list).toContain("Equipment Booking Wizard");
    expect(list).toContain("Academic Project Form");
  });

  it("removes form from registry when marked clean (false)", () => {
    registerFormDirty("form-booking", "Equipment Booking Wizard", true);
    expect(getUnsavedFormsList()).toHaveLength(1);

    registerFormDirty("form-booking", "Equipment Booking Wizard", false);
    expect(getUnsavedFormsList()).toHaveLength(0);
  });

  it("clears all entries atomically when clearAllUnsavedForms is invoked", () => {
    registerFormDirty("f1", "Form 1", true);
    registerFormDirty("f2", "Form 2", true);
    registerFormDirty("f3", "Form 3", true);
    expect(getUnsavedFormsList()).toHaveLength(3);

    clearAllUnsavedForms();
    expect(getUnsavedFormsList()).toEqual([]);
  });
});
