// Fix: Implemented the AdminDashboard component which was previously missing.
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../shared/Layout';
import { DashboardIcon, StudentsIcon, CentersIcon } from '../shared/Icons';
import { Student, Center, StudentStatus } from '../../types';
import { getAllStudents, getAllCenters } from '../../services/firebaseService';
import StudentManagementTable from './StudentManagementTable';
import CenterManagement from './CenterManagement';
import AdminAdmissionsChart from './AdminAdmissionsChart';
import AdminCourseChart from './AdminCourseChart';

type AdminView = 'dashboard' | 'students' | 'centers';

const AdminDashboard: React.FC = () => {
    const [view, setView] = useState<AdminView>('dashboard');
    const [students, setStudents] = useState<Student[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fetchedStudents, fetchedCenters] = await Promise.all([
                    getAllStudents(),
                    getAllCenters()
                ]);
                setStudents(fetchedStudents);
                setCenters(fetchedCenters);
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = useMemo(() => {
        const totalStudents = students.length;
        const accepted = students.filter(s => s.status === StudentStatus.ACCEPTED).length;
        const pending = students.filter(s => s.status === StudentStatus.PENDING).length;
        const totalCenters = centers.length;
        return { totalStudents, accepted, pending, totalCenters };
    }, [students, centers]);
    
    const NavLink: React.FC<{
      currentView: AdminView;
      viewName: AdminView;
      onClick: (view: AdminView) => void;
      children: React.ReactNode;
    }> = ({ currentView, viewName, onClick, children }) => (
      <li className="mb-2">
        <button
          onClick={() => onClick(viewName)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
            currentView === viewName
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
            <NavLink currentView={view} viewName="dashboard" onClick={setView}>
                <DashboardIcon /> Dashboard
            </NavLink>
            <NavLink currentView={view} viewName="students" onClick={setView}>
                <StudentsIcon /> Student Management
            </NavLink>
            <NavLink currentView={view} viewName="centers" onClick={setView}>
                <CentersIcon /> Center Management
            </NavLink>
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
                return <StudentManagementTable />;
            case 'centers':
                return <CenterManagement />;
            case 'dashboard':
            default:
                return (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Total Students</h3><p className="text-3xl font-bold text-primary-600">{stats.totalStudents}</p></div>
                            <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Accepted Admissions</h3><p className="text-3xl font-bold text-green-500">{stats.accepted}</p></div>
                            <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Pending Approvals</h3><p className="text-3xl font-bold text-yellow-500">{stats.pending}</p></div>
                            <div className="bg-white p-6 rounded-lg shadow-md"><h3 className="text-gray-500">Total Centers</h3><p className="text-3xl font-bold text-indigo-600">{stats.totalCenters}</p></div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           <div className="bg-white p-6 rounded-lg shadow-md">
                               <h3 className="text-xl font-semibold text-gray-700 mb-4">Admissions by Center</h3>
                               <AdminAdmissionsChart students={students} centers={centers} />
                           </div>
                           <div className="bg-white p-6 rounded-lg shadow-md">
                               <h3 className="text-xl font-semibold text-gray-700 mb-4">Admissions by Course</h3>
                               <AdminCourseChart students={students} />
                           </div>
                        </div>
                    </div>
                );
        }
    };
    
    const viewTitles: Record<AdminView, string> = {
        dashboard: 'Admin Dashboard',
        students: 'Student Management',
        centers: 'Center Management'
    };

    return (
        <Layout title={viewTitles[view]} sidebarContent={sidebarContent}>
            {renderContent()}
        </Layout>
    );
};

export default AdminDashboard;