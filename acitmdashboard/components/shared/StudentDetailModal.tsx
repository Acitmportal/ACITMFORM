// components/shared/StudentDetailModal.tsx
import React from 'react';
import { Student } from '../../types';
import Modal from './Modal';
import { StudentStatus } from '../../types';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  centerName?: string;
}

const StatusBadge: React.FC<{ status: StudentStatus }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full";
  const statusClasses = {
    [StudentStatus.PENDING]: "bg-yellow-100 text-yellow-800",
    [StudentStatus.ACCEPTED]: "bg-green-100 text-green-800",
    [StudentStatus.REJECTED]: "bg-red-100 text-red-800",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-md text-gray-900">{value || 'N/A'}</p>
  </div>
);

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose, centerName }) => {
  if (!student) {
    return null;
  }

  return (
    <Modal isOpen={!!student} onClose={onClose} title="Student Details">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column: Photo & Signature */}
        <div className="flex-shrink-0 w-full md:w-48 text-center">
            <img src={student.photoUrl} alt={student.name} className="w-48 h-48 rounded-full object-cover mx-auto border-4 border-gray-200 shadow-sm" />
            <div className="mt-6">
                 <p className="text-sm font-medium text-gray-500 mb-2">Signature</p>
                 <div className="bg-gray-100 p-2 rounded-md border">
                    <img src={student.signatureUrl} alt={`${student.name}'s signature`} className="h-16 w-full object-contain" />
                 </div>
            </div>
        </div>
        {/* Right Column: Details */}
        <div className="flex-grow">
            <h2 className="text-2xl font-bold text-primary-700">{student.name}</h2>
            <p className="text-lg text-gray-600 mb-4">{student.fatherName}</p>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4">
                <DetailItem label="Status" value={<StatusBadge status={student.status} />} />
                <DetailItem label="Course" value={student.course} />
                {centerName && <DetailItem label="Center" value={centerName} />}
                <DetailItem label="Admission Date" value={student.admissionDate} />
                <DetailItem label="Date of Birth" value={student.dob} />
                <DetailItem label="Gender" value={student.gender} />
                <DetailItem label="Mobile No." value={student.mobile} />
                <DetailItem label="Address" value={student.address} />
            </div>
        </div>
      </div>
       <div className="flex justify-end gap-4 pt-6 mt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Close
            </button>
        </div>
    </Modal>
  );
};

export default StudentDetailModal;
