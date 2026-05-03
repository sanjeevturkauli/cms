import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    completion_percentage?: number;
}

interface KycModalProps {
    isOpen: boolean;
    onClose: () => void;
    kyc?: KycData | null;
}

const steps = [
    { id: 1, title: 'Identity Information', description: 'Provide your identity details' },
    { id: 2, title: 'Personal Information', description: 'Enter your personal details' },
    { id: 3, title: 'Address Information', description: 'Provide your address details' },
    { id: 4, title: 'Review & Submit', description: 'Review and submit your KYC' },
];

export function KycModal({ isOpen, onClose, kyc }: KycModalProps) {
    const [currentStep, setCurrentStep] = useState(1);
    
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
        post('/kyc', {
            onSuccess: () => {
                onClose();
                reset();
                setCurrentStep(1);
            }
        });
    };

    const getStepValidation = (step: number) => {
        switch (step) {
            case 1:
                return data.identity_type && data.identity_number && data.pan_number;
            case 2:
                return data.date_of_birth && data.gender;
            case 3:
                return data.country && data.state && data.city && data.full_address && data.pincode;
            default:
                return true;
        }
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        
        const statusConfig = {
            pending: { class: 'bg-gray-100 text-gray-800', text: 'Pending' },
            submitted: { class: 'bg-blue-100 text-blue-800', text: 'Submitted' },
            approved: { class: 'bg-green-100 text-green-800', text: 'Approved' },
            rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' },
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
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="identity_type" className="text-base font-medium">Identity Type *</Label>
                                <Select
                                    value={data.identity_type}
                                    onValueChange={(value) => setData('identity_type', value)}
                                >
                                    <SelectTrigger className="h-12 text-base">
                                        <SelectValue placeholder="Select identity type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                                        <SelectItem value="voter_id">Voter ID</SelectItem>
                                        <SelectItem value="passport">Passport</SelectItem>
                                        <SelectItem value="driving_license">Driving License</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.identity_type && (
                                    <p className="text-sm text-red-600">{errors.identity_type}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="identity_number" className="text-base font-medium">Identity Number *</Label>
                                <Input
                                    id="identity_number"
                                    type="text"
                                    value={data.identity_number}
                                    onChange={(e) => setData('identity_number', e.target.value)}
                                    placeholder="Enter identity number"
                                    className="h-12 text-base"
                                />
                                {errors.identity_number && (
                                    <p className="text-sm text-red-600">{errors.identity_number}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="space-y-3">
                                <Label htmlFor="identity_image" className="text-base font-medium">Identity Document Image</Label>
                                <Input
                                    id="identity_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('identity_image', e.target.files?.[0] || null)}
                                    className="h-12 text-base"
                                />
                                {errors.identity_image && (
                                    <p className="text-sm text-red-600">{errors.identity_image}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="pan_number" className="text-base font-medium">PAN Number *</Label>
                                <Input
                                    id="pan_number"
                                    type="text"
                                    value={data.pan_number}
                                    onChange={(e) => setData('pan_number', e.target.value.toUpperCase())}
                                    placeholder="ABCDE1234F"
                                    maxLength={10}
                                    className="h-12 text-base"
                                />
                                {errors.pan_number && (
                                    <p className="text-sm text-red-600">{errors.pan_number}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="pan_card_image" className="text-base font-medium">PAN Card Image</Label>
                            <Input
                                id="pan_card_image"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setData('pan_card_image', e.target.files?.[0] || null)}
                                className="h-12 text-base"
                            />
                            {errors.pan_card_image && (
                                <p className="text-sm text-red-600">{errors.pan_card_image}</p>
                            )}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                                <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={data.date_of_birth}
                                    onChange={(e) => setData('date_of_birth', e.target.value)}
                                    className="h-11"
                                />
                                {errors.date_of_birth && (
                                    <p className="text-sm text-red-600">{errors.date_of_birth}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select
                                    value={data.gender}
                                    onValueChange={(value) => setData('gender', value)}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.gender && (
                                    <p className="text-sm text-red-600">{errors.gender}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="occupation">Occupation</Label>
                                <Input
                                    id="occupation"
                                    type="text"
                                    value={data.occupation}
                                    onChange={(e) => setData('occupation', e.target.value)}
                                    placeholder="Your occupation"
                                    className="h-11"
                                />
                                {errors.occupation && (
                                    <p className="text-sm text-red-600">{errors.occupation}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="father_name">Father's Name</Label>
                                <Input
                                    id="father_name"
                                    type="text"
                                    value={data.father_name}
                                    onChange={(e) => setData('father_name', e.target.value)}
                                    placeholder="Father's full name"
                                    className="h-11"
                                />
                                {errors.father_name && (
                                    <p className="text-sm text-red-600">{errors.father_name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mother_name">Mother's Name</Label>
                                <Input
                                    id="mother_name"
                                    type="text"
                                    value={data.mother_name}
                                    onChange={(e) => setData('mother_name', e.target.value)}
                                    placeholder="Mother's full name"
                                    className="h-11"
                                />
                                {errors.mother_name && (
                                    <p className="text-sm text-red-600">{errors.mother_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="annual_income">Annual Income</Label>
                            <Input
                                id="annual_income"
                                type="number"
                                value={data.annual_income}
                                onChange={(e) => setData('annual_income', e.target.value)}
                                placeholder="Annual income in INR"
                                className="h-11"
                            />
                            {errors.annual_income && (
                                <p className="text-sm text-red-600">{errors.annual_income}</p>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    type="text"
                                    value={data.country}
                                    onChange={(e) => setData('country', e.target.value)}
                                    placeholder="Country"
                                    className="h-11"
                                />
                                {errors.country && (
                                    <p className="text-sm text-red-600">{errors.country}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State *</Label>
                                <Input
                                    id="state"
                                    type="text"
                                    value={data.state}
                                    onChange={(e) => setData('state', e.target.value)}
                                    placeholder="State"
                                    className="h-11"
                                />
                                {errors.state && (
                                    <p className="text-sm text-red-600">{errors.state}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="city">City *</Label>
                                <Input
                                    id="city"
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    placeholder="City"
                                    className="h-11"
                                />
                                {errors.city && (
                                    <p className="text-sm text-red-600">{errors.city}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="area">Area</Label>
                                <Input
                                    id="area"
                                    type="text"
                                    value={data.area}
                                    onChange={(e) => setData('area', e.target.value)}
                                    placeholder="Area/Locality"
                                    className="h-11"
                                />
                                {errors.area && (
                                    <p className="text-sm text-red-600">{errors.area}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pincode">Pincode *</Label>
                                <Input
                                    id="pincode"
                                    type="text"
                                    value={data.pincode}
                                    onChange={(e) => setData('pincode', e.target.value)}
                                    placeholder="Pincode"
                                    className="h-11"
                                />
                                {errors.pincode && (
                                    <p className="text-sm text-red-600">{errors.pincode}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_address">Full Address *</Label>
                            <Textarea
                                id="full_address"
                                value={data.full_address}
                                onChange={(e) => setData('full_address', e.target.value)}
                                placeholder="Enter your complete address"
                                rows={4}
                                className="resize-none"
                            />
                            {errors.full_address && (
                                <p className="text-sm text-red-600">{errors.full_address}</p>
                            )}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">Review Your Information</h3>
                            <p className="text-sm text-gray-600">Please review all the information before submitting</p>
                        </div>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Identity Information</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>Identity Type:</strong> {data.identity_type}</p>
                                    <p><strong>Identity Number:</strong> {data.identity_number}</p>
                                    <p><strong>PAN Number:</strong> {data.pan_number}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Personal Information</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p><strong>Date of Birth:</strong> {data.date_of_birth}</p>
                                    <p><strong>Gender:</strong> {data.gender}</p>
                                    {data.occupation && <p><strong>Occupation:</strong> {data.occupation}</p>}
                                    {data.father_name && <p><strong>Father's Name:</strong> {data.father_name}</p>}
                                    {data.mother_name && <p><strong>Mother's Name:</strong> {data.mother_name}</p>}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Address Information</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[98vw] h-[95vh] overflow-hidden p-0 flex flex-col">
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <DialogTitle className="text-2xl">KYC Verification</DialogTitle>
                                <DialogDescription className="mt-1 text-base">
                                    Complete your Know Your Customer (KYC) verification to access all features.
                                </DialogDescription>
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
                    </DialogHeader>

                    {/* Progress Bar */}
                    <div className="space-y-4 mt-6 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium">Step {currentStep} of {steps.length}</span>
                            <span className="text-sm text-gray-500">{Math.round((currentStep / steps.length) * 100)}% Complete</span>
                        </div>
                        <Progress value={(currentStep / steps.length) * 100} className="h-3" />
                    </div>

                    {/* Step Indicators - Mobile Friendly */}
                    <div className="mt-8 flex-shrink-0">
                        {/* Desktop Step Indicators */}
                        <div className="hidden lg:flex items-center justify-between">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center flex-1">
                                    <div className="flex items-center">
                                        <div
                                            className={cn(
                                                'flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-medium',
                                                currentStep >= step.id
                                                    ? 'border-blue-600 bg-blue-600 text-white'
                                                    : 'border-gray-300 bg-white text-gray-500'
                                            )}
                                        >
                                            {currentStep > step.id ? (
                                                <Check className="h-6 w-6" />
                                            ) : (
                                                step.id
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-base font-medium">{step.title}</p>
                                            <p className="text-sm text-gray-500">{step.description}</p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="flex-1 mx-6 h-0.5 bg-gray-300" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Mobile Step Indicators */}
                        <div className="lg:hidden">
                            <div className="flex items-center justify-center space-x-4">
                                {steps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium',
                                            currentStep >= step.id
                                                ? 'border-blue-600 bg-blue-600 text-white'
                                                : 'border-gray-300 bg-white text-gray-500'
                                        )}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-base font-medium">{steps[currentStep - 1].title}</p>
                                <p className="text-sm text-gray-500">{steps[currentStep - 1].description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 mt-8 overflow-y-auto">
                        <div className="pr-2">
                            {renderStepContent()}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t flex-shrink-0 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="flex items-center justify-center w-full sm:w-auto h-12 text-base"
                        >
                            <ChevronLeft className="h-5 w-5 mr-2" />
                            Previous
                        </Button>

                        {currentStep < steps.length ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!getStepValidation(currentStep)}
                                className="flex items-center justify-center w-full sm:w-auto h-12 text-base"
                            >
                                Next
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="flex items-center justify-center w-full sm:w-auto h-12 text-base"
                            >
                                {processing ? 'Submitting...' : 'Submit KYC'}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}