import React, { useState } from 'react';
import { Student, StudentStatus } from '../../types';
import { deleteStudent } from '../../services/firebaseService';
import { ViewIcon, EditIcon, DeleteIcon } from '../shared/Icons';
import StudentDetailModal from '../shared/StudentDetailModal';
import ConfirmationModal from '../shared/ConfirmationModal';

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onUpdate: () => void; // To refresh data after deletion
  onDeleteSuccess: () => void;
}

const StatusBadge: React.FC<{ status: StudentStatus }> = ({ status }) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full inline-block";
  const statusClasses = {
    [StudentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [StudentStatus.ACCEPTED]: "bg-green-100 text-green-800",
    [StudentStatus.REJECTED]: "bg-red-100 text-red-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const StudentTable: React.FC<StudentTableProps> = ({ students, onEdit, onUpdate, onDeleteSuccess }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const handleDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteStudent(studentToDelete.id);
        onUpdate();
        onDeleteSuccess();
      } catch (error) {
        console.error("Failed to delete student:", error);
        alert("Could not delete student.");
      } finally {
        setStudentToDelete(null);
      }
    }
  };
  
  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">All Students</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map(student => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={student.photoUrl} alt={student.name} />
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.mobile}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.course}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.admissionDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={student.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setSelectedStudent(student)} className="text-primary-600 hover:text-primary-900 p-2"><ViewIcon className="w-5 h-5"/></button>
                    <button onClick={() => onEdit(student)} className="text-indigo-600 hover:text-indigo-900 p-2"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => setStudentToDelete(student)} className="text-red-600 hover:text-red-900 p-2"><DeleteIcon className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {students.length === 0 && <p className="text-center text-gray-500 py-8">No students found.</p>}
        </div>
      </div>
      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      <ConfirmationModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDelete}
        title="Confirm Student Deletion"
        message={`Are you sure you want to delete the student "${studentToDelete?.name}"? This action cannot be undone.`}
      />
    </>
  );
};

export default StudentTable;