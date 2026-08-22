'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LocationSelector from './LocationSelector';
import { useTranslations } from 'next-intl';

interface ModalProps {
    openModal: boolean;
    handleModal: () => void;
}

const SkateProfileCompletionModal: React.FC<ModalProps> = ({ openModal, handleModal }) => {
    const [formData, setFormData] = useState({ phone: '', username: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const { data: session } = useSession();
    const router = useRouter();
    const t = useTranslations('skateProfileModal');

    const [selectedCity, setSelectedCity] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');

    // Debounced username availability check
    useEffect(() => {
        if (!formData.username || formData.username.length < 3) {
            setUsernameStatus('idle');
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
            setUsernameStatus('idle');
            return;
        }

        const timer = setTimeout(async () => {
            setUsernameStatus('checking');
            try {
                const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(formData.username)}`);
                const data = await res.json();
                setUsernameStatus(data.available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [formData.username]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!session?.user) {
            setError(t('errorNotAuth'));
            setLoading(false);
            return;
        }

        // Form validations
        if (!formData.username) {
            setError('Username is required');
            setLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
            setError('Username must be 3-20 characters, letters, numbers and underscores only');
            setLoading(false);
            return;
        }

        if (usernameStatus === 'taken') {
            setError('Username is already taken. Please choose another one.');
            setLoading(false);
            return;
        }

        if (!formData.phone) {
            setError(t('errorPhoneRequired'));
            setLoading(false);
            return;
        }

        if (!selectedDepartment) {
            setError(t('errorSelectDepartment'));
            setLoading(false);
            return;
        }

        if (!selectedCity) {
            setError(t('errorSelectCity'));
            setLoading(false);
            return;
        }

        try {
            const payload = {
                email: session.user.email,
                username: formData.username,
                phone: formData.phone,
                ciudad: selectedCity,
                departamento: selectedDepartment,
            };

            console.log('Completing profile:', payload);

            // Update user profile (PUT instead of POST)
            const response = await fetch('/api/skate_profiles/general_info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t('errorCompleting'));
            }

            console.log('Profile completed successfully:', data);
            handleModal();

            // Reload page to update session state
            window.location.reload();
        } catch (error) {
            console.error('Error completing profile:', error);
            setError(error instanceof Error ? error.message : t('errorUnknown'));
        } finally {
            setLoading(false);
        }
    };

    if (!openModal) return null;

    return (
        <div className="fixed inset-0 w-full h-full bg-black bg-opacity-70 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="w-full h-full md:max-w-[460px] md:h-auto bg-neutral-900 shadow-2xl shadow-accent-pink-500/30 py-2 rounded-md flex flex-col border-2 border-accent-pink-400">
                <h2 className="text-base font-black uppercase tracking-wider text-accent-pink-400 border-b border-accent-pink-400/30 py-3 px-4 mb-4">
                    {t('title')}
                </h2>

                {/* Error message */}
                {error && (
                    <div className="mx-4 mb-4 bg-red-900/40 border border-red-500 text-red-200 px-4 py-3 rounded">
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4 flex-grow">
                    {/* Username field */}
                    <div>
                        <label className="block text-accent-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
                            Username:
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border-2 rounded shadow-sm focus:outline-none bg-neutral-800 text-white placeholder:text-neutral-500 pr-10 transition-colors ${
                                    usernameStatus === 'taken'
                                        ? 'border-red-500 focus:border-red-400'
                                        : usernameStatus === 'available'
                                            ? 'border-green-500 focus:border-green-400'
                                            : 'border-neutral-700 focus:border-accent-cyan-400'
                                }`}
                                placeholder="@yourusername"
                                required
                                minLength={3}
                                maxLength={20}
                                pattern="[a-zA-Z0-9_]+"
                            />
                            {/* Status indicator */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameStatus === 'checking' && (
                                    <div className="animate-spin h-4 w-4 border-2 border-accent-cyan-400 border-t-transparent rounded-full"></div>
                                )}
                                {usernameStatus === 'available' && (
                                    <span className="text-green-400 text-lg font-bold">✓</span>
                                )}
                                {usernameStatus === 'taken' && (
                                    <span className="text-red-400 text-lg font-bold">✗</span>
                                )}
                            </div>
                        </div>
                        <p className="text-neutral-400 text-xs mt-1">
                            {usernameStatus === 'checking' && <span className="text-accent-cyan-400">Checking availability...</span>}
                            {usernameStatus === 'available' && <span className="text-green-400 font-bold">Username available!</span>}
                            {usernameStatus === 'taken' && <span className="text-red-400 font-bold">Username already taken</span>}
                            {(usernameStatus === 'idle' || usernameStatus === 'checking') && '3-20 characters, letters, numbers and underscores only'}
                        </p>
                    </div>

                    {/* Phone field */}
                    <div>
                        <label className="block text-accent-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
                            {t('phone')}:
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border-2 border-neutral-700 focus:border-accent-cyan-400 rounded shadow-sm focus:outline-none bg-neutral-800 text-white placeholder:text-neutral-500 transition-colors"
                            required
                        />
                    </div>

                    {/* Location selection component */}
                    <LocationSelector
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                        selectedDepartment={selectedDepartment}
                        setSelectedDepartment={setSelectedDepartment}
                    />

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="w-full bg-accent-pink-500 hover:bg-accent-pink-600 active:scale-95 text-white font-black uppercase tracking-wider py-3 px-4 rounded border-2 border-accent-pink-300 shadow-lg shadow-accent-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? t('loading') : t('submit')}
                    </button>
                </form>

                {/* Close button */}
                <div className="border-t border-accent-pink-400/30 flex justify-between items-center px-4 pt-2">
                    <button
                        type="button"
                        className="h-8 px-3 text-sm rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors"
                        onClick={handleModal}
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkateProfileCompletionModal;
