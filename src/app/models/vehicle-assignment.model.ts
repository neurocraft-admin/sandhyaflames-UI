export interface VehicleAssignment {
  assignmentId: number;
  vehicleId: number;
  vehicleNumber: string;   // ✅ show in UI
  driverId: number;
  driverName: string;      // ✅ show in UI
  assignedDate: string;
  routeName: string;
  shift: string;
  isActive: boolean;
  createdAt: string;
}

export type VehicleAssignmentUpsertDto = {
  vehicleId: number;
  driverId: number;
  assignedDate: string;
  routeName: string;
  shift: string;
  isActive: boolean;
};
