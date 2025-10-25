// GhanaMap.tsx
import { useEffect, useRef } from "react";
import GhanaSVG from "./GhanaSVG";

interface Props {
  selectedRegionCode?: string;
  onRegionClick?: (regionCode: string) => void;
  regionCoordinates?: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

const GhanaMap: React.FC<Props> = ({ selectedRegionCode, onRegionClick, regionCoordinates }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  console.log(selectedRegionCode)
  useEffect(() => {
    if (!svgRef.current) return;
  
    const paths = svgRef.current.querySelectorAll("path[id]");
  
    paths.forEach((path: any) => {
      const code = path.id;

      if (!selectedRegionCode) {
        // Show full map when nothing selected
        path.style.display = "block";
        path.style.fill = "#D1FAE5";
        path.style.stroke = "#065F46";
        path.style.strokeWidth = "0.8";
        return;
      }

      // Hide non-selected regions
      if (selectedRegionCode !== code) {
        path.style.display = "none";
        return;
      }

      // Show selected region only
      path.style.display = "block";
      path.style.fill = "#059669";
      path.style.stroke = "#034732";
      path.style.strokeWidth = "2";
    });
  }, [selectedRegionCode]);
  
  return (
    <div className="w-full h-64 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border">
      {regionCoordinates ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-3 mx-auto">
              <span className="text-white font-bold text-lg">📍</span>
            </div>
            <h3 className="font-semibold text-emerald-900 text-lg mb-1">{regionCoordinates.name}</h3>
            <p className="text-sm text-emerald-700">
              {regionCoordinates.latitude.toFixed(4)}, {regionCoordinates.longitude.toFixed(4)}
            </p>
            <div className="mt-2 text-xs text-emerald-600">
              Region: {selectedRegionCode}
            </div>
          </div>
        </div>
      ) : (
        <GhanaSVG ref={svgRef} className="w-full h-full" />
      )}
    </div>
  );
};

export default GhanaMap;
