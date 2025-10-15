import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { MapPin, ArrowRight, Map } from 'lucide-react';

// Simple navigation function since we're using Inertia.js
const navigate = (url: string) => {
  window.location.href = url;
};

export default function SelectField() {
  const [selectedRegion, setSelectedRegion] = useState('Tamale');

  const ghanaRegions = [
    { name: 'Tamale', description: 'Northern Region', coordinates: '9.4008, -0.8393' },
    { name: 'Accra', description: 'Greater Accra', coordinates: '5.6037, -0.1870' },
    { name: 'Kumasi', description: 'Ashanti Region', coordinates: '6.6885, -1.6244' },
    { name: 'Cape Coast', description: 'Central Region', coordinates: '5.1036, -1.2466' },
    { name: 'Takoradi', description: 'Western Region', coordinates: '4.8845, -1.7554' },
    { name: 'Sunyani', description: 'Bono Region', coordinates: '7.3399, -2.3268' },
    { name: 'Ho', description: 'Volta Region', coordinates: '6.6008, 0.4713' },
    { name: 'Koforidua', description: 'Eastern Region', coordinates: '6.0941, -0.2590' }
  ];

  const handleStartMapping = () => {
    navigate(`/field-mapping/${selectedRegion}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full blur-lg opacity-30"></div>
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full">
                <MapPin className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
            AgriTech Field Mapping
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform your farming with precision field mapping and AI-powered agricultural insights. 
            Select your region and start optimizing your crop management today.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Region Selection */}
          <Card className="h-fit shadow-2xl border-0 bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <MapPin className="w-6 h-6 mr-3" />
                Select Your Region
              </CardTitle>
              <CardDescription className="text-green-100">
                Choose the region where your farm is located to get started with field mapping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div>
                <Label htmlFor="region-select" className="text-gray-300 font-semibold">Region</Label>
                <Input
                  id="region-select"
                  value={selectedRegion}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRegion(e.target.value)}
                  placeholder="Type or select a region"
                  className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ghanaRegions.map((region) => (
                  <Button
                    key={region.name}
                    variant={selectedRegion === region.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRegion(region.name)}
                    className={`justify-start transition-all duration-200 ${
                      selectedRegion === region.name 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-lg' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-green-500 hover:bg-gray-600'
                    }`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {region.name}
                  </Button>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-100">
                <Button 
                  onClick={handleStartMapping}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Map className="w-5 h-5 mr-2" />
                  Start Field Mapping
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="space-y-8">
            <Card className="shadow-2xl border-0 bg-gray-800/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-t-lg">
                <CardTitle className="text-xl">Advanced Mapping Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-1">Precise Field Drawing</h4>
                    <p className="text-gray-400 leading-relaxed">
                      Draw exact field boundaries with satellite imagery and intuitive mapping tools for maximum accuracy
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-3 rounded-xl shadow-lg">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-1">AI-Powered Analysis</h4>
                    <p className="text-gray-400 leading-relaxed">
                      Get comprehensive agricultural insights including yield predictions, disease risks, and market analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-3 rounded-xl shadow-lg">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-1">Smart Crop Management</h4>
                    <p className="text-gray-400 leading-relaxed">
                      Track crops, varieties, and receive personalized recommendations for optimal farm management
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Region Info */}
            {selectedRegion && (
              <Card className="shadow-2xl border-0 bg-gray-800/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center text-xl">
                    <Badge variant="secondary" className="mr-3 bg-white/20 text-white border-white/30">
                      Selected
                    </Badge>
                    {selectedRegion}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {ghanaRegions.find(r => r.name === selectedRegion) ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 p-4 rounded-lg border border-green-700">
                        <p className="text-gray-300">
                          <span className="font-semibold text-green-400">Description:</span> {ghanaRegions.find(r => r.name === selectedRegion)?.description}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 p-4 rounded-lg border border-blue-700">
                        <p className="text-gray-300">
                          <span className="font-semibold text-blue-400">Coordinates:</span> {ghanaRegions.find(r => r.name === selectedRegion)?.coordinates}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-800/50 to-slate-800/50 p-4 rounded-lg border border-gray-700">
                      <p className="text-gray-400">
                        Custom region selected. The map will center on this location.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-700/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-gray-300 font-medium">
              Powered by AgriTech AI • Precision Agriculture for Modern Farmers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
