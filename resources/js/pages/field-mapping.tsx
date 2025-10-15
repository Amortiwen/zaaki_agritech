import {
    GoogleMap,
    Polygon as GooglePolygon,
    Marker,
    useJsApiLoader,
} from '@react-google-maps/api';
import axios from 'axios';
import {
    Edit3,
    MapPin,
    Navigation,
    Pencil,
    Ruler,
    Send,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { router } from '@inertiajs/react';

// Simple toast function for notifications
const toast = {
    success: (message: string) => {
        console.log('✅', message);
        // You can replace this with a proper toast library later
    },
    error: (message: string) => {
        console.error('❌', message);
    },
    info: (message: string) => {
        console.info('ℹ️', message);
    },
};

// Google Maps configuration
const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const libraries: ('drawing' | 'geometry')[] = ['drawing', 'geometry'];

// Crop data for different regions
const cropData = {
    'Northern Ghana (Savannah Zone)': [
        'Maize', 'Sorghum', 'Millet', 'Groundnut (Peanut)', 'Yam', 'Rice',
        'Cowpea', 'Soybean', 'Bambara beans', 'Cassava', 'Shea (Sheanut)',
        'Sesame', 'Cotton', 'Sweet potato', 'Guinea corn'
    ],
    'Southern Ghana (Forest & Coastal Zone)': [
        'Cocoa', 'Oil palm', 'Plantain', 'Cassava', 'Cocoyam', 'Maize',
        'Pineapple', 'Orange', 'Mango', 'Coconut', 'Banana', 'Papaya (Pawpaw)',
        'Pepper (Chili)', 'Tomato', 'Garden eggs (Eggplant)'
    ]
};

// Memoized components to prevent re-renders
const FieldMarker = React.memo(
    ({
        field,
        onSelect,
    }: {
        field: FieldData;
        onSelect: (field: FieldData) => void;
    }) => (
        <Marker
            key={`marker-${field.id}`}
            position={{ lat: field.center.lat(), lng: field.center.lng() }}
            onClick={() => onSelect(field)}
        />
    ),
);

const FieldPolygon = React.memo(
    ({
        field,
        isSelected,
        onSelect,
    }: {
        field: FieldData;
        isSelected: boolean;
        onSelect: (field: FieldData) => void;
    }) => (
        <GooglePolygon
            key={field.id}
            paths={field.coordinates}
            options={{
                fillColor: isSelected ? '#ef4444' : '#22c55e',
                fillOpacity: 0.3,
                strokeColor: isSelected ? '#dc2626' : '#16a34a',
                strokeWeight: 2,
                clickable: true,
            }}
            onClick={() => onSelect(field)}
        />
    ),
);

// Memoized map component to prevent re-renders
const MemoizedGoogleMap = React.memo(
    ({
        mapContainerStyle,
        center,
        zoom,
        onLoad,
        mapTypeId,
        options,
        children,
    }: {
        mapContainerStyle: any;
        center: { lat: number; lng: number };
        zoom: number;
        onLoad: (map: google.maps.Map) => void;
        mapTypeId: google.maps.MapTypeId;
        options: any;
        children: React.ReactNode;
    }) => (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={zoom}
            onLoad={onLoad}
            mapTypeId={mapTypeId}
            options={options}
        >
            {children}
        </GoogleMap>
    ),
);

interface FieldData {
    id: string;
    name: string;
    coordinates: google.maps.LatLng[];
    center: google.maps.LatLng;
    area: number; // in hectares
    crop?: string;
    variety?: string;
    region: string;
    country: string;
    address?: string;
    image?: string;
    createdAt: Date;
}

interface ToolboxProps {
    onToolSelect: (tool: string) => void;
    activeTool: string;
    onClearFields: () => void;
    onLocateMe: () => void;
    onEditFields: () => void;
}

const Toolbox: React.FC<ToolboxProps> = React.memo(
    ({ onToolSelect, activeTool, onClearFields, onLocateMe, onEditFields }) => {
        const tools = [
            { id: 'measure', icon: Ruler, label: 'Measure' },
            { id: 'draw', icon: Pencil, label: 'Draw' },
            { id: 'edit', icon: Edit3, label: 'Edit' },
            { id: 'clear', icon: Trash2, label: 'Clear' },
            { id: 'locate', icon: Navigation, label: 'Locate' },
        ];

        const handleClick = (id: string) => {
            if (id === 'clear') return onClearFields();
            if (id === 'locate') return onLocateMe();
            if (id === 'edit') return onEditFields();
            onToolSelect(id);
        };

        return (
            <Card className="absolute top-4 left-4 z-50 border border-slate-700 bg-slate-900/90 backdrop-blur-md">
                <CardContent className="flex gap-2 p-2">
                    {tools.map(({ id, icon: Icon, label }) => {
                        const active = activeTool === id;
                        return (
                            <Button
                                key={id}
                                size="sm"
                                variant={active ? 'default' : 'outline'}
                                className={`flex h-12 w-12 flex-col items-center justify-center ${
                                    active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-300'
                                }`}
                                onClick={() => handleClick(id)}
                            >
                                <Icon className="mb-1 h-4 w-4" />
                                <span className="text-[11px]">{label}</span>
                            </Button>
                        );
                    })}
                </CardContent>
            </Card>
        );
    },
);

interface FieldSidebarProps {
    fields: FieldData[];
    onFieldSelect: (field: FieldData) => void;
    onFieldUpdate: (fieldId: string, updates: Partial<FieldData>) => void;
    onFieldDelete: (fieldId: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    selectedField?: FieldData;
    zone: 'Northern Ghana (Savannah Zone)' | 'Southern Ghana (Forest & Coastal Zone)';
}

const FieldSidebar: React.FC<FieldSidebarProps> = React.memo(
    ({
        fields,
        onFieldSelect,
        onFieldUpdate,
        onFieldDelete,
        onSubmit,
        isSubmitting,
        selectedField,
        zone,
    }) => {
        const [editingField, setEditingField] = useState<string | null>(null);

        const calculateArea = (coordinates: google.maps.LatLng[]) => {
            // Simple area calculation using shoelace formula
            let area = 0;
            for (let i = 0; i < coordinates.length; i++) {
                const j = (i + 1) % coordinates.length;
                area += coordinates[i].lat() * coordinates[j].lng();
                area -= coordinates[j].lat() * coordinates[i].lng();
            }
            return ((Math.abs(area) / 2) * 111000 * 111000) / 10000; // Convert to hectares (rough approximation)
        };

        return (
            <Card className="absolute top-28 left-4 z-[1000] flex max-h-[calc(100vh-8rem)] w-80 flex-col border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-sm">
                <CardHeader className="flex-shrink-0 border-b border-slate-700 bg-gradient-to-r from-emerald-800 to-emerald-900">
                    <CardTitle className="flex items-center justify-between text-lg text-white">
                        <span className="flex items-center">
                            <MapPin className="mr-2 h-5 w-5 text-emerald-300" />
                            Farm Fields
                        </span>
                        <Badge
                            variant="secondary"
                            className="border-emerald-500/30 bg-emerald-600/20 text-emerald-300"
                        >
                            {fields.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription className="text-emerald-200">
                        Manage your farm fields and crop information
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 overflow-y-auto bg-slate-800/30">
                    {fields.length === 0 ? (
                        <div className="py-12 text-center text-slate-300">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-slate-600 bg-slate-700/50 p-6">
                                <MapPin className="h-10 w-10 text-emerald-400" />
                            </div>
                            <p className="font-medium text-slate-200">
                                No fields drawn yet
                            </p>
                            <p className="text-sm text-slate-400">
                                Use the draw tool to create your first field
                            </p>
                        </div>
                    ) : (
                        fields.map((field) => (
                            <Card
                                key={field.id}
                                className={`cursor-pointer border-slate-600 bg-slate-800/60 transition-colors hover:bg-slate-700/60 ${
                                    selectedField?.id === field.id
                                        ? 'bg-slate-700/60 ring-2 ring-emerald-500'
                                        : ''
                                }`}
                            >
                                <CardContent className="p-6">
                                    <div className="mb-3 flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium text-slate-200">
                                                {field.name}
                                            </h4>
                                            <p className="text-sm text-slate-400">
                                                {field.region}, {field.country}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setEditingField(
                                                        editingField ===
                                                            field.id
                                                            ? null
                                                            : field.id,
                                                    )
                                                }
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    onFieldDelete(field.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">
                                                Area:
                                            </span>
                                            <span className="text-slate-200">
                                                {calculateArea(
                                                    field.coordinates,
                                                ).toFixed(2)}{' '}
                                                ha
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">
                                                Lat:
                                            </span>
                                            <span className="text-slate-200">
                                                {field.center.lat().toFixed(6)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">
                                                Lng:
                                            </span>
                                            <span className="text-slate-200">
                                                {field.center.lng().toFixed(6)}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator className="my-3" />

                                    {editingField === field.id ? (
                                        <div className="space-y-3">
                                            <div>
                                                <Label
                                                    htmlFor={`name-${field.id}`}
                                                >
                                                    Field Name
                                                </Label>
                                                <Input
                                                    id={`name-${field.id}`}
                                                    value={field.name}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        onFieldUpdate(
                                                            field.id,
                                                            {
                                                                name: e.target
                                                                    .value,
                                                            },
                                                        )
                                                    }
                                                    placeholder="Enter field name"
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor={`crop-${field.id}`}
                                                >
                                                    Crop *
                                                </Label>
                                                <Select
                                                    value={field.crop || ''}
                                                    onValueChange={(value) =>
                                                        onFieldUpdate(field.id, {
                                                            crop: value,
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select crop" />
                                                    </SelectTrigger>
                                                    <SelectContent 
                                                        className="z-[1100]" 
                                                        position="popper"
                                                        sideOffset={4}
                                                    >
                                                        {cropData[zone].map((crop) => (
                                                            <SelectItem key={crop} value={crop}>
                                                                {crop}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor={`variety-${field.id}`}
                                                >
                                                    Variety *
                                                </Label>
                                                <Input
                                                    id={`variety-${field.id}`}
                                                    value={field.variety || ''}
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>,
                                                    ) =>
                                                        onFieldUpdate(
                                                            field.id,
                                                            {
                                                                variety:
                                                                    e.target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    placeholder="Enter variety name"
                                                    required
                                                />
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    setEditingField(null)
                                                }
                                                className="w-full"
                                            >
                                                Save
                                            </Button>
                                        </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {field.crop && field.variety ? (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">
                                                            {field.crop}
                                                        </Badge>
                                                        <Badge variant="secondary">
                                                            {field.variety}
                                                        </Badge>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-red-400 italic">
                                                            ⚠️ Crop and variety required
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingField(field.id)}
                                                            className="w-full"
                                                        >
                                                            <Edit3 className="mr-2 h-4 w-4" />
                                                            Add Crop & Variety
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 w-full border-slate-600 bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 hover:text-white"
                                        onClick={() => onFieldSelect(field)}
                                    >
                                        <MapPin className="mr-2 h-4 w-4" />
                                        View on Map
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>

                {/* Submit Button */}
                <div className="flex-shrink-0 border-t border-slate-700 bg-slate-800/50 p-4">
                    {(() => {
                        const incompleteFields = fields.filter(field => !field.crop || !field.variety);
                        const canSubmit = fields.length > 0 && incompleteFields.length === 0;
                        
                        return (
                            <div className="space-y-2">
                                {incompleteFields.length > 0 && (
                                    <p className="text-sm text-red-400">
                                        ⚠️ {incompleteFields.length} field{incompleteFields.length !== 1 ? 's' : ''} missing crop/variety
                                    </p>
                                )}
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 py-3 font-medium text-white hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {isSubmitting
                                        ? 'Submitting...'
                                        : canSubmit 
                                            ? `Submit ${fields.length} Field${fields.length !== 1 ? 's' : ''}`
                                            : 'Complete crop details to submit'}
                                </Button>
                            </div>
                        );
                    })()}
                </div>
            </Card>
        );
    },
);

interface FieldMappingProps {
    region?: string;
    zone?: 'Northern Ghana (Savannah Zone)' | 'Southern Ghana (Forest & Coastal Zone)';
}

const FieldMapping: React.FC<FieldMappingProps> = ({ region = 'Tamale', zone = 'Northern Ghana (Savannah Zone)' }) => {
    const [activeTool, setActiveTool] = useState<string>('');
    const [fields, setFields] = useState<FieldData[]>([]);
    const [selectedField, setSelectedField] = useState<FieldData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [drawingManager, setDrawingManager] =
        useState<google.maps.drawing.DrawingManager | null>(null);
    const [userLocation, setUserLocation] = useState<{
        lat: number;
        lng: number;
    } | null>(null);

    // Load Google Maps API
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: libraries,
    });

    // Ghana coordinates - focusing on Tamale region
    const ghanaBounds = {
        tamale: { lat: 9.4008, lng: -0.8393 },
        accra: { lat: 5.6037, lng: -0.187 },
        kumasi: { lat: 6.6885, lng: -1.6244 },
        capeCoast: { lat: 5.1036, lng: -1.2466 },
    };

    const getRegionCoordinates = (regionName: string) => {
        const normalizedRegion = regionName.toLowerCase();
        return (
            ghanaBounds[normalizedRegion as keyof typeof ghanaBounds] ||
            ghanaBounds.tamale
        );
    };

    const captureFieldSnapshot = React.useCallback(
        async (field: FieldData): Promise<string | null> => {
            try {
                // Calculate field bounds
                const bounds = new google.maps.LatLngBounds();
                field.coordinates.forEach((coord) => bounds.extend(coord));

                // Get center and calculate appropriate zoom level
                const center = bounds.getCenter();
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();

                // Calculate zoom level based on field size (simple approximation)
                const latDiff = ne.lat() - sw.lat();
                const lngDiff = ne.lng() - sw.lng();
                const maxDiff = Math.max(latDiff, lngDiff);

                // Determine zoom level (18 is max for satellite imagery)
                let zoom = 18;
                if (maxDiff > 0.01) zoom = 16;
                else if (maxDiff > 0.005) zoom = 17;
                else if (maxDiff > 0.002) zoom = 18;

                // Create polygon path string for Google Static Maps API
                const pathPoints = field.coordinates
                    .map((coord) => `${coord.lat()},${coord.lng()}`)
                    .join('|');

                // Build Google Maps Static API URL
                const staticMapUrl =
                    `https://maps.googleapis.com/maps/api/staticmap?` +
                    `center=${center.lat()},${center.lng()}&` +
                    `zoom=${zoom}&` +
                    `size=400x400&` +
                    `maptype=satellite&` +
                    `path=color:0xff0000ff|weight:3|fillcolor:0x22c55e33|${pathPoints}&` +
                    `key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;

                // Fetch the static map image
                const response = await fetch(staticMapUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch static map image');
                }

                // Convert to base64 data URL
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Failed to capture field snapshot:', error);
                return null;
            }
        },
        [],
    );

    const handleFieldDrawn = React.useCallback(
        async (field: FieldData) => {
            setFields((prev) => [...prev, field]);

            // Capture snapshot of the field
            const snapshot = await captureFieldSnapshot(field);
            if (snapshot) {
                // Add snapshot to field data
                setFields((prev) =>
                    prev.map((f) =>
                        f.id === field.id ? { ...f, image: snapshot } : f,
                    ),
                );
            }

            toast.success(`Field "${field.name}" created successfully`);
        },
        [captureFieldSnapshot],
    );

    // Initialize drawing manager - memoized to prevent re-creation
    const onMapLoad = React.useCallback(
        (map: google.maps.Map) => {
            setMap(map);

            const drawingManager = new google.maps.drawing.DrawingManager({
                drawingMode: null,
                drawingControl: false,
                polygonOptions: {
                    fillColor: '#22c55e',
                    fillOpacity: 0.3,
                    strokeColor: '#16a34a',
                    strokeWeight: 2,
                    clickable: true,
                    editable: true,
                    draggable: true,
                },
            });

            drawingManager.setMap(map);
            setDrawingManager(drawingManager);

            // Listen for polygon completion
            google.maps.event.addListener(
                drawingManager,
                'polygoncomplete',
                (polygon: google.maps.Polygon) => {
                    const path = polygon.getPath();
                    const bounds = new google.maps.LatLngBounds();

                    path.getArray().forEach((latLng) => bounds.extend(latLng));
                    const center = bounds.getCenter();

                    const newField: FieldData = {
                        id: Date.now().toString(),
                        name: `Field ${Date.now()}`,
                        coordinates: path.getArray(),
                        center: center,
                        area: 0, // Will be calculated
                        region,
                        country: 'Ghana',
                        createdAt: new Date(),
                    };

                    handleFieldDrawn(newField);
                    drawingManager.setDrawingMode(null);
                },
            );
        },
        [region, handleFieldDrawn],
    );

    const handleFieldUpdate = React.useCallback(
        (fieldId: string, updates: Partial<FieldData>) => {
            setFields((prev) =>
                prev.map((field) =>
                    field.id === fieldId ? { ...field, ...updates } : field,
                ),
            );
        },
        [],
    );

    const handleFieldDelete = React.useCallback(
        (fieldId: string) => {
            setFields((prev) => prev.filter((field) => field.id !== fieldId));
            if (selectedField?.id === fieldId) {
                setSelectedField(undefined);
            }
            toast.success('Field deleted successfully');
        },
        [selectedField?.id],
    );

    const handleFieldSelect = React.useCallback(
        (field: FieldData) => {
            setSelectedField(field);
            if (map) {
                map.setCenter(field.center);
                map.setZoom(15);
            }
        },
        [map],
    );

    const handleClearFields = React.useCallback(() => {
        setFields([]);
        setSelectedField(undefined);
        toast.success('All fields cleared');
    }, []);

    const handleLocateMe = React.useCallback(() => {
        if (navigator.geolocation) {
            toast.info('Getting your precise location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    if (map) {
                        // Create a marker for user's location
                        const userLocation = new google.maps.LatLng(
                            latitude,
                            longitude,
                        );

                        // Check accuracy
                        if (accuracy > 50) {
                            toast.error(
                                `GPS accuracy is ${Math.round(accuracy)}m. Consider moving to an open area.`,
                            );
                        }

                        // Store user location in state
                        setUserLocation({ lat: latitude, lng: longitude });

                        // Set map center to user location and zoom in
                        map.setCenter(userLocation);
                        map.setZoom(18); // Higher zoom for better detail

                        // Add a temporary marker to show user's location with accuracy circle
                        const userMarker = new google.maps.Marker();
                        userMarker.setPosition(userLocation);
                        userMarker.setMap(map);
                        userMarker.setTitle(
                            `Your Location (accuracy: ${Math.round(accuracy)}m)`,
                        );
                        userMarker.setIcon({
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#4285f4',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        });

                        // Add accuracy circle
                        const accuracyCircle = new google.maps.Circle({
                            strokeColor: '#4285f4',
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                            fillColor: '#4285f4',
                            fillOpacity: 0.2,
                            map: map,
                            center: userLocation,
                            radius: accuracy, // Show accuracy radius
                        });

                        // Remove the marker and circle after 8 seconds
                        setTimeout(() => {
                            userMarker.setMap(null);
                            accuracyCircle.setMap(null);
                        }, 8000);
                    }
                    toast.success(
                        `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`,
                    );
                },
                (error) => {
                    console.error('Geolocation error:', error);

                    let errorMessage = 'Unable to get your location. ';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage +=
                                'Please allow location access in your browser settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage +=
                                'GPS signal not available. Try moving to an open area.';
                            break;
                        case error.TIMEOUT:
                            errorMessage +=
                                'Location request timed out. Please try again.';
                            break;
                        default:
                            errorMessage += 'Unknown error occurred.';
                            break;
                    }

                    toast.error(errorMessage);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 25000, // Longer timeout for better GPS
                    maximumAge: 0, // Don't use cached location
                },
            );
        } else {
            toast.error('Geolocation is not supported by this browser');
        }
    }, [map]);

    // Auto-locate user when component loads
    useEffect(() => {
        if (isLoaded && map) {
            // Ask for permission and locate user automatically
            if (navigator.geolocation) {
                toast.info('Requesting your location permission...');

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude, accuracy } =
                            position.coords;

                        // Store user location in state
                        setUserLocation({ lat: latitude, lng: longitude });

                        const userLocationLatLng = new google.maps.LatLng(
                            latitude,
                            longitude,
                        );

                        // Check if accuracy is good enough (within 100 meters)
                        if (accuracy > 100) {
                            toast.error(
                                `Location accuracy is poor (${Math.round(accuracy)}m). Using GPS anyway.`,
                            );
                        }

                        // Set map center to user location
                        map.setCenter(userLocationLatLng);
                        map.setZoom(16); // Higher zoom for better field mapping

                        toast.success(
                            `Located you at: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (accuracy: ${Math.round(accuracy)}m)`,
                        );
                    },
                    (error) => {
                        console.error('Auto-location error:', error);

                        let errorMessage = 'Unable to get your location. ';
                        switch (error.code) {
                            case error.PERMISSION_DENIED:
                                errorMessage +=
                                    'Location access denied by user.';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMessage +=
                                    'Location information unavailable.';
                                break;
                            case error.TIMEOUT:
                                errorMessage += 'Location request timed out.';
                                break;
                            default:
                                errorMessage += 'Unknown error occurred.';
                                break;
                        }

                        toast.error(errorMessage);
                        // Continue with default region location if auto-location fails
                        toast.info(`Using default location: ${region}`);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 20000, // Increased timeout
                        maximumAge: 0, // Don't use cached location
                    },
                );
            } else {
                toast.error('Geolocation is not supported by this browser');
                toast.info(`Using default location: ${region}`);
            }
        }
    }, [isLoaded, map, region]);

    const handleEditFields = React.useCallback(() => {
        setActiveTool('edit');
        toast.info('Edit mode activated - click on fields to modify');
    }, []);

    // Handle tool selection
    const handleToolSelect = React.useCallback(
        (tool: string) => {
            setActiveTool(tool);

            if (drawingManager) {
                switch (tool) {
                    case 'draw':
                        drawingManager.setDrawingMode(
                            google.maps.drawing.OverlayType.POLYGON,
                        );
                        break;
                    case 'measure':
                        // For measurement, we'll use a different approach
                        break;
                    default:
                        drawingManager.setDrawingMode(null);
                        break;
                }
            }
        },
        [drawingManager],
    );

    const handleSubmit = React.useCallback(async () => {
        if (fields.length === 0) {
            toast.error('Please draw at least one field before submitting');
            return;
        }

        // Check if all fields have crop and variety
        const incompleteFields = fields.filter(field => !field.crop || !field.variety);
        if (incompleteFields.length > 0) {
            toast.error(`Please add crop and variety for ${incompleteFields.length} field${incompleteFields.length !== 1 ? 's' : ''}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const fieldsData = fields.map((field) => ({
                ...field,
                coordinates: field.coordinates.map((latLng) => [
                    latLng.lat(),
                    latLng.lng(),
                ]),
                center: [field.center.lat(), field.center.lng()],
            }));

            console.log('Submitting fields:', fieldsData);

            // Submit to Laravel backend using axios - store coordinates in DB
            const response = await axios.post('/fields', {
                fields: fieldsData,
                user_location: userLocation, // Include user's GPS location
                region: region,
                zone: zone, // Include agricultural zone
            });

            const result = response.data;

            if (result.success) {
                toast.success(`${fields.length} field(s) saved successfully`);
                console.log('Fields stored in database:', result.data);

                // Clear fields after successful submission
                setFields([]);
                setSelectedField(undefined);

                // Redirect to prediction page with submission info
                router.visit(`/prediction/${result.data.unique_submission_key}`);
            } else {
                toast.error(result.message || 'Failed to save fields');
            }
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to submit fields');
        } finally {
            setIsSubmitting(false);
        }
    }, [fields]);

    const regionCoords = React.useMemo(
        () => getRegionCoordinates(region),
        [region],
    );

    // Memoize map options for agricultural visualization
    const mapOptions = React.useMemo(
        () => ({
            mapTypeId: 'satellite', // Always satellite view
            disableDefaultUI: true,
            zoomControl: true,
            scaleControl: true,
            fullscreenControl: false,
            streetViewControl: false,
            rotateControl: false,
            tilt: 0,
            gestureHandling: 'greedy', // smoother pan/zoom on touch devices
            styles: [
                {
                    featureType: 'poi',
                    stylers: [{ visibility: 'off' }],
                },
                {
                    featureType: 'road',
                    stylers: [{ visibility: 'simplified' }],
                },
                {
                    featureType: 'administrative',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }],
                },
            ],
        }),
        [],
    );

    // Memoize the map center to prevent unnecessary re-renders
    // Use user location if available, otherwise fall back to region coordinates
    const mapCenter = React.useMemo(
        () => userLocation || { lat: regionCoords.lat, lng: regionCoords.lng },
        [userLocation, regionCoords],
    );

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">
                        Loading Google Maps...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen">
            <MemoizedGoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={12}
                onLoad={onMapLoad}
                mapTypeId={google.maps.MapTypeId.SATELLITE}
                options={mapOptions}
            >
                {/* Field center markers */}
                {fields.map((field) => (
                    <FieldMarker
                        key={`marker-${field.id}`}
                        field={field}
                        onSelect={handleFieldSelect}
                    />
                ))}

                {/* Field polygons */}
                {fields.map((field) => (
                    <FieldPolygon
                        key={field.id}
                        field={field}
                        isSelected={selectedField?.id === field.id}
                        onSelect={handleFieldSelect}
                    />
                ))}
            </MemoizedGoogleMap>

            <Toolbox
                onToolSelect={handleToolSelect}
                activeTool={activeTool}
                onClearFields={handleClearFields}
                onLocateMe={handleLocateMe}
                onEditFields={handleEditFields}
            />

            <FieldSidebar
                fields={fields}
                onFieldSelect={handleFieldSelect}
                onFieldUpdate={handleFieldUpdate}
                onFieldDelete={handleFieldDelete}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                selectedField={selectedField}
                zone={zone}
            />
        </div>
    );
};

export default FieldMapping;
