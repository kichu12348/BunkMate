import { INSIGHTS_LOGGED_CODE } from "../constants/config";

export function isUserApproved(name: string) {
  const approved_list = [
    "ABCD_12348_Mahadevan_Reji",
    "ABCD_12348_Aiswarya_P_A",
    "ABCD_12348_JACKSON_TOM_JOSEPH",
  ];
  const code = INSIGHTS_LOGGED_CODE + name.split(" ").join("_");
  return approved_list.includes(code);
}
