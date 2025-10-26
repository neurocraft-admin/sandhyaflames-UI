// driver.model.ts
export interface Driver {
  driverId: number;
  driverName: string;
  phone: string;
  licenseNo: string;
  jobType: string;      // ✅ add this
  isActive: boolean;
  createdAt: string;    // mapped from JoiningDate
}



export type DriverUpsertDto = {
  driverName: string;
  phone: string;
  licenseNo: string;
  isActive: boolean;
};
