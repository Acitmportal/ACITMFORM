// services/supabaseService.ts
import { supabase } from '../firebaseConfig'; // Now imports the supabase client
import { User, UserRole, Student, Center, StudentStatus } from '../types';

const STORAGE_BUCKET = 'student-media'; // The name of your Supabase storage bucket

// --- HELPER for converting snake_case from DB to camelCase for app ---
const studentFromSupabase = (dbStudent: any): Student => ({
    id: dbStudent.id,
    name: dbStudent.name,
    fatherName: dbStudent.father_name,
    course: dbStudent.course,
    admissionDate: dbStudent.admission_date,
    mobile: dbStudent.mobile,
    address: dbStudent.address,
    gender: dbStudent.gender,
    dob: dbStudent.dob,
    photoUrl: dbStudent.photo_url,
    signatureUrl: dbStudent.signature_url,
    status: dbStudent.status,
    centerId: dbStudent.center_id,
});

const studentToSupabase = (appStudent: any) => ({
    name: appStudent.name,
    father_name: appStudent.fatherName,
    course: appStudent.course,
    admission_date: appStudent.admissionDate,
    mobile: appStudent.mobile,
    address: appStudent.address,
    gender: appStudent.gender,
    dob: appStudent.dob,
    photo_url: appStudent.photoUrl,
    signature_url: appStudent.signatureUrl,
    status: appStudent.status,
    center_id: appStudent.centerId,
});

// --- AUTH FUNCTIONS ---

export const apiLogin = async (email: string, pass: string): Promise<User | null> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
    });

    if (authError || !authData.user) {
        console.error("Supabase login failed:", authError?.message);
        return null;
    }
    return await getSessionUser();
};

export const getSessionUser = async (): Promise<User | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) return null;
    
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`*, centers(name)`)
        .eq('id', session.user.id)
        .single();
        
    if (profileError || !profileData) return null;

    return {
        id: profileData.id,
        email: session.user.email!,
        role: profileData.role,
        centerId: profileData.center_id,
        centerName: profileData.centers?.name,
    };
}

export const signOut = async () => {
    await supabase.auth.signOut();
};

// --- STUDENT FUNCTIONS ---

export const getAllStudents = async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*');
    if (error) throw error;
    return data.map(studentFromSupabase);
};

export const getStudentsByCenter = async (centerId: string): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').eq('center_id', centerId);
    if (error) throw error;
    return data.map(studentFromSupabase);
};

export const addStudent = async (studentData: Omit<Student, 'id' | 'status'>): Promise<Student> => {
    const newStudentData = {
        ...studentToSupabase(studentData),
        status: StudentStatus.PENDING,
    };
    const { data, error } = await supabase.from('students').insert(newStudentData).select().single();
    if (error) throw error;
    return studentFromSupabase(data);
};

export const updateStudent = async (studentId: string, updates: Partial<Student>): Promise<Student> => {
    // Convert camelCase keys in updates to snake_case for Supabase
    const dbUpdates: { [key: string]: any } = {};
    for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
            const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            dbUpdates[dbKey] = (updates as any)[key];
        }
    }

    const { data, error } = await supabase.from('students').update(dbUpdates).eq('id', studentId).select().single();
    if (error) throw error;
    return studentFromSupabase(data);
};

export const deleteStudent = async (studentId: string): Promise<void> => {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
};

// --- CENTER FUNCTIONS ---

export const getAllCenters = async (): Promise<Center[]> => {
    const { data, error } = await supabase.from('centers').select('*');
    if (error) throw error;
    return data;
};

export const addCenterAndUser = async (data: { name: string; location: string; email: string; password: string }): Promise<void> => {
    // 1. Create the center first.
    const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .insert({ name: data.name, location: data.location })
        .select('id') // Only select the ID we need
        .single();

    if (centerError || !centerData) {
        throw new Error(centerError?.message || "Could not create center.");
    }

    // 2. Create the user. A trigger will automatically create an associated row in the 'profiles' table.
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        // options.data is ignored on the client-side for security reasons.
        // The role will be set in the next step.
    });

    // If user creation fails, roll back the center creation.
    if (authError || !authData.user) {
        await supabase.from('centers').delete().eq('id', centerData.id); // Rollback
        throw authError || new Error("Sign up succeeded but no user data returned.");
    }

    // 3. Update the user's new profile with the center_id and their role.
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ center_id: centerData.id, role: UserRole.CENTER })
        .eq('id', authData.user.id);
    
    // If linking the profile fails, this is a problem. The user exists but isn't linked.
    if (profileError) {
        // We can't easily roll back the user creation from the client.
        // So, we log the error and also attempt to roll back the center creation.
        console.error(`CRITICAL: User ${authData.user.email} created but failed to link to center ${centerData.id}. Error: ${profileError.message}`);
        await supabase.from('centers').delete().eq('id', centerData.id);
        throw new Error(`User was created, but failed to link to the center. Please delete the user manually and try again. Error: ${profileError.message}`);
    }
};


export const removeCenter = async (centerId: string): Promise<void> => {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('center_id', centerId);
    if (count && count > 0) throw new Error("Cannot remove center with associated students.");

    // Note: This only deletes the center. The associated user profile and auth user
    // should be handled with more care, preferably via a database function or edge function for security.
    // For this app, deleting the center is sufficient to disassociate it.
    const { error } = await supabase.from('centers').delete().eq('id', centerId);
    if (error) throw error;
};

// --- STORAGE FUNCTIONS ---

export const uploadFile = async (file: File): Promise<string> => {
    const filePath = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);

    if (error) {
        console.error("File upload error:", error);
        throw new Error("Failed to upload file.");
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
};