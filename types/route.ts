export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RouteRaw = {
  id: string;
  name: string;
  start_location: string;
  end_location: string;
  fare_amount: number;
  estimated_time: number;
  description: string;
  distance: number;
  congestion_level: 'low' | 'medium' | 'high';
  route_coordinates: { 
    latitude: number; 
    longitude: number; 
    point_order: number 
  }[];
};

export type StageRaw = {
  id: string;
  route_id: string;
  name: string;
  location_latitude: number;
  location_longitude: number;
  congestion: string;
};

export type VehicleRaw = {
  id: string;
  route_id: string;
  plate_number: string;
  location_latitude: number;
  location_longitude: number;
  capacity: number;
  available: number;
};

export type TransformedRouteItem = {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  fareAmount: number;
  estimatedTime: number;
  description: string;
  distance: number;
  congestion: string;
  congestionLevel: 'low' | 'medium' | 'high';
  coordinates: Coordinate[];
  stages: {
    id: string;
    name: string;
    location: Coordinate;
    congestion?: string;
  }[];
  vehicles: {
    id: string;
    plateNumber: string;
    location: Coordinate;
    capacity: number;
    available: number;
  }[];
};

export type MarkerType = {
  coordinate: Coordinate;
  title: string;
  type: 'stop' | 'vehicle';
};