import { useState } from 'react';
import { useForm, Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import toast from 'react-hot-toast';

interface KycData {
    id?: number;
    identity_type?: string;
    identity_number?: string;
    identity_image?: string;
    pan_number?: string;
    pan_card_image?: string;
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    full_address?: string;
    pincode?: string;
    date_of_birth?: string;
    gender?: string;
    father_name?: string;
    mother_name?: string;
    occupation?: string;
    annual_income?: number;
    status?: string;
    reason?: string;
    completion_percentage?: number;
}

interface Props {
    kyc?: KycData | null;
}

const steps = [
    { id: 1, title: 'Identity Information', description: 'Provide your identity details' },
    { id: 2, title: 'Personal Information', description: 'Enter your personal details' },
    { id: 3, title: 'Address Information', description: 'Provide your address details' },
    { id: 4, title: 'Review & Submit', description: 'Review and submit your KYC' },
];

export default function KycCreate({ kyc }: Props) {
    const [currentStep, setCurrentStep] = useState(1);
    const [identityImagePreview, setIdentityImagePreview] = useState<string | null>(null);
    const [panCardImagePreview, setPanCardImagePreview] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    
    const { data, setData, post, processing, errors, reset } = useForm({
        identity_type: kyc?.identity_type || '',
        identity_number: kyc?.identity_number || '',
        identity_image: null as File | null,
        pan_number: kyc?.pan_number || '',
        pan_card_image: null as File | null,
        country: kyc?.country || 'India',
        state: kyc?.state || '',
        city: kyc?.city || '',
        area: kyc?.area || '',
        full_address: kyc?.full_address || '',
        pincode: kyc?.pincode || '',
        date_of_birth: kyc?.date_of_birth || '',
        gender: kyc?.gender || '',
        father_name: kyc?.father_name || '',
        mother_name: kyc?.mother_name || '',
        occupation: kyc?.occupation || '',
        annual_income: kyc?.annual_income || '',
    });

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        console.log('=== KYC SUBMISSION DEBUG ===');
        console.log('Form data:', data);
        console.log('Current errors:', errors);
        console.log('Processing state:', processing);
        
        // Run comprehensive frontend validation
        const fieldsToValidate = [
            'identity_type', 'identity_number', 'pan_number', 
            'date_of_birth', 'gender', 'country', 'state', 
            'city', 'full_address', 'pincode'
        ];

        let hasErrors = false;
        const newValidationErrors: Record<string, string> = {};

        fieldsToValidate.forEach(field => {
            const isValid = validateField(field, data[field as keyof typeof data]);
            if (!isValid) {
                hasErrors = true;
                // The error is already set in validationErrors by validateField
            }
        });

        // Additional validation for required fields
        const requiredFields = {
            identity_type: 'Identity Document Type',
            identity_number: 'Identity Document Number', 
            pan_number: 'PAN Card Number',
            country: 'Country',
            state: 'State',
            city: 'City',
            full_address: 'Full Address',
            pincode: 'Pincode',
            date_of_birth: 'Date of Birth',
            gender: 'Gender'
        };

        const missingFields = [];
        for (const [field, label] of Object.entries(requiredFields)) {
            if (!data[field as keyof typeof data]) {
                missingFields.push(label);
                newValidationErrors[field] = `${label} is required`;
                hasErrors = true;
            }
        }

        if (hasErrors) {
            setValidationErrors(prev => ({ ...prev, ...newValidationErrors }));
            toast.error('Please fix the validation errors before submitting');
            return;
        }

        // Show loading toast
        const loadingToast = toast.loading('Submitting KYC application...');
        
        post('/team/kyc', {
            onSuccess: (response) => {
                console.log('✅ KYC submitted successfully:', response);
                toast.success('KYC application submitted successfully! Your application is under review.', {
                    id: loadingToast,
                    duration: 5000,
                });
            },
            onError: (errors) => {
                console.log('❌ KYC submission errors:', errors);
                
                // Show specific validation errors
                const errorMessages = [];
                for (const [field, messages] of Object.entries(errors)) {
                    if (Array.isArray(messages)) {
                        errorMessages.push(...messages);
                    } else {
                        errorMessages.push(messages);
                    }
                }
                
                const errorText = errorMessages.length > 0 
                    ? errorMessages.join('. ') 
                    : 'Failed to submit KYC application. Please check the form and try again.';
                
                toast.error(errorText, {
                    id: loadingToast,
                    duration: 8000,
                });
            },
            onFinish: () => {
                console.log('🏁 KYC submission finished');
            }
        });
    };

    // Frontend validation functions
    const validatePanNumber = (pan: string): string | null => {
        if (!pan) return 'PAN number is required';
        if (pan.length !== 10) return 'PAN number must be exactly 10 characters';
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) return 'PAN number format is invalid (e.g., ABCDE1234F)';
        return null;
    };

    const validateDateOfBirth = (date: string): string | null => {
        if (!date) return 'Date of birth is required';
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate >= today) return 'Date of birth must be before today';
        return null;
    };

    const validateIdentityNumber = (number: string, type: string): string | null => {
        if (!number) return 'Identity document number is required';
        if (number.length < 5) return 'Identity document number is too short';
        if (type === 'aadhar' && !/^\d{12}$/.test(number)) return 'Aadhar number must be 12 digits';
        return null;
    };

    const validatePincode = (pincode: string): string | null => {
        if (!pincode) return 'Pincode is required';
        if (!/^\d{6}$/.test(pincode)) return 'Pincode must be 6 digits';
        return null;
    };

    // Real-time validation state - already declared above

    // Validate field on change
    const validateField = (field: string, value: any) => {
        let error: string | null = null;

        switch (field) {
            case 'pan_number':
                error = validatePanNumber(value);
                break;
            case 'date_of_birth':
                error = validateDateOfBirth(value);
                break;
            case 'identity_number':
                error = validateIdentityNumber(value, data.identity_type);
                break;
            case 'pincode':
                error = validatePincode(value);
                break;
            case 'identity_type':
                if (!value) error = 'Please select an identity document type';
                break;
            case 'gender':
                if (!value) error = 'Please select your gender';
                break;
            case 'country':
                if (!value) error = 'Country is required';
                break;
            case 'state':
                if (!value) error = 'State is required';
                break;
            case 'city':
                if (!value) error = 'City is required';
                break;
            case 'full_address':
                if (!value || value.length < 10) error = 'Please provide a complete address (minimum 10 characters)';
                break;
        }

        setValidationErrors(prev => ({
            ...prev,
            [field]: error || ''
        }));

        return error === null;
    };

    // Update form data with validation
    const updateFormData = (field: string, value: any) => {
        setData(field as any, value);
        validateField(field, value);
    };

    const handleIdentityImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('identity_image', file);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setIdentityImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setIdentityImagePreview(null);
        }
    };

    const handlePanCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('pan_card_image', file);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPanCardImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPanCardImagePreview(null);
        }
    };

    const getStepValidation = (step: number) => {
        switch (step) {
            case 1:
                return data.identity_type && data.identity_number && data.pan_number;
            case 2:
                return data.date_of_birth && data.gender;
            case 3:
                return data.country && data.state && data.city && data.full_address && data.pincode;
            case 4:
                // Final validation - check all required fields
                return data.identity_type && 
                       data.identity_number && 
                       data.pan_number && 
                       data.date_of_birth && 
                       data.gender && 
                       data.country && 
                       data.state && 
                       data.city && 
                       data.full_address && 
                       data.pincode;
            default:
                return true;
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        
        const statusConfig = {
            pending: { class: 'bg-muted text-muted-foreground', text: 'Pending' },
            submitted: { class: 'bg-primary/10 text-primary', text: 'Submitted' },
            approved: { class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', text: 'Approved' },
            rejected: { class: 'bg-destructive/10 text-destructive', text: 'Rejected' },
        };

        const config = statusConfig[status as keyof typeof statusConfig];
        return config ? (
            <Badge className={config.class}>
                {config.text}
            </Badge>
        ) : null;
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-8">
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-semibold text-primary mb-2">Identity Verification</h3>
                            <p className="text-sm text-primary/80">Please provide your government-issued identity documents for verification.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="identity_type" className="text-base font-semibold text-gray-700">
                                    Identity Document Type *
                                </Label>
                                <Select
                                    value={data.identity_type}
                                    onValueChange={(value) => updateFormData('identity_type', value)}
                                >
                                    <SelectTrigger className="w-full text-base border-gray-300 focus:border-primary focus:ring-primary">
                                        <SelectValue placeholder="Choose your identity document" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                                        <SelectItem value="voter_id">Voter ID Card</SelectItem>
                                        <SelectItem value="passport">Passport</SelectItem>
                                        <SelectItem value="driving_license">Driving License</SelectItem>
                                        <SelectItem value="other">Other Government ID</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(validationErrors.identity_type || errors.identity_type) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.identity_type || errors.identity_type}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="identity_number" className="text-base font-semibold text-gray-700">
                                    Identity Document Number *
                                </Label>
                                <Input
                                    id="identity_number"
                                    type="text"
                                    value={data.identity_number}
                                    onChange={(e) => updateFormData('identity_number', e.target.value)}
                                    placeholder="Enter your document number"
                                    className="w-full  text-base border-gray-300 focus:border-primary focus:ring-primary"
                                />
                                {(validationErrors.identity_number || errors.identity_number) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.identity_number || errors.identity_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="pan_number" className="text-base font-semibold text-gray-700">
                                    PAN Card Number *
                                </Label>
                                <Input
                                    id="pan_number"
                                    type="text"
                                    value={data.pan_number}
                                    onChange={(e) => updateFormData('pan_number', e.target.value.toUpperCase())}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                    className="w-full text-base border-gray-300 focus:border-primary focus:ring-primary font-mono tracking-wider"
                                />
                                <p className="text-xs text-gray-500">Enter your 10-digit PAN number (e.g., ABCDE1234F)</p>
                                {(validationErrors.pan_number || errors.pan_number) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.pan_number || errors.pan_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="identity_image" className="text-base font-semibold text-gray-700">
                                    Identity Document Image
                                </Label>
                                <div className="relative">
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="identity_image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all duration-200 relative overflow-hidden">
                                            {identityImagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <img 
                                                        src={identityImagePreview} 
                                                        alt="Identity Document Preview" 
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                        <p className="text-white text-sm font-medium">Click to change</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                    </svg>
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                                                </div>
                                            )}
                                            <input 
                                                id="identity_image" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleIdentityImageChange}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Upload clear image of your identity document</p>
                                {errors.identity_image && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {errors.identity_image}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="pan_card_image" className="text-base font-semibold text-gray-700">
                                    PAN Card Image
                                </Label>
                                <div className="relative">
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="pan_card_image" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-primary/50 transition-all duration-200 relative overflow-hidden">
                                            {panCardImagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <img 
                                                        src={panCardImagePreview} 
                                                        alt="PAN Card Preview" 
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                                        <p className="text-white text-sm font-medium">Click to change</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                    </svg>
                                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                                                </div>
                                            )}
                                            <input 
                                                id="pan_card_image" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handlePanCardImageChange}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Upload clear image of your PAN card</p>
                                {errors.pan_card_image && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {errors.pan_card_image}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="space-y-3">
                                <Label htmlFor="date_of_birth" className="text-base font-medium">Date of Birth *</Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => updateFormData('date_of_birth', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full text-base"
                                />
                                {(validationErrors.date_of_birth || errors.date_of_birth) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.date_of_birth || errors.date_of_birth}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="gender" className="text-base font-medium">Gender *</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(value) => updateFormData('gender', value)}
                                >
                                    <SelectTrigger className="w-full text-base">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {(validationErrors.gender || errors.gender) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.gender || errors.gender}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="occupation" className="text-base font-medium">Occupation</Label>
                                <Input
                                    id="occupation"
                                    type="text"
                                    value={data.occupation}
                                    onChange={(e) => setData('occupation', e.target.value)}
                                    placeholder="Your occupation"
                                    className="w-full text-base"
                                />
                                {errors.occupation && (
                                    <p className="text-sm text-destructive">{errors.occupation}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="father_name" className="text-base font-medium">Father's Name</Label>
                                <Input
                                    id="father_name"
                                    type="text"
                                    value={data.father_name}
                                    onChange={(e) => setData('father_name', e.target.value)}
                                    placeholder="Father's full name"
                                    className="w-full text-base"
                                />
                                {errors.father_name && (
                                    <p className="text-sm text-destructive">{errors.father_name}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="mother_name" className="text-base font-medium">Mother's Name</Label>
                                <Input
                                    id="mother_name"
                                    type="text"
                                    value={data.mother_name}
                                    onChange={(e) => setData('mother_name', e.target.value)}
                                    placeholder="Mother's full name"
                                    className="w-full text-base"
                                />
                                {errors.mother_name && (
                                    <p className="text-sm text-destructive">{errors.mother_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="annual_income" className="text-base font-medium">Annual Income</Label>
                            <Input
                                id="annual_income"
                                type="number"
                                value={data.annual_income}
                                onChange={(e) => setData('annual_income', e.target.value)}
                                placeholder="Annual income in INR"
                                className="w-full text-base"
                            />
                            {errors.annual_income && (
                                <p className="text-sm text-destructive">{errors.annual_income}</p>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="country" className="text-base font-medium">Country *</Label>
                                <Input
                                    id="country"
                                    type="text"
                                    value={data.country}
                                    onChange={(e) => updateFormData('country', e.target.value)}
                                    placeholder="Country"
                                    className="w-full text-base"
                                />
                                {(validationErrors.country || errors.country) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.country || errors.country}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="state" className="text-base font-medium">State *</Label>
                                <Input
                                    id="state"
                                    type="text"
                                    value={data.state}
                                    onChange={(e) => updateFormData('state', e.target.value)}
                                    placeholder="State"
                                    className="w-full text-base"
                                />
                                {(validationErrors.state || errors.state) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.state || errors.state}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="space-y-3">
                                <Label htmlFor="city" className="text-base font-medium">City *</Label>
                                <Input
                                    id="city"
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => updateFormData('city', e.target.value)}
                                    placeholder="City"
                                    className="w-full text-base"
                                />
                                {(validationErrors.city || errors.city) && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                        {validationErrors.city || errors.city}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="area" className="text-base font-medium">Area</Label>
                                <Input
                                    id="area"
                                    type="text"
                                    value={data.area}
                                    onChange={(e) => setData('area', e.target.value)}
                                    placeholder="Area/Locality"
                                    className="w-full text-base"
                                />
                                {errors.area && (
                                    <p className="text-sm text-destructive">{errors.area}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="pincode" className="text-base font-medium">Pincode *</Label>
                                <Input
                                    id="pincode"
                                    type="text"
                                    value={data.pincode}
                                    onChange={(e) => updateFormData('pincode', e.target.value)}
                                    placeholder="Pincode"
                                    maxLength={6}
                                    className="w-full text-base"
                                />
                                {(validationErrors.pincode || errors.pincode) && (
                                    <p className="text-sm text-destructive">{validationErrors.pincode || errors.pincode}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="full_address" className="text-base font-medium">Full Address *</Label>
                            <Textarea
                                id="full_address"
                                value={data.full_address}
                                onChange={(e) => updateFormData('full_address', e.target.value)}
                                placeholder="Enter your complete address"
                                rows={4}
                                className="w-full resize-none text-base"
                            />
                            {(validationErrors.full_address || errors.full_address) && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-xs">!</span>
                                    {validationErrors.full_address || errors.full_address}
                                </p>
                            )}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-8">
                        <div className="text-center">
                            <h3 className="text-xl font-medium">Review Your Information</h3>
                            <p className="text-base text-gray-600 mt-2">Please review all the information before submitting</p>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Identity Information</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    <p><strong>Identity Type:</strong> {data.identity_type}</p>
                                    <p><strong>Identity Number:</strong> {data.identity_number}</p>
                                    <p><strong>PAN Number:</strong> {data.pan_number}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Personal Information</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    <p><strong>Date of Birth:</strong> {data.date_of_birth}</p>
                                    <p><strong>Gender:</strong> {data.gender}</p>
                                    {data.occupation && <p><strong>Occupation:</strong> {data.occupation}</p>}
                                    {data.father_name && <p><strong>Father's Name:</strong> {data.father_name}</p>}
                                    {data.mother_name && <p><strong>Mother's Name:</strong> {data.mother_name}</p>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Address Information</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    <p><strong>Country:</strong> {data.country}</p>
                                    <p><strong>State:</strong> {data.state}</p>
                                    <p><strong>City:</strong> {data.city}</p>
                                    <p><strong>Pincode:</strong> {data.pincode}</p>
                                    <p><strong>Full Address:</strong> {data.full_address}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <Head title="KYC Verification" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                            <div>
                                <h1 className="text-3xl font-bold">KYC Verification</h1>
                                <p className="text-muted-foreground">
                                    Complete your Know Your Customer (KYC) verification to access all features.
                                </p>
                            </div>

                            {/* Rejection Reason Alert */}
                            {kyc?.status === 'rejected' && kyc?.reason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-red-800">
                                                KYC Application Rejected
                                            </h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p><strong>Reason:</strong> {kyc.reason}</p>
                                                <p className="mt-2">Please review the feedback above and resubmit your KYC application with the correct information.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-xl">Complete Your KYC</CardTitle>
                                            <CardDescription>
                                                Step-by-step verification process
                                            </CardDescription>
                                        </div>
                                        {kyc?.status && (
                                            <div className="flex items-center space-x-2">
                                                {getStatusBadge(kyc.status)}
                                                {kyc.completion_percentage !== undefined && (
                                                    <span className="text-sm text-gray-500">
                                                        {kyc.completion_percentage}% Complete
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Progress Bar */}
                                    <div className="space-y-6 mb-10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold">Step {currentStep} of {steps.length}</span>
                                            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                                                {Math.round((currentStep / steps.length) * 100)}% Complete
                                            </span>
                                        </div>
                                        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
                                    </div>

                                    {/* Step Indicators */}
                                    <div className="mb-12">
                                        {/* Desktop Step Indicators */}
                                        <div className="hidden lg:block">
                                            <div className="flex items-center justify-between relative">
                                                {/* Progress Line */}
                                                <div className="absolute top-7 left-7 right-7 h-0.5 bg-muted">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-500 ease-in-out"
                                                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                                    />
                                                </div>
                                                
                                                {steps.map((step, index) => (
                                                    <div key={step.id} className="relative flex flex-col items-center">
                                                        <div
                                                            className={cn(
                                                                'flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-semibold transition-all duration-300 bg-background shadow-sm',
                                                                currentStep >= step.id
                                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                                    : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50'
                                                            )}
                                                        >
                                                            {currentStep > step.id ? (
                                                                <Check className="h-6 w-6" />
                                                            ) : (
                                                                step.id
                                                            )}
                                                        </div>
                                                        <div className="mt-4 text-center max-w-32">
                                                            <p className={cn(
                                                                "text-sm font-medium leading-tight",
                                                                currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                                                            )}>
                                                                {step.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                                                {step.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Mobile Step Indicators */}
                                        <div className="lg:hidden">
                                            <div className="flex items-center justify-center space-x-3 mb-6">
                                                {steps.map((step, index) => (
                                                    <div key={step.id} className="flex items-center">
                                                        <div
                                                            className={cn(
                                                                'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300',
                                                                currentStep >= step.id
                                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                                    : 'border-muted-foreground/30 bg-background text-muted-foreground'
                                                            )}
                                                        >
                                                            {currentStep > step.id ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                step.id
                                                            )}
                                                        </div>
                                                        {index < steps.length - 1 && (
                                                            <div className={cn(
                                                                "w-8 h-0.5 mx-2 transition-all duration-300",
                                                                currentStep > step.id ? "bg-primary" : "bg-muted"
                                                            )} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-center bg-muted/50 rounded-lg p-4">
                                                <p className="text-lg font-semibold">{steps[currentStep - 1].title}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{steps[currentStep - 1].description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step Content */}
                                    <div className="mb-12">
                                        {renderStepContent()}
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-border bg-muted/30 -mx-6 px-6 py-6 rounded-b-lg">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={prevStep}
                                            disabled={currentStep === 1}
                                            className="flex items-center justify-center w-full sm:w-auto h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-5 w-5 mr-2" />
                                            Previous Step
                                        </Button>

                                        {currentStep < steps.length ? (
                                            <Button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={!getStepValidation(currentStep)}
                                                className="flex items-center justify-center w-full sm:w-auto h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                                            >
                                                Continue to Next Step
                                                <ChevronRight className="h-5 w-5 ml-2" />
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={handleSubmit}
                                                disabled={processing || !getStepValidation(4)}
                                                className="flex items-center justify-center w-full sm:w-auto h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                                            >
                                                {processing ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                                                        Submitting KYC...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="h-5 w-5 mr-2" />
                                                        Submit KYC Application
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}