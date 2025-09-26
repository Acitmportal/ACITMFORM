import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Student, StudentStatus } from '../../types';
import { getStudentsByCenter } from '../../services/firebaseService';
import Layout from '../shared/Layout';
import { DashboardIcon, StudentsIcon, AddStudentIcon } from '../shared/Icons';
import StudentTable from './StudentTable';
import StudentForm from './StudentForm';
import AdmissionsChart from './AdmissionsChart';

type CenterView = 'dashboard' | 'students' | 'addStudent';

const CenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<CenterView>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    if (user?.centerId) {
      setLoading(true);
      try {
        const fetchedStudents = await getStudentsByCenter(user.centerId);
        setStudents(fetchedStudents);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [user?.centerId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const stats = useMemo(() => {
    const total = students.length;
    const accepted = students.filter(s => s.status === StudentStatus.ACCEPTED).length;
    const pending = students.filter(s => s.status === StudentStatus.PENDING).length;
    const rejected = students.filter(s => s.status === StudentStatus.REJECTED).length;
    return { total, accepted, pending, rejected };
  }, [students]);
  
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setView('addStudent');
  };

  const handleFormSuccess = () => {
    const message = editingStudent ? 'Student updated successfully!' : 'Student added successfully!';
    showToast(message, 'success');
    fetchStudents();
    setView('students');
    setEditingStudent(null);
  }

  const handleDeleteSuccess = () => {
    showToast('Student deleted successfully!', 'success');
  };
  
  const handleFormCancel = () => {
    setView('students');
    setEditingStudent(null);
  }

  const handleAddNewStudent = () => {
    setEditingStudent(null);
    setView('addStudent');
  }

  const NavLink: React.FC<{
      currentView: CenterView;
      viewName: CenterView;
      onClick: (view: CenterView) => void;
      children: React.ReactNode;
    }> = ({ currentView, viewName, onClick, children }) => (
      <li className="mb-2">
        <button
          onClick={() => onClick(viewName)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
            currentView === viewName && viewName !== 'addStudent'
              ? 'bg-primary-700 text-white font-semibold'
              : 'text-primary-200 hover:bg-primary-800 hover:text-white'
          }`}
        >
          {children}
        </button>
      </li>
    );

  const sidebarContent = (
    <ul>
      <NavLink currentView={view} viewName="dashboard" onClick={setView}><DashboardIcon /> Dashboard</NavLink>
      <NavLink currentView={view} viewName="students" onClick={setView}><StudentsIcon /> All Students</NavLink>
       <li>
        <button
          onClick={handleAddNewStudent}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
            view === 'addStudent' && !editingStudent
            ? 'bg-primary-700 text-white font-semibold'
            : 'text-primary-200 hover:bg-primary-800 hover:text-white'
          }`}
        >
          <AddStudentIcon /> Add New Student
        </button>
      </li>
    </ul>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    switch (view) {
      case 'students':
        return <StudentTable students={students} onEdit={handleEditStudent} onUpdate={fetchStudents} onDeleteSuccess={handleDeleteSuccess} />;
      case 'addStudent':
        return <StudentForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} studentToEdit={editingStudent} />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Total Students</h3><p className="text-3xl font-bold text-primary-600">{stats.total}</p></div>
               <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Accepted</h3><p className="text-3xl font-bold text-green-500">{stats.accepted}</p></div>
               <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Pending</h3><p className="text-3xl font-bold text-yellow-500">{stats.pending}</p></div>
               <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Rejected</h3><p className="text-3xl font-bold text-red-500">{stats.rejected}</p></div>
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Admissions by Course</h3>
                <AdmissionsChart students={students} />
             </div>
          </div>
        );
    }
  };
  
  const viewTitles: Record<CenterView, string> = {
    dashboard: 'Center Dashboard',
    students: 'Student Management',
    addStudent: editingStudent ? 'Edit Student' : 'Add New Student',
  };

  return (
    <Layout title={viewTitles[view]} sidebarContent={sidebarContent}>
      {renderContent()}
    </Layout>
  );
};

export default CenterDashboard;