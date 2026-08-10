import { useEffect, useRef, useState } from 'react';
import { X, Check, MapPin, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapLocationPicker.css';

// Fix Leaflet default icon issues in bundled apps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customPinIcon = (color = '#3b82f6') => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

const MapLocationPicker = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 20,
  initialLng = 0,
  initialAddress = '',
  title = 'Select Location on Map',
  pinColor = '#3b82f6',
  showRadius = 60, // km radius circle
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  const [selectedPos, setSelectedPos] = useState({
    lat: initialLat || 20,
    lng: initialLng || 0,
    address: initialAddress || 'Loading address...',
  });
  const [geocoding, setGeocoding] = useState(false);

  // Reverse geocode lat/lng to readable address
  const fetchAddress = async (lat, lng) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const parts = [];
        if (addr.suburb || addr.neighbourhood || addr.quarter || addr.subdistrict) {
          parts.push(addr.suburb || addr.neighbourhood || addr.quarter || addr.subdistrict);
        }
        if (addr.city || addr.town || addr.village || addr.county || addr.state_district) {
          parts.push(addr.city || addr.town || addr.village || addr.county || addr.state_district);
        }
        if (addr.state) parts.push(addr.state);
        if (addr.country) parts.push(addr.country);

        const formatted = parts.length > 0
          ? parts.slice(0, 3).join(', ')
          : (data.display_name ? data.display_name.split(',').slice(0, 3).join(',').trim() : `${lat.toFixed(4)}, ${lng.toFixed(4)}`);

        setSelectedPos({ lat, lng, address: formatted });
      } else {
        setSelectedPos({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      }
    } catch {
      setSelectedPos({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const lat = initialLat && !isNaN(initialLat) ? Number(initialLat) : 20.5937;
    const lng = initialLng && !isNaN(initialLng) ? Number(initialLng) : 78.9629;
    const zoom = (initialLat && initialLng && (initialLat !== 20 || initialLng !== 0)) ? 11 : 5;

    // Initialize map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Marker
      const marker = L.marker([lat, lng], {
        icon: customPinIcon(pinColor),
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // 50-60 km Radius Circle
      if (showRadius > 0) {
        const circle = L.circle([lat, lng], {
          radius: showRadius * 1000, // convert km to meters
          color: pinColor,
          fillColor: pinColor,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
        circleRef.current = circle;
      }

      // Map click handler
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        if (circleRef.current) {
          circleRef.current.setLatLng([clickLat, clickLng]);
        }
        fetchAddress(clickLat, clickLng);
      });

      // Marker drag handler
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        if (circleRef.current) {
          circleRef.current.setLatLng(pos);
        }
        fetchAddress(pos.lat, pos.lng);
      });

      mapInstanceRef.current = map;

      // Initial address fetch if not present
      if (!initialAddress) {
        fetchAddress(lat, lng);
      } else {
        setSelectedPos({ lat, lng, address: initialAddress });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);
          markerRef.current.setLatLng([latitude, longitude]);
          if (circleRef.current) {
            circleRef.current.setLatLng([latitude, longitude]);
          }
          fetchAddress(latitude, longitude);
        }
      },
      (err) => console.warn('Geolocation error:', err)
    );
  };

  const handleConfirm = () => {
    onSelectLocation(selectedPos);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="map-picker-modal-overlay animate-fade-in">
      <div className="map-picker-modal glass-card animate-fade-in-up">
        {/* Header */}
        <div className="map-picker-header">
          <div className="map-picker-title-box">
            <MapPin size={20} style={{ color: pinColor }} />
            <div>
              <h3>{title}</h3>
              <p className="text-xs text-secondary">Click anywhere on the map or drag the pin to select</p>
            </div>
          </div>
          <button className="map-picker-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Selected Address Bar */}
        <div className="map-selected-info">
          <div className="selected-address-badge">
            <span className="dot" style={{ background: pinColor }}></span>
            <span className="address-text">
              {geocoding ? 'Detecting address...' : selectedPos.address}
            </span>
          </div>
          {showRadius > 0 && (
            <span className="radius-indicator-pill">
              🎯 {showRadius} km match radius
            </span>
          )}
        </div>

        {/* Map Container */}
        <div className="map-canvas-container">
          <div ref={mapContainerRef} className="map-leaflet-canvas" />

          {/* Quick Map Controls */}
          <div className="map-floating-controls">
            <button
              type="button"
              className="map-float-btn"
              onClick={handleUseCurrentLocation}
              title="Locate me (GPS)"
            >
              <Navigation size={18} />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="map-picker-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary map-confirm-btn"
            onClick={handleConfirm}
            disabled={geocoding}
          >
            <Check size={18} /> Confirm This Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;
