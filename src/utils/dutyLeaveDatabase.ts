import { database } from "../db/database";
import { DutyLeave } from "../types/dutyLeave";
import { parseISO } from "date-fns";
import { deleteFromLocal, saveToLocal } from "./fsUtils";

const DUTY_LEAVE_PREFIX = "duty_leave_";

export class DutyLeaveDatabase {
  static async saveDutyLeave(leave: DutyLeave): Promise<void> {
    try {
      const key = `${DUTY_LEAVE_PREFIX}${leave.id}`;
      await database.set(key, JSON.stringify(leave));
    } catch (error) {
      console.error("Error saving duty leave:", error);
      throw error;
    }
  }

  static async getDutyLeave(id: string): Promise<DutyLeave | null> {
    try {
      const key = `${DUTY_LEAVE_PREFIX}${id}`;
      const data = await database.get(key);
      if (data) {
        return JSON.parse(data) as DutyLeave;
      }
      return null;
    } catch (error) {
      console.error("Error getting duty leave:", error);
      return null;
    }
  }

  static async getAllDutyLeaves(): Promise<DutyLeave[]> {
    try {
      const allKeys = await database.getAllKeys();
      const dutyLeaveKeys = allKeys.filter((key) =>
        key.startsWith(DUTY_LEAVE_PREFIX),
      );

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

  static async deleteDutyLeave(id: string): Promise<void> {
    try {
      const leave = await this.getDutyLeave(id);
      if (leave?.documentUri) {
        await this.deleteDocument(leave.documentUri);
      }

      const key = `${DUTY_LEAVE_PREFIX}${id}`;
      await database.delete(key);
    } catch (error) {
      console.error("Error deleting duty leave:", error);
      throw error;
    }
  }

  static async updateDutyLeave(leave: DutyLeave): Promise<void> {
    try {
      const key = `${DUTY_LEAVE_PREFIX}${leave.id}`;
      const exists = await database.has(key);
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
