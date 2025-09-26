// Fix: Implemented the AdminCourseChart component which was previously missing.
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student } from '../../types';

interface AdminCourseChartProps {
    students: Student[];
}

const AdminCourseChart: React.FC<AdminCourseChartProps> = ({ students }) => {
    const data = useMemo(() => {
        const courseCounts: { [course: string]: number } = {};
        students.forEach(student => {
            courseCounts[student.course] = (courseCounts[student.course] || 0) + 1;
        });

        return Object.keys(courseCounts).map(course => ({
            name: course,
            admissions: courseCounts[course],
        })).sort((a, b) => b.admissions - a.admissions); // Sort for better visualization
    }, [students]);

    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-8">No admission data available to display chart.</p>;
    }

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={150} interval={0} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="admissions" fill="#8884d8" name="Total Admissions"/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AdminCourseChart;
