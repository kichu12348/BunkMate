import { attendanceService } from '../api/attendance';
import { useAttendanceStore } from '../state/attendance';
import { userAttendanceService } from '../db/userAttendanceService';

class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private constructor() {}

  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  /**
   * Start background sync when app opens
   */
  async startAppSync(): Promise<void> {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      console.log('🔄 Starting background attendance sync...');

      // Perform initial sync without forcing refresh (will use cache if available)
      const attendanceStore = useAttendanceStore.getState();
      await attendanceStore.fetchAttendance(false);

      // Then perform background refresh to get latest data
      setTimeout(async () => {
        try {
          await this.performBackgroundSync();
        } catch (error) {
          console.warn('Background sync failed:', error);
          // Don't throw error - background sync should be silent
        }
      }, 2000); // Wait 2 seconds before background sync

    } catch (error) {
      console.error('Initial app sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async performBackgroundSync(): Promise<void> {
    try {
      const attendanceStore = useAttendanceStore.getState();
      await attendanceStore.fetchAttendance(true);
      const conflicts = userAttendanceService.getConflicts();
      if (conflicts.length > 0) {
        this.notifyConflictsDetected(conflicts.length);
      }

      console.log('✅ Background sync completed successfully');
    } catch (error) {
      console.error('Background sync failed:', error);
      throw error;
    }
  }

  /**
   * Start periodic sync (every 30 minutes)
   */
  startPeriodicSync(): void {
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
  }

  /**
   * Manual sync trigger
   */
  async manualSync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    await this.performBackgroundSync();
  }

  /**
   * Notify about conflicts detected (can be extended to show notifications)
   */
  private notifyConflictsDetected(count: number): void {
    // Here you could integrate with a notification system
    console.log(`📢 ${count} attendance conflicts detected`);
    
    // Example: Could emit an event or update a notification store
    // eventEmitter.emit('conflicts-detected', count);
  }

  /**
   * Check if sync is currently running
   */
  get isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();

// Export a hook for easy access in components
export const useBackgroundSync = () => {
  const startAppSync = () => backgroundSyncService.startAppSync();
  const startPeriodicSync = () => backgroundSyncService.startPeriodicSync();
  const stopPeriodicSync = () => backgroundSyncService.stopPeriodicSync();
  const manualSync = () => backgroundSyncService.manualSync();
  const isCurrentlySyncing = backgroundSyncService.isCurrentlySyncing;

  return {
    startAppSync,
    startPeriodicSync,
    stopPeriodicSync,
    manualSync,
    isCurrentlySyncing,
  };
};
