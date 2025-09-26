import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, Center, StudentStatus } from '../../types';
import { getAllStudents, getAllCenters, updateStudent, deleteStudent } from '../../services/firebaseService';
import { useToast } from '../../context/ToastContext';
import StudentDetailModal from '../shared/StudentDetailModal';
import StudentForm from '../center/StudentForm';
import ConfirmationModal from '../shared/ConfirmationModal';
import { ViewIcon, EditIcon, DeleteIcon, ExcelIcon } from '../shared/Icons';
import ExcelJS from 'exceljs';

const StudentManagementTable: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    
    // Modal states
    const [studentForDetail, setStudentForDetail] = useState<Student | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    
    // Selection and Export
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    
    const { showToast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [fetchedStudents, fetchedCenters] = await Promise.all([
                getAllStudents(),
                getAllCenters()
            ]);
            setStudents(fetchedStudents);
            setCenters(fetchedCenters);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const centerMap = useMemo(() => {
        return centers.reduce((acc, center) => {
            acc[center.id] = center.name;
            return acc;
        }, {} as { [key: string]: string });
    }, [centers]);
    
    const filteredStudents = useMemo(() => {
        return students.filter(s => filter === 'all' || s.status === filter);
    }, [students, filter]);

    // --- CRUD Handlers ---

    const handleStatusChange = async (studentId: string, newStatus: StudentStatus) => {
        try {
            await updateStudent(studentId, { status: newStatus });
            fetchData();
            showToast('Student status updated!', 'success');
        } catch (error) {
            console.error("Failed to update student status:", error);
            alert("Could not update status.");
        }
    };
    
    const handleFormSuccess = () => {
        setStudentToEdit(null);
        fetchData();
        showToast('Student updated successfully!', 'success');
    };

    const handleConfirmDelete = async () => {
        if (studentToDelete) {
            await deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
            fetchData();
            showToast('Student deleted successfully!', 'success');
        }
    };
    
    // --- Selection Handlers ---

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };
    
    // --- Export Handler ---

    const handleExport = async () => {
        if (selectedIds.length === 0) return;
        setIsExporting(true);

        const studentsToExport = students.filter(s => selectedIds.includes(s.id));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Students');

        worksheet.columns = [
            { header: 'Photo', key: 'photo', width: 15 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Father\'s Name', key: 'fatherName', width: 30 },
            { header: 'Course', key: 'course', width: 40 },
            { header: 'Center', key: 'center', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Mobile', key: 'mobile', width: 20 },
            { header: 'Admission Date', key: 'admissionDate', width: 20 },
        ];

        worksheet.getRow(1).font = { bold: true };

        for (const student of studentsToExport) {
            const row = worksheet.addRow({
                name: student.name,
                fatherName: student.fatherName,
                course: student.course,
                center: centerMap[student.centerId] || 'Unknown',
                status: student.status,
                mobile: student.mobile,
                admissionDate: student.admissionDate,
            });
            row.height = 80;

            try {
                const response = await fetch(student.photoUrl);
                const buffer = await response.arrayBuffer();
                const imageId = workbook.addImage({
                    buffer: buffer,
                    extension: 'jpeg',
                });
                worksheet.addImage(imageId, {
                    tl: { col: 0, row: row.number - 1 },
                    ext: { width: 100, height: 100 },
                });
            } catch (error) {
                console.error(`Could not load image for ${student.name}:`, error);
                row.getCell('photo').value = 'No Image';
            }
        }
        
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'students.xlsx';
        link.click();

        setIsExporting(false);
    };

    // --- Sub-components ---
    const StatusSelect: React.FC<{ student: Student }> = ({ student }) => (
        <select value={student.status} onChange={(e) => handleStatusChange(student.id, e.target.value as StudentStatus)}
            className={`w-full p-1.5 rounded-md text-xs border-2 focus:outline-none focus:ring-2 focus:ring-primary-500
            ${{
                [StudentStatus.PENDING]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                [StudentStatus.ACCEPTED]: 'bg-green-100 border-green-300 text-green-800',
                [StudentStatus.REJECTED]: 'bg-red-100 border-red-300 text-red-800'
            }[student.status]}`}>
            <option value={StudentStatus.PENDING}>Pending</option>
            <option value={StudentStatus.ACCEPTED}>Accepted</option>
            <option value={StudentStatus.REJECTED}>Rejected</option>
        </select>
    );
    
    const FilterButton: React.FC<{ value: string, label: string }> = ({ value, label }) => (
        <button onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === value ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}>
            {label}
        </button>
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div></div>;

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-gray-700">All Student Admissions</h3>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                            <FilterButton value="all" label="All" />
                            <FilterButton value={StudentStatus.PENDING} label="Pending" />
                            <FilterButton value={StudentStatus.ACCEPTED} label="Accepted" />
                            <FilterButton value={StudentStatus.REJECTED} label="Rejected" />
                        </div>
                        <button onClick={handleExport} disabled={selectedIds.length === 0 || isExporting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                            <ExcelIcon className="w-5 h-5"/>
                            {isExporting ? 'Exporting...' : `Export (${selectedIds.length})`}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === filteredStudents.length} /></th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredStudents.map(student => (
                                <tr key={student.id} className={selectedIds.includes(student.id) ? 'bg-primary-50' : ''}>
                                    <td className="p-4"><input type="checkbox" onChange={() => handleSelectOne(student.id)} checked={selectedIds.includes(student.id)} /></td>
                                    <td className="px-6 py-4"><img src={student.photoUrl} alt={student.name} className="h-10 w-10 rounded-full object-cover"/></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{student.name}</div><div className="text-sm text-gray-500">{student.mobile}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{centerMap[student.centerId] || 'Unknown'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.course}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusSelect student={student} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setStudentForDetail(student)} className="text-primary-600 hover:text-primary-900 p-2"><ViewIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setStudentToEdit(student)} className="text-indigo-600 hover:text-indigo-900 p-2"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => setStudentToDelete(student)} className="text-red-600 hover:text-red-900 p-2"><DeleteIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredStudents.length === 0 && <p className="text-center text-gray-500 py-8">No students match the current filter.</p>}
                </div>
            </div>

            {/* Modals */}
            <StudentDetailModal student={studentForDetail} onClose={() => setStudentForDetail(null)} centerName={studentForDetail ? centerMap[studentForDetail.centerId] : undefined} />
            {studentToEdit && <StudentForm studentToEdit={studentToEdit} onSuccess={handleFormSuccess} onCancel={() => setStudentToEdit(null)} />}
            <ConfirmationModal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} onConfirm={handleConfirmDelete} title="Confirm Deletion"
                message={`Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`}/>
        </>
    );
};

export default StudentManagementTable;