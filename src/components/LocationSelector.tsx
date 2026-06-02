'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Departamento {
    id: number;
    departamento: string;
    ciudades: string[];
}

interface LocationSelectorProps {
    selectedCity?: string;
    setSelectedCity: (city: string) => void;
    selectedDepartment: string;
    setSelectedDepartment: (department: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
    selectedCity,
    setSelectedCity,
    selectedDepartment,
    setSelectedDepartment
}) => {
    const t = useTranslations('locationSelector');
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('/data/colombia.json');
                const data: Departamento[] = await response.json();
                setDepartamentos(data);
            } catch (error) {
                console.error('Error loading departments:', error);
            }
        };

        fetchDepartments();
    }, []);

    useEffect(() => {
        const department = departamentos.find(dep => dep.departamento === selectedDepartment);
        setCities(department ? department.ciudades : []);
    }, [selectedDepartment, departamentos]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Selector */}
            <div className="group">
                <label className="block text-accent-cyan-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base">
                    {`🗺️ ${t('department')}`}
                </label>
                <select
                    className="w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white focus:border-accent-cyan-500 focus:outline-none transition-all group-hover:border-accent-cyan-400 appearance-none cursor-pointer"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                    }}
                >
                    <option value="" className="bg-neutral-800">{t('selectDepartment')}</option>
                    {departamentos.map((departamento) => (
                        <option key={departamento.id} value={departamento.departamento} className="bg-neutral-800">
                            {departamento.departamento}
                        </option>
                    ))}
                </select>
            </div>

            {/* City Selector */}
            <div className="group">
                <label className="block text-accent-cyan-400 font-bold mb-2 uppercase tracking-wide text-sm md:text-base">
                    {`🏙️ ${t('city')}`}
                </label>
                <select
                    className={`w-full bg-neutral-800 border-4 border-neutral-600 rounded-lg py-3 px-4 text-white focus:border-accent-cyan-500 focus:outline-none transition-all group-hover:border-accent-cyan-400 appearance-none cursor-pointer ${
                        cities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    value={selectedCity || ''}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={cities.length === 0}
                    style={{
                        backgroundImage: cities.length > 0 ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` : 'none',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                    }}
                >
                    <option value="" className="bg-neutral-800">
                        {cities.length === 0 ? t('firstSelectDepartment') : t('selectCity')}
                    </option>
                    {cities.map((city, index) => (
                        <option key={index} value={city} className="bg-neutral-800">
                            {city}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default LocationSelector;
