import { create } from "zustand";

/** Why the last write or connection attempt failed, as a key the interface translates. */
export type FolderSyncError = "write" | "pick" | "denied" | "missing";

type FolderSyncStatus =
  /** No folder chosen. */
  | "off"
  /** A folder is chosen and writable. */
  | "ready"
  | "saving"
  /** The browser wants a click before it allows writing again after a reload. */
  | "needs-permission"
  | "error";

export type FolderSyncPatch = Partial<Omit<FolderSyncState, "set">>;

type FolderSyncState = {
  /** The browser can pick folders (Chromium). Set after mount, so server and client render alike. */
  supported: boolean;
  /** False until the saved folder has been looked up. */
  loaded: boolean;
  status: FolderSyncStatus;
  folderName: string | null;
  lastSavedAt: number | null;
  error: FolderSyncError | null;
  set: (patch: FolderSyncPatch) => void;
};

/** Session state of the folder autosave. Not persisted: the folder itself lives in IndexedDB. */
export const useFolderSyncStore = create<FolderSyncState>()((set) => ({
  supported: false,
  loaded: false,
  status: "off",
  folderName: null,
  lastSavedAt: null,
  error: null,
  set: (patch) => set(patch),
}));
