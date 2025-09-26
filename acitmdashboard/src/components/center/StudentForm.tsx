import React, { useState, useEffect, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { addStudent, updateStudent, uploadFile } from '../../services/firebaseService';
import { COURSES, GENDERS } from '../../constants';
import Modal from '../shared/Modal';

interface StudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  studentToEdit?: Student | null;
}

const initialFormData = {
  name: '',
  fatherName: '',
  course: COURSES[0],
  admissionDate: new Date().toISOString().split('T')[0],
  mobile: '',
  address: '',
  gender: GENDERS[0],
  dob: '',
};

// Helper to convert canvas data to a file
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

const InputField: React.FC<{
    id: string;
    label: string;
    type?: string;
    required?: boolean;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}> = ({ id, label, type = "text", required = true, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} id={id} value={value} onChange={onChange} required={required} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
    </div>
);
  
const FileInputField: React.FC<{
    id: 'photo' | 'signature';
    label: string;
    preview: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'signature') => void;
}> = ({ id, label, preview, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-1 flex items-center gap-4">
        {preview ? 
            <img src={preview} alt="preview" className={`object-cover rounded-md ${id === 'photo' ? 'h-16 w-16' : 'h-12 w-36 border'}`} /> 
            : <div className={`bg-gray-100 rounded-md flex items-center justify-center ${id === 'photo' ? 'h-16 w-16' : 'h-12 w-36'}`}><span className="text-xs text-gray-500">No Image</span></div>
        }
        <input type="file" id={id} accept="image/*" onChange={(e) => onChange(e, id)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
      </div>
    </div>
);


const StudentForm: React.FC<StudentFormProps> = ({ onSuccess, onCancel, studentToEdit }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState(initialFormData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Cropping state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropAspect, setCropAspect] = useState(1);
  const [croppingField, setCroppingField] = useState<'photo' | 'signature' | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);


  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        name: studentToEdit.name,
        fatherName: studentToEdit.fatherName,
        course: studentToEdit.course,
        admissionDate: studentToEdit.admissionDate,
        mobile: studentToEdit.mobile,
        address: studentToEdit.address,
        gender: studentToEdit.gender,
        dob: studentToEdit.dob,
      });
      setPhotoPreview(studentToEdit.photoUrl);
      setSignaturePreview(studentToEdit.signatureUrl);
    } else {
      setFormData(initialFormData);
      setPhotoFile(null);
      setSignatureFile(null);
      setPhotoPreview(null);
      setSignaturePreview(null);
    }
  }, [studentToEdit]);
  
  // Effect for drawing the crop preview
  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
        const image = imgRef.current;
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('No 2d context');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );
    }
  }, [completedCrop]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'signature') => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setCroppingField(field);
      setCropAspect(field === 'photo' ? 1 : 3 / 1);
      setIsCropModalOpen(true);
    }
  };
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, cropAspect, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  const handleSaveCrop = async () => {
    if (!previewCanvasRef.current) {
        throw new Error('Crop canvas does not exist');
    }
    const canvas = previewCanvasRef.current;
    const blob = await canvasToBlob(canvas);
    if (!blob) {
        console.error('Failed to create blob');
        return;
    }
    const croppedUrl = URL.createObjectURL(blob);
    const croppedFile = new File([blob], `${croppingField}.png`, { type: 'image/png' });

    if (croppingField === 'photo') {
        setPhotoPreview(croppedUrl);
        setPhotoFile(croppedFile);
    } else if (croppingField === 'signature') {
        setSignaturePreview(croppedUrl);
        setSignatureFile(croppedFile);
    }

    setIsCropModalOpen(false);
    setImgSrc('');
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentToEdit && (!photoFile || !signatureFile)) {
        setError('Photo and signature are required for new students.');
        return;
    }

    if (!user?.centerId) {
        setError('User not associated with a center.');
        return;
    }

    setIsSubmitting(true);
    try {
        let photoUrl = studentToEdit?.photoUrl || '';
        if (photoFile) {
            photoUrl = await uploadFile(photoFile);
        }

        let signatureUrl = studentToEdit?.signatureUrl || '';
        if (signatureFile) {
            signatureUrl = await uploadFile(signatureFile);
        }

        const studentData = { ...formData, photoUrl, signatureUrl, centerId: user.centerId };

        if (studentToEdit) {
            await updateStudent(studentToEdit.id, studentData);
        } else {
            await addStudent(studentData);
        }
        
        onSuccess();
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{studentToEdit ? 'Edit Student' : 'Add New Student'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField id="name" label="Full Name" value={formData.name} onChange={handleInputChange} />
              <InputField id="fatherName" label="Father's Name" value={formData.fatherName} onChange={handleInputChange} />
              <InputField id="dob" label="Date of Birth" type="date" value={formData.dob} onChange={handleInputChange} />
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                <select id="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <InputField id="mobile" label="Mobile Number" type="tel" value={formData.mobile} onChange={handleInputChange} />
              <InputField id="admissionDate" label="Admission Date" type="date" value={formData.admissionDate} onChange={handleInputChange} />
               <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700">Course</label>
                <select id="course" value={formData.course} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                   <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                   <textarea id="address" value={formData.address} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
              <FileInputField id="photo" label="Student Photo" preview={photoPreview} onChange={handleFileChange} />
              <FileInputField id="signature" label="Student Signature" preview={signaturePreview} onChange={handleFileChange} />
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
              {isSubmitting ? 'Submitting...' : (studentToEdit ? 'Update Student' : 'Add Student')}
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={isCropModalOpen} onClose={() => setIsCropModalOpen(false)} title={`Crop ${croppingField}`}>
            {imgSrc && (
                <div>
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={cropAspect}>
                        <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad}/>
                    </ReactCrop>
                    {/* Hidden canvas for preview */}
                    <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
                </div>
            )}
            <div className="flex justify-end gap-4 pt-4">
                <button onClick={() => setIsCropModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={handleSaveCrop} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Crop</button>
            </div>
      </Modal>
    </>
  );
};

export default StudentForm;