import React, { useState, useEffect, useCallback } from 'react';
import { Center } from '../../types';
import { getAllCenters, addCenterAndUser, removeCenter } from '../../services/firebaseService';
import Modal from '../shared/Modal';

const CenterManagement: React.FC = () => {
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        email: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [centerToDelete, setCenterToDelete] = useState<Center | null>(null);

    const fetchCenters = useCallback(async () => {
        setLoading(true);
        const fetchedCenters = await getAllCenters();
        setCenters(fetchedCenters);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCenters();
    }, [fetchCenters]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value }));
    }

    const handleAddCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.name || !formData.location || !formData.email || !formData.password) {
            setError('All fields are required.');
            return;
        }
        setIsSubmitting(true);
        try {
            await addCenterAndUser(formData);
            setFormData({ name: '', location: '', email: '', password: '' });
            fetchCenters(); // Refresh list
        } catch (error) {
            console.error("Failed to add center:", error);
            setError(error instanceof Error ? error.message : "Could not add center.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmRemoveCenter = async () => {
        if (!centerToDelete) return;
        try {
            await removeCenter(centerToDelete.id);
            fetchCenters(); // Refresh list
        } catch (error) {
            console.error("Failed to remove center:", error);
            alert("Could not remove center. Make sure no students or users are associated with it.");
        } finally {
            setCenterToDelete(null); // Close modal
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Add New Center</h3>
                        <form onSubmit={handleAddCenter} className="space-y-4">
                            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</p>}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Center Name</label>
                                <input type="text" id="name" value={formData.name} onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                                <input type="text" id="location" value={formData.location} onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                            </div>
                             <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Center Login Email</label>
                                <input type="email" id="email" value={formData.email} onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                            </div>
                             <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" id="password" value={formData.password} onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
                            </div>
                            <button type="submit" disabled={isSubmitting}
                                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 transition-colors">
                                {isSubmitting ? "Adding..." : "Add Center"}
                            </button>
                        </form>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">Existing Centers</h3>
                        {loading ? <p>Loading centers...</p> : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {centers.map(center => (
                                            <tr key={center.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{center.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{center.location}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => setCenterToDelete(center)} className="text-red-600 hover:text-red-900">Remove</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {centers.length === 0 && <p className="text-center text-gray-500 py-8">No centers found.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={!!centerToDelete} onClose={() => setCenterToDelete(null)} title="Confirm Center Deletion">
                {centerToDelete && (
                    <div>
                        <p className="text-gray-700 mb-2">
                            Are you sure you want to remove the center "<strong>{centerToDelete.name}</strong>"?
                        </p>
                        <p className="text-sm text-red-600">This action cannot be undone and will also remove the associated center login.</p>
                        <div className="flex justify-end gap-4 pt-6">
                            <button type="button" onClick={() => setCenterToDelete(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                            <button type="button" onClick={confirmRemoveCenter} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default CenterManagement;