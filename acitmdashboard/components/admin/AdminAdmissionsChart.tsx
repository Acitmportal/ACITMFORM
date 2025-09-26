// Fix: Implemented the AdminAdmissionsChart component which was previously missing.
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student, Center } from '../../types';

interface AdminAdmissionsChartProps {
    students: Student[];
    centers: Center[];
}

const AdminAdmissionsChart: React.FC<AdminAdmissionsChartProps> = ({ students, centers }) => {
    const data = useMemo(() => {
        const centerMap = centers.reduce((acc, center) => {
            acc[center.id] = center.name;
            return acc;
        }, {} as { [key: string]: string });

        const centerCounts: { [centerId: string]: number } = {};
        students.forEach(student => {
            centerCounts[student.centerId] = (centerCounts[student.centerId] || 0) + 1;
        });

        return Object.keys(centerCounts).map(centerId => ({
            name: centerMap[centerId] || `Unknown Center (${centerId.substring(0,6)})`,
            admissions: centerCounts[centerId],
        }));
    }, [students, centers]);

    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-8">No admission data available to display chart.</p>;
    }

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="admissions" fill="#4f46e5" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AdminAdmissionsChart;
