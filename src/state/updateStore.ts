import { create } from "zustand";
import { getAppVersion } from "../api/update";
import { kvHelper } from "../kv/kvStore";
import { APP_CONFIG } from "../constants/config";
import type { AppVersion } from "../types/update";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns true if the server major version is strictly greater than the
 * client major version. Major version = the first segment before ".".
 */
function isMajorVersionNewer(
  serverVersion: string,
  clientVersion: string,
): boolean {
  const serverMajor = parseInt(serverVersion.split(".")[0], 10);
  const clientMajor = parseInt(clientVersion.split(".")[0], 10);
  return serverMajor > clientMajor;
}

interface UpdateState {
  /** Whether the update modal should be shown */
  isVisible: boolean;
  /** If true the modal cannot be dismissed — user must update */
  forceUpdate: boolean;
  /** Direct download link returned by the server */
  downloadUrl: string;

  // Actions
  /**
   * Fetches the latest version from the server (at most once every 24 h
   * for non-forced updates) and updates modal visibility accordingly.
   */
  checkForUpdate: () => Promise<void>;
  /** Called when the user taps "Later" — stamps the check time and hides the modal. */
  dismissModal: () => void;
}

export const useUpdateStore = create<UpdateState>()((set) => ({
  isVisible: false,
  forceUpdate: false,
  downloadUrl: "",

  checkForUpdate: async () => {
    // Skip if we've already checked within the last 24 hours
    const lastChecked = kvHelper.getUpdateTime();
    if (lastChecked) {
      const elapsed = Date.now() - parseInt(lastChecked, 10);
      if (elapsed < MS_PER_DAY) {
        return;
      }
    }

    const result = await getAppVersion();

    // If the API returned an error shape, bail out silently
    if (!("version" in result)) {
      return;
    }

    const serverData = result;

    if (!isMajorVersionNewer(serverData.version, APP_CONFIG.VERSION)) {
      // Up-to-date — stamp so we don't check again for 24 h
      kvHelper.setUpdateTime(Date.now().toString());
      return;
    }

    // New major version available
    set({
      isVisible: true,
      forceUpdate: serverData.forceUpdate,
      downloadUrl: serverData.download_url,
    });
  },

  dismissModal: () => {
    // Stamp dismissal time → next check in 24 h
    kvHelper.setUpdateTime(Date.now().toString());
    set({ isVisible: false });
  },
}));
