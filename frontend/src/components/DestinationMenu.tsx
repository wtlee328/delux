import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export const DESTINATION_GROUPS = [
    {
        region: '中國西南',
        items: ['西藏', '四川', '雲南', '貴州']
    },
    {
        region: '中國西北',
        items: ['新疆', '絲路／甘南', '青海', '寧夏／內蒙']
    },
    {
        region: '中國中南',
        items: ['江西', '安徽', '江南', '山東']
    },
    {
        region: '東南亞',
        items: ['富國島', '峇里島']
    }
];

const DestinationMenu: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentDestination = searchParams.get('destination') || '';

    const handleSelect = (dest: string) => {
        navigate(`/agency/dashboard?destination=${encodeURIComponent(dest)}`);
    };

    return (
        <nav className="hidden md:flex items-center h-full ml-6">
            {DESTINATION_GROUPS.map((group) => {
                // Check if current destination matches the region or one of its items
                const isActive = currentDestination === group.region || group.items.includes(currentDestination);
                
                return (
                    <div key={group.region} className="relative group h-full">
                        <button 
                            className={`flex items-center gap-1 px-4 py-5 text-[15px] font-medium transition-all border-b-[3px] h-full
                                ${isActive 
                                    ? 'text-blue-600 border-blue-600 bg-blue-50/30' 
                                    : 'text-slate-600 border-transparent hover:text-blue-600 hover:bg-slate-50'
                                }
                            `}
                        >
                            {group.region}
                            <ChevronDown 
                                size={14} 
                                className={`transition-transform duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} group-hover:rotate-180`} 
                            />
                        </button>
                        
                        {/* Dropdown */}
                        <div className="absolute top-full left-0 w-48 bg-white shadow-xl rounded-b-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top z-50">
                            <div className="py-1">
                                {group.items.map(item => (
                                    <button
                                        key={item}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(item);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-sm transition-colors hover:bg-slate-50 flex items-center justify-between
                                            ${currentDestination === item 
                                                ? 'text-blue-600 font-medium bg-blue-50' 
                                                : 'text-slate-600 hover:text-slate-900'
                                            }
                                        `}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </nav>
    );
};

export default DestinationMenu;
