import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Callout } from 'react-native-maps';

type LatLng = { latitude: number; longitude: number };

type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  type?: 'vehicle' | 'stop' | 'destination';
  stageId?: string;
  congestion?: string;
  routes?: string;
};

type Props = {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsCompass?: boolean;
  rotateEnabled?: boolean;
  markers?: MarkerProps[];
  polyline?: LatLng[];
  polylineColor?: string;
  selectedStage?: string;
  onMarkerPress?: (marker: MarkerProps) => void;
  renderCallout?: (marker: MarkerProps) => React.ReactNode;
  getCongestionColor?: (congestion: string) => string;
  children?: React.ReactNode; 
};

// ----------- WEB VERSION -------------
const WebMap = ({ region, markers, polyline, children }: Props) => {
  const MapContainer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })));
  const TileLayer = lazy(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })));
  const LeafletMarker = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Marker })));
  const LeafletPolyline = lazy(() => import('react-leaflet').then(mod => ({ default: mod.Polyline })));

  const [Leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then(L => {
      delete (L as any).Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
        iconUrl: require('leaflet/dist/images/marker-icon.png'),
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });
      setLeaflet(L);
    });
  }, []);

  if (!Leaflet) return <div>Loading map library...</div>;

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Suspense fallback={<div>Loading map components...</div>}>
        <MapContainer center={[region.latitude, region.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {(polyline ?? []).length > 0 && (
            <LeafletPolyline
              positions={(polyline ?? []).map((point) => [point.latitude, point.longitude])}
              pathOptions={{ color: '#0066ff', weight: 4 }}
            />
          )}
          {markers?.map((marker, index) => (
            <LeafletMarker
              key={index}
              position={[marker.coordinate.latitude, marker.coordinate.longitude]}
              title={marker.title}
              icon={Leaflet.divIcon({
                className: 'leaflet-custom-icon',
                html: `<div style="background: ${
                  marker.type === 'vehicle'
                    ? '#0066ff'
                    : marker.type === 'destination'
                    ? '#ff4d4d'
                    : 'white'
                }; border-radius: 999px; padding: 8px; border: 2px solid ${
                  marker.type === 'stop' ? '#0066ff' : 'transparent'
                };"></div>`,
              })}
            />
          ))}
          {/* 👇 Add support for children */}
          {children}
        </MapContainer>
      </Suspense>
    </div>
  );
};

// ----------- NATIVE VERSION -------------
export default function CustomMapView({
  region,
  markers = [],
  polyline,
  polylineColor = '#0066ff',
  selectedStage,
  onMarkerPress,
  renderCallout,
  getCongestionColor,
  children, // ✨ Accept children here too
}: Props) {
  if (Platform.OS === 'web') {
    return <WebMap region={region} markers={markers} polyline={polyline}>{children}</WebMap>;
  }

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      region={region}
      showsUserLocation
      showsCompass
      rotateEnabled
    >
      {/* Polyline for routes */}
      {(polyline ?? []).length > 0 && (
        <Polyline coordinates={polyline ?? []} strokeWidth={4} strokeColor={polylineColor} />
      )}

      {/* Markers */}
      {markers.map((marker, index) => {
        const isSelected = marker.stageId && marker.stageId === selectedStage;
        const backgroundColor = marker.congestion
          ? getCongestionColor?.(marker.congestion) ?? 'gray'
          : marker.type === 'vehicle'
          ? '#0066ff'
          : marker.type === 'destination'
          ? '#ff4d4d'
          : 'white';

        return (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            title={marker.title}
            onPress={() => onMarkerPress?.(marker)}
          >
            <View
              style={{
                backgroundColor,
                padding: 8,
                borderRadius: 999,
                borderWidth: marker.type === 'stop' ? 2 : 0,
                borderColor: isSelected ? '#0066ff' : 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {marker.routes && (
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>{marker.routes}</Text>
              )}
            </View>

            {renderCallout && <Callout tooltip>{renderCallout(marker)}</Callout>}
          </Marker>
        );
      })}

      {/* 👇 Finally render children inside native MapView */}
      {children}
    </MapView>
  );
} 