
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student } from '../../types';

interface AdmissionsChartProps {
    students: Student[];
}

const AdmissionsChart: React.FC<AdmissionsChartProps> = ({ students }) => {
    const data = useMemo(() => {
        const courseCounts: { [course: string]: number } = {};
        students.forEach(student => {
            courseCounts[student.course] = (courseCounts[student.course] || 0) + 1;
        });

        return Object.keys(courseCounts).map(course => ({
            name: course,
            admissions: courseCounts[course],
        }));
    }, [students]);

    return (
        <div style={{ width: '100%', height: 300 }}>
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
                    <Bar dataKey="admissions" fill="#3b82f6" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AdmissionsChart;