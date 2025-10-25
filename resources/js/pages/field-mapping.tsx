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
    Settings,
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
const agricultureTowns = [
    { name: "Akumadan", region: "Ashanti", region_code: "GHAH", latitude: 6.5290, longitude: -1.7373, main_crops: ["tomato", "maize", "cassava"] },
    { name: "Tapa Abotoase", region: "Oti", region_code: "GHOT", latitude: 7.4000, longitude: 0.3000, main_crops: ["yam", "plantain", "cassava"] },
    { name: "Adugyama", region: "Ashanti", region_code: "GHAH", latitude: 6.9500, longitude: -1.9000, main_crops: ["cocoa", "rice", "plantain"] },
    { name: "Jasikan", region: "Oti", region_code: "GHOT", latitude: 7.4170, longitude: 0.4666, main_crops: ["cocoa", "oil palm"] },
    { name: "Bolgatanga", region: "Upper East", region_code: "GHUE", latitude: 10.7856, longitude: -0.8514, main_crops: ["sorghum", "millet", "groundnut"] },
    { name: "Wa", region: "Upper West", region_code: "GHUW", latitude: 10.0622, longitude: -2.5013, main_crops: ["maize", "cowpea", "sesame"] },
    { name: "Tamale", region: "Northern", region_code: "GHNP", latitude: 9.4329, longitude: -0.8485, main_crops: ["maize", "millet", "soybean"] },
    { name: "Sunyani", region: "Bono", region_code: "GHBO", latitude: 7.3390, longitude: -2.3290, main_crops: ["cassava", "yam", "plantain"] },
    { name: "Cape Coast", region: "Central", region_code: "GHCP", latitude: 5.1057, longitude: -1.2466, main_crops: ["cocoa", "coconut", "cassava"] },
    { name: "Koforidua", region: "Eastern", region_code: "GHEP", latitude: 6.0833, longitude: -0.2500, main_crops: ["oil palm", "cocoa", "plantain"] },
    { name: "Takoradi", region: "Western", region_code: "GHWP", latitude: 4.9042, longitude: -1.7599, main_crops: ["pineapple", "cocoa", "banana"] },
    { name: "Ho", region: "Volta", region_code: "GHTV", latitude: 6.6119, longitude: 0.4703, main_crops: ["rice", "oil palm", "cassava"] },
    { name: "Kumasi", region: "Ashanti", region_code: "GHAH", latitude: 6.7001, longitude: -1.6308, main_crops: ["plantain", "yam", "maize"] },
    { name: "Techiman", region: "Bono East", region_code: "GHBE", latitude: 7.5833, longitude: -1.9333, main_crops: ["yam", "maize", "cassava"] },
    { name: "Damongo", region: "Savannah", region_code: "GHSV", latitude: 9.1000, longitude: -1.8000, main_crops: ["sorghum", "millet", "cowpea"] },
    { name: "Nalerigu", region: "Northern East", region_code: "GHNE", latitude: 9.9500, longitude: -0.8333, main_crops: ["groundnut", "yams", "cassava"] },
    { name: "Ahamansu", region: "Oti", region_code: "GHOT", latitude: 6.8000, longitude: 0.6000, main_crops: ["cocoa", "oil palm"] },
    { name: "Kenyasi", region: "Ahafo", region_code: "GHAF", latitude: 6.7667, longitude: -2.1667, main_crops: ["cocoa", "plantain", "cassava"] },
    { name: "Bawku", region: "Upper East", region_code: "GHUE", latitude: 11.0598, longitude: -0.4807, main_crops: ["groundnut", "sesame", "millet"] },
    { name: "Akroso", region: "Central", region_code: "GHCP", latitude: 5.1750, longitude: -0.8680, main_crops: ["cocoa", "cassava", "plantain"] }
  ];
  
// Crop data for different regions
const cropData = {
    'Northern Ghana (Savannah Zone)': [
        'Cocoa', 'Maize', 'Sorghum', 'Millet', 'Groundnut (Peanut)', 'Yam', 'Rice',
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
    image?: File;
    createdAt: Date;
}

interface ToolboxProps {
    onToolSelect: (tool: string) => void;
    activeTool: string;
    onClearFields: () => void;
    onLocateMe: () => void;
    onEditFields: () => void;
    region: string;
}

const Toolbox: React.FC<ToolboxProps> = React.memo(
    ({ onToolSelect, activeTool, onClearFields, onLocateMe, onEditFields, region }) => {
        const tools = [
            { id: 'draw', icon: Pencil, label: 'Draw', color: 'emerald' },
            { id: 'edit', icon: Edit3, label: 'Edit', color: 'blue' },
            { id: 'measure', icon: Ruler, label: 'Measure', color: 'purple' },
            { id: 'locate', icon: Navigation, label: 'Locate', color: 'orange' },
            { id: 'clear', icon: Trash2, label: 'Clear', color: 'red' },
        ];

        const handleClick = (id: string) => {
            if (id === 'clear') return onClearFields();
            if (id === 'locate') return onLocateMe();
            if (id === 'edit') return onEditFields();
            onToolSelect(id);
        };

        return (
            <Card className="absolute top-4 right-4 z-50 border-0 bg-white/95 backdrop-blur-xl shadow-lg rounded-xl overflow-hidden">
                <CardContent className="p-2 sm:p-3">
                    {/* Header - Hidden on mobile */}
                    <div className="hidden sm:flex items-center gap-2 mb-3">
                        <div className="bg-emerald-100 p-1.5 rounded-lg">
                            <Settings className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 text-sm">Map Tools</h3>
                            {/* <p className="text-gray-500 text-xs">in {region}</p> */}
                        </div>
                    </div>
                    
                    {/* Tools Horizontal */}
                    <div className="flex gap-1">
                        {tools.map(({ id, icon: Icon, label, color }) => {
                        const active = activeTool === id;
                            const colorClasses = {
                                emerald: active ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
                                blue: active ? 'bg-blue-500 text-white shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                                purple: active ? 'bg-purple-500 text-white shadow-purple-200' : 'bg-purple-50 text-purple-600 hover:bg-purple-100',
                                orange: active ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-orange-50 text-orange-600 hover:bg-orange-100',
                                red: active ? 'bg-red-500 text-white shadow-red-200' : 'bg-red-50 text-red-600 hover:bg-red-100',
                            };
                            
                        return (
                            <Button
                                key={id}
                                    variant="ghost"
                                    className={`h-8 sm:h-10 px-2 sm:px-3 rounded-lg transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]} ${
                                        active ? 'shadow-md scale-105' : 'hover:scale-105'
                                }`}
                                onClick={() => handleClick(id)}
                                    title={label}
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="text-xs font-medium hidden md:inline">{label}</span>
                                    </div>
                            </Button>
                        );
                    })}
                    </div>
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
    region: string;
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
        region,
    }) => {
        const [editingField, setEditingField] = useState<string | null>(null);
        const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <>
                {/* Responsive Sidebar */}
                <div className={`fixed top-0 left-0 h-full w-80 z-[1000] flex-col bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 ${
                    mobileMenuOpen ? 'flex' : 'hidden sm:flex'
                }`}>
                {/* Dashboard Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <MapPin className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-lg">Field Dashboard</h2>
                                <p className="text-emerald-100 text-sm">Mapping in {region}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 rounded-full px-4 py-2">
                                <span className="text-white font-bold text-lg">{fields.length}</span>
                            </div>
                            {/* Mobile Close Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-white/20 text-white sm:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                                title="Close sidebar"
                            >
                                <div className="w-4 h-0.5 bg-white rotate-45"></div>
                                <div className="w-4 h-0.5 bg-white -rotate-45 -translate-y-0.5"></div>
                            </Button>
                        </div>
                    </div>
                </div>
                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
                    {fields.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-12">
                                <div className="bg-emerald-100 rounded-full p-6 mb-6">
                                    <MapPin className="h-12 w-12 text-emerald-600" />
                            </div>
                                <h3 className="font-semibold text-gray-800 text-xl mb-2">
                                    No Fields Yet
                                </h3>
                                <p className="text-gray-500 text-center mb-8 max-w-xs">
                                    Start mapping your farm by drawing your first field
                                </p>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 w-full">
                                    <div className="flex items-center gap-2 text-emerald-700 text-sm mb-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span className="font-medium">Quick Start</span>
                                    </div>
                                    <p className="text-emerald-600 text-sm">
                                        Click "Draw" in the toolbox to begin mapping
                                    </p>
                                </div>
                        </div>
                    ) : (
                    <div className="space-y-3">
                        {fields.map((field) => (
                            <div
                                key={field.id}
                                className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md ${
                                    selectedField?.id === field.id
                                        ? 'border-emerald-500 bg-emerald-50/50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            <h4 className="font-semibold text-gray-800 text-sm">{field.name}</h4>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-emerald-100 hover:text-emerald-600 border border-gray-200 text-emerald-600"
                                                onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                                                title="Edit field"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 border border-gray-200 text-red-600"
                                                onClick={() => onFieldDelete(field.id)}
                                                title="Delete field"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Minimal Stats */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-emerald-50 rounded px-2 py-1">
                                            <div className="text-xs text-emerald-600">Area</div>
                                            <div className="text-sm font-bold text-emerald-700">
                                                {calculateArea(field.coordinates).toFixed(1)} ha
                                        </div>
                                        </div>
                                        <div className="bg-blue-50 rounded px-2 py-1">
                                            <div className="text-xs text-blue-600">Location</div>
                                            <div className="text-sm font-bold text-blue-700">
                                                {field.center.lat().toFixed(3)}
                                            </div>
                                        </div>
                                    </div>

                                    {editingField === field.id ? (
                                        <div className="space-y-3 bg-gray-50 rounded-lg p-3 mt-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Edit3 className="h-3 w-3 text-emerald-600" />
                                                <span className="text-sm font-medium text-gray-700">Edit Field</span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {/* Field Name */}
                                            <div>
                                                    <Label htmlFor={`name-${field.id}`} className="text-xs font-medium text-gray-600">
                                                    Field Name
                                                </Label>
                                                <Input
                                                    id={`name-${field.id}`}
                                                    value={field.name}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            onFieldUpdate(field.id, { name: e.target.value })
                                                    }
                                                    placeholder="Enter field name"
                                                        className="mt-1 h-8 text-sm text-gray-600 placeholder:text-gray-400"
                                                />
                                            </div>
                                                
                                                {/* Crop Selection */}
                                            <div>
                                                    <Label htmlFor={`crop-${field.id}`} className="text-xs font-medium text-gray-600">
                                                        Crop
                                                </Label>
                                                <Select
                                                    value={field.crop || ''}
                                                    onValueChange={(value) =>
                                                            onFieldUpdate(field.id, { crop: value })
                                                    }
                                                >
                                                        <SelectTrigger className="mt-1 h-8 text-sm text-gray-600">
                                                            <SelectValue placeholder="Select or type crop" className="text-gray-600" />
                                                    </SelectTrigger>
                                                        <SelectContent className="z-[1100]" position="popper" sideOffset={4}>
                                                        {cropData[zone].map((crop) => (
                                                            <SelectItem key={crop} value={crop}>
                                                                {crop}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                    
                                                    {/* Custom Crop Input */}
                                                    {/* <div className="mt-1">
                                                        <Input
                                                            value={field.crop || ''}
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                                onFieldUpdate(field.id, { crop: e.target.value })
                                                            }
                                                            placeholder="Or type custom crop name"
                                                            className="h-8 text-sm"
                                                        />
                                                    </div> */}
                                            </div>
                                                
                                                {/* Optional Variety */}
                                            <div>
                                                    <Label htmlFor={`variety-${field.id}`} className="text-xs font-medium text-gray-600">
                                                        Variety (Optional)
                                                </Label>
                                                <Input
                                                    id={`variety-${field.id}`}
                                                    value={field.variety || ''}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                            onFieldUpdate(field.id, { variety: e.target.value })
                                                        }
                                                        placeholder="Enter variety (optional)"
                                                        className="mt-1 h-8 text-sm text-gray-600"
                                                />
                                            </div>
                                            </div>
                                            
                                            <div className="flex gap-1 pt-2">
                                            <Button
                                                size="sm"
                                                    onClick={() => setEditingField(null)}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                                            >
                                                Save
                                            </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setEditingField(null)}
                                                    className="flex-1 h-7 text-xs"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                        ) : (
                                        <div className="mt-2">
                                            {field.crop ? (
                                                <div className="space-y-1">
                                                    <div className="flex gap-1">
                                                        <Badge className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1">
                                                            {field.crop}
                                                        </Badge>
                                                        {field.variety && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">
                                                            {field.variety}
                                                        </Badge>
                                                        )}
                                                    </div>
                                                    {!field.variety && (
                                                        <p className="text-xs text-gray-500">No variety specified</p>
                                                    )}
                                                    </div>
                                                ) : (
                                                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                                                    <p className="text-xs text-amber-600">Add crop information</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>

                {/* Dashboard Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 bg-white p-6">
                    {(() => {
                        const incompleteFields = fields.filter(field => !field.crop);
                        const canSubmit = fields.length > 0 && incompleteFields.length === 0;
                        
                        return (
                            <div className="space-y-3">
                                {incompleteFields.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <p className="text-sm text-amber-700">
                                            ⚠️ {incompleteFields.length} field{incompleteFields.length !== 1 ? 's' : ''} need crop information
                                    </p>
                                    </div>
                                )}
                                <Button
                                    onClick={onSubmit}
                                    disabled={!canSubmit || isSubmitting}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 py-3 font-semibold text-white hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 rounded-xl"
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    {isSubmitting
                                        ? 'Submitting...'
                                        : canSubmit 
                                            ? `Submit ${fields.length} Field${fields.length !== 1 ? 's' : ''}`
                                            : 'Add Crop Information'}
                                </Button>
                            </div>
                        );
                    })()}
                </div>
            </div>

                {/* Mobile Hamburger Button */}
                <div className="fixed bottom-4 left-4 z-[1000] sm:hidden">
                    <Button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg"
                    >
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-4 h-0.5 bg-white transition-transform duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
                            <div className={`w-4 h-0.5 bg-white transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`}></div>
                            <div className={`w-4 h-0.5 bg-white transition-transform duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
                        </div>
                    </Button>
                </div>
            </>
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

    // Get region coordinates from agricultureTowns array
    const getRegionCoordinates = (regionName: string) => {
        const normalizedRegion = regionName.toLowerCase();
        const regionData = agricultureTowns.find(
            town => town.name.toLowerCase() === normalizedRegion
        );
        
        if (regionData) {
            return { lat: regionData.latitude, lng: regionData.longitude };
        }
        
        // Fallback to Tamale if region not found
        return { lat: 9.4329, lng: -0.8485 };
    };

    const captureFieldSnapshot = React.useCallback(
        async (field: FieldData): Promise<File | null> => {
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

                // Convert to File object instead of base64
                const blob = await response.blob();
                const fileName = `field_${field.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
                return new File([blob], fileName, { type: 'image/png' });
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

    // Set map to focus on the selected region
    useEffect(() => {
        if (isLoaded && map) {
            const regionCoords = getRegionCoordinates(region);
            map.setCenter(regionCoords);
            map.setZoom(15); // Good zoom level for field mapping
            toast.info(`Map focused on ${region} region`);
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

        // Check if all fields have crop (variety is optional)
        const incompleteFields = fields.filter(field => !field.crop);
        if (incompleteFields.length > 0) {
            toast.error(`Please add crop information for ${incompleteFields.length} field${incompleteFields.length !== 1 ? 's' : ''}`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepare FormData for file uploads
            const formData = new FormData();
            
            // Add non-file data
            formData.append('user_location', JSON.stringify(userLocation));
            formData.append('region', region);
            formData.append('zone', zone);
            
            // Add fields data with file handling
            fields.forEach((field, index) => {
                formData.append(`fields[${index}][name]`, field.name);
                formData.append(`fields[${index}][coordinates]`, JSON.stringify(
                    field.coordinates.map((latLng) => [latLng.lat(), latLng.lng()])
                ));
                formData.append(`fields[${index}][center]`, JSON.stringify([
                    field.center.lat(), 
                    field.center.lng()
                ]));
                formData.append(`fields[${index}][region]`, field.region);
                formData.append(`fields[${index}][country]`, field.country);
                formData.append(`fields[${index}][crop]`, field.crop || '');
                formData.append(`fields[${index}][variety]`, field.variety || '');
                
                // Add image file if it exists
                if (field.image) {
                    formData.append(`fields[${index}][image]`, field.image);
                }
            });

            console.log('Submitting fields with FormData');

            // Submit to Laravel backend using FormData for file uploads
            const response = await axios.post('/fields', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
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
    // Always use region coordinates for focused mapping
    const mapCenter = React.useMemo(
        () => regionCoords,
        [regionCoords],
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
                zoom={15}
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
                region={region}
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
                region={region}
            />
        </div>
    );
};

export default FieldMapping;

