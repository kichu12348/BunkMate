import { database } from "../db/database";
import { DutyLeave } from "../types/dutyLeave";
import { parseISO } from "date-fns";
import { deleteFromLocal, saveToLocal } from "./fsUtils";
import { kvHelper } from "../kv/kvStore";

const DUTY_LEAVE_PREFIX = "duty_leave_";

export class DutyLeaveDatabase {
  private static getKey(id: string, accountId?: number | null): string {
    const accId = accountId ?? kvHelper.getAccounts();
    return accId
      ? `${DUTY_LEAVE_PREFIX}${accId}_${id}`
      : `${DUTY_LEAVE_PREFIX}${id}`;
  }

  private static getLegacyKey(id: string): string {
    return `${DUTY_LEAVE_PREFIX}${id}`;
  }

  static async saveDutyLeave(
    leave: DutyLeave,
    accountId?: number | null,
  ): Promise<void> {
    try {
      const key = this.getKey(leave.id, accountId);
      await database.set(key, JSON.stringify(leave));
    } catch (error) {
      console.error("Error saving duty leave:", error);
      throw error;
    }
  }

  static async getDutyLeave(
    id: string,
    accountId?: number | null,
  ): Promise<DutyLeave | null> {
    try {
      const key = this.getKey(id, accountId);
      let data = await database.get(key);
      if (!data) {
        data = await database.get(this.getLegacyKey(id));
      }
      if (data) {
        return JSON.parse(data) as DutyLeave;
      }
      return null;
    } catch (error) {
      console.error("Error getting duty leave:", error);
      return null;
    }
  }

  static async getAllDutyLeaves(
    accountId?: number | null,
  ): Promise<DutyLeave[]> {
    try {
      const accId = accountId ?? kvHelper.getAccounts();
      const allKeys = await database.getAllKeys();

      const prefix = accId
        ? `${DUTY_LEAVE_PREFIX}${accId}_`
        : DUTY_LEAVE_PREFIX;

      const dutyLeaveKeys = allKeys.filter((key) => {
        if (key.startsWith(prefix)) return true;
        // If no account ID active, include legacy duty leaves without underscore suffix
        if (!accId && key.startsWith(DUTY_LEAVE_PREFIX)) return true;
        return false;
      });

      const leaves: DutyLeave[] = [];

      for (const key of dutyLeaveKeys) {
        try {
          const data = await database.get(key);
          if (data) {
            const leave = JSON.parse(data) as DutyLeave;
            let shouldPersistNormalizedLeave = false;

            if (leave.hours === undefined) {
              leave.hours = "full_day";
              shouldPersistNormalizedLeave = true;
            } else if (Array.isArray(leave.hours)) {
              const normalizedHours = leave.hours
                .map((hour) => Number(hour))
                .filter((hour) => Number.isFinite(hour) && hour > 0)
                .sort((a, b) => a - b);

              if (
                normalizedHours.length !== leave.hours.length ||
                normalizedHours.some(
                  (hour, index) => hour !== leave.hours[index],
                )
              ) {
                leave.hours = normalizedHours;
                shouldPersistNormalizedLeave = true;
              }
            }

            if (shouldPersistNormalizedLeave) {
              await database.set(key, JSON.stringify(leave));
            }

            leaves.push(leave);
          }
        } catch (parseError) {
          console.warn(
            `Failed to parse duty leave for key ${key}:`,
            parseError,
          );
        }
      }

      leaves.sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
      );

      return leaves;
    } catch (error) {
      console.error("Error getting all duty leaves:", error);
      return [];
    }
  }

  static async deleteDutyLeave(
    id: string,
    accountId?: number | null,
  ): Promise<void> {
    try {
      const leave = await this.getDutyLeave(id, accountId);
      if (leave?.documentUri) {
        await this.deleteDocument(leave.documentUri);
      }

      const key = this.getKey(id, accountId);
      await database.delete(key);
      await database.delete(this.getLegacyKey(id));
    } catch (error) {
      console.error("Error deleting duty leave:", error);
      throw error;
    }
  }

  static async updateDutyLeave(
    leave: DutyLeave,
    accountId?: number | null,
  ): Promise<void> {
    try {
      const key = this.getKey(leave.id, accountId);
      const exists = (await database.has(key)) || (await database.has(this.getLegacyKey(leave.id)));
      if (!exists) {
        throw new Error(`Duty leave with id ${leave.id} not found`);
      }
      await database.set(key, JSON.stringify(leave));
    } catch (error) {
      console.error("Error updating duty leave:", error);
      throw error;
    }
  }

  static async saveDocument(sourceUri: string, fileName: string) {
    try {
      return saveToLocal(sourceUri, "duty_leave_docs", fileName);
    } catch (error) {
      console.error("Error saving document:", error);
      return null;
    }
  }

  static async deleteDocument(uri: string): Promise<void> {
    try {
      deleteFromLocal(uri);
    } catch (error) {
      console.warn("Failed to delete document file:", error);
    }
  }
}
