import { Platform, Linking } from 'react-native';

export const MapUtils = {
  /**
   * Opens the native maps app with directions to the specified coordinates.
   */
  openMapDirections: (latitude: number, longitude: number, label: string) => {
    const latLng = `${latitude},${longitude}`;
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to web browser
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
      }
    });
  },

  /**
   * Formats coordinates for MapView (latitudeDelta/longitudeDelta)
   */
  getRegionForCoordinates: (points: { latitude: number; longitude: number }[]) => {
    let minLat: number, maxLat: number, minLng: number, maxLng: number;

    // init with first point
    ( { latitude: minLat, latitude: maxLat, longitude: minLng, longitude: maxLng } = points[0] );

    // calculate rect
    points.forEach((point) => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.5; 
    const deltaLng = (maxLng - minLng) * 1.5;

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: Math.max(deltaLat, 0.05),
      longitudeDelta: Math.max(deltaLng, 0.05),
    };
  },
};
