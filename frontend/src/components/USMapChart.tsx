import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { StateRegistrationData } from '@outlive/shared';

// TopoJSON URL for US states from react-simple-maps
const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// State FIPS codes to state abbreviations mapping
const FIPS_TO_STATE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY', '72': 'PR'
};

// State names mapping
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington DC', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
  WY: 'Wyoming', PR: 'Puerto Rico'
};

interface USMapChartProps {
  data: StateRegistrationData[];
  className?: string;
}

export const USMapChart: React.FC<USMapChartProps> = ({ data, className = '' }) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Create a map for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.state, d.count));
    return map;
  }, [data]);

  const maxCount = useMemo(() => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.count));
  }, [data]);

  // Get color based on count (using our blue colors)
  const getStateColor = (stateCode: string): string => {
    const count = dataMap.get(stateCode) ?? 0;
    if (count === 0) return '#f3f4f6'; // neutral-100

    const intensity = count / maxCount;
    if (intensity < 0.25) return '#e0f2fe';
    if (intensity < 0.5) return '#7dd3fc';
    if (intensity < 0.75) return '#4ac0ff';
    return '#37a4ff';
  };

  const handleMouseMove = (e: React.MouseEvent, stateCode: string) => {
    const container = e.currentTarget.closest('.us-map-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setHoveredState(stateCode);
  };

  const hoveredData = hoveredState ? {
    name: STATE_NAMES[hoveredState] || hoveredState,
    count: dataMap.get(hoveredState) ?? 0
  } : null;

  return (
    <div className={`relative us-map-container ${className}`}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{
          scale: 1200
        }}
        style={{ width: '100%', height: '400px' }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = geo.id;
              const stateCode = FIPS_TO_STATE[fips] || '';

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={hoveredState === stateCode ? '#ff7c66' : getStateColor(stateCode)}
                  stroke="#9ca3af"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', cursor: 'pointer' },
                    pressed: { outline: 'none' }
                  }}
                  onMouseMove={(e) => handleMouseMove(e, stateCode)}
                  onMouseLeave={() => setHoveredState(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {hoveredState && hoveredData && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-neutral-900"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 50,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-medium">{hoveredData.name}</div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: '#37a4ff' }}
            />
            <span>{hoveredData.count} member{hoveredData.count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-[10px] text-neutral-400">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded" style={{ backgroundColor: '#f3f4f6' }} />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded" style={{ backgroundColor: '#e0f2fe' }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded" style={{ backgroundColor: '#7dd3fc' }} />
          <span>Med</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded" style={{ backgroundColor: '#4ac0ff' }} />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded" style={{ backgroundColor: '#37a4ff' }} />
          <span>Top</span>
        </div>
      </div>
    </div>
  );
};
