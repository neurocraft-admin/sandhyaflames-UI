export interface OpenDeliveryMonitoring {
  DeliveryId: number;
  DeliveryDate: string;
  Status: string;
  StartTime: string;
  ReturnTime?: string;
  Remarks?: string;
  
  // Driver Information
  DriverId: number;
  DriverName: string;
  
  // Helper Information
  HelperId?: number;
  HelperName?: string;
  
  // Vehicle Information
  VehicleId: number;
  VehicleNumber: string;
  
  // Route/Area Information
  RouteId?: number;
  RouteName: string;
  
  // Metadata
  CreatedAt: string;
  UpdatedAt?: string;
  
  // Calculated field
  HoursSinceStart: number;
}
