"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button" 
import { MapPin, Leaf, Droplets, AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SelectField() {
  const [step, setStep] = useState<"region" | "field" | "crops" | "review">("region")
  const [selectedRegion, setSelectedRegion] = useState("")
  const [search, setSearch] = useState("")
 
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
  
  

  const filteredRegions = agricultureTowns.filter((region : any) => 
    region.name.toLowerCase().includes(search.toLowerCase()) || 
    region.region.toLowerCase().includes(search.toLowerCase())
    || region.region_code.toLowerCase().includes(search.toLowerCase())
  )
  
 
  

  const isRegionValid = selectedRegion.length > 0 

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">AgriTech Field Mapper</h1>
              <p className="text-sm text-emerald-600">Precision farming starts here</p>
            </div>
          </div>
          <div className="flex gap-2">
            {["region", "field", "crops", "review"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step === s
                      ? "bg-emerald-600 text-white"
                      : ["region", "field", "crops", "review"].indexOf(step) > i
                        ? "bg-emerald-200 text-emerald-700"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${["region", "field", "crops", "review"].indexOf(step) > i ? "bg-emerald-200" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Step 1: Region Selection */}
        {step === "region" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-emerald-900 mb-2">Select Your Region</h2>
              <p className="text-gray-600">Choose the region where your farm is located</p>
              {/* search input, text color gray-500 */}
              <Input type="text" 
              placeholder="Search for a region" className="w-full text-gray-500" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredRegions.length > 0 ? filteredRegions.map((region : any) => (
                <button
                  key={region.name}
                  onClick={() => setSelectedRegion(region.name)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedRegion === region.name
                      ? "border-emerald-600 bg-emerald-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin
                      className={`w-5 h-5 flex-shrink-0 ${selectedRegion === region.name ? "text-emerald-600" : "text-gray-400"}`}
                    />
                    {selectedRegion === region.name && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />}
                  </div>
                  <h3
                    className={`font-semibold ${selectedRegion === region.name ? "text-emerald-900" : "text-gray-900"}`}
                  >
                    {region.name}
                  </h3>
                  <p className="text-sm text-gray-500">{region.region}</p>
                </button>
              )) : (
                <div className="text-gray-500 text-center">No regions found matching your search</div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-8">
              <Button
                onClick={() => window.location.href = `/field-mapping/${selectedRegion}`}
                disabled={!isRegionValid}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
 
      </div>
    </div>
  )
}
