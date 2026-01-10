<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KycRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'identity_type' => 'required|in:aadhar,voter_id,passport,driving_license,other',
            'identity_number' => 'required|string|max:50',
            'identity_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'pan_card_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'pan_number' => 'nullable|string|size:10|regex:/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/',
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'area' => 'nullable|string|max:100',
            'full_address' => 'nullable|string|max:500',
            'pincode' => 'nullable|string|max:10|regex:/^[0-9]{6}$/',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other',
            'father_name' => 'nullable|string|max:100',
            'mother_name' => 'nullable|string|max:100',
            'occupation' => 'nullable|string|max:100',
            'annual_income' => 'nullable|numeric|min:0|max:99999999.99',
            'reason' => 'nullable|string|max:500',
        ];

        // Add unique validation for identity_number and pan_number
        if ($this->isMethod('post')) {
            $rules['identity_number'] .= '|unique:kyc,identity_number';
            $rules['pan_number'] .= '|unique:kyc,pan_number';
        } else {
            $kycId = $this->route('kyc') ? $this->route('kyc')->id : $this->route('id');
            $rules['identity_number'] .= '|unique:kyc,identity_number,' . $kycId;
            $rules['pan_number'] .= '|unique:kyc,pan_number,' . $kycId;
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'identity_type.required' => 'Identity type is required.',
            'identity_type.in' => 'Identity type must be aadhar, voter_id, passport, driving_license, or other.',
            'identity_number.required' => 'Identity number is required.',
            'identity_number.unique' => 'This identity number is already registered.',
            'identity_image.image' => 'Identity document must be an image.',
            'identity_image.mimes' => 'Identity document must be jpeg, png, or jpg format.',
            'identity_image.max' => 'Identity document size cannot exceed 2MB.',
            'pan_card_image.image' => 'PAN card must be an image.',
            'pan_card_image.mimes' => 'PAN card must be jpeg, png, or jpg format.',
            'pan_card_image.max' => 'PAN card size cannot exceed 2MB.',
            'pan_number.regex' => 'PAN number format is invalid. Example: ABCDE1234F',
            'pan_number.size' => 'PAN number must be exactly 10 characters.',
            'pan_number.unique' => 'This PAN number is already registered.',
            'pincode.regex' => 'Pincode must be 6 digits.',
            'date_of_birth.before' => 'Date of birth must be before today.',
            'gender.in' => 'Gender must be male, female, or other.',
            'annual_income.min' => 'Annual income cannot be negative.',
            'annual_income.max' => 'Annual income value is too large.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Custom validation for Aadhar number
            if ($this->identity_type === 'aadhar') {
                $aadhar = preg_replace('/\s+/', '', $this->identity_number);
                if (!preg_match('/^[0-9]{12}$/', $aadhar)) {
                    $validator->errors()->add('identity_number', 'Aadhar number must be 12 digits.');
                }
            }

            // Custom validation for Voter ID
            if ($this->identity_type === 'voter_id') {
                if (!preg_match('/^[A-Z]{3}[0-9]{7}$/', $this->identity_number)) {
                    $validator->errors()->add('identity_number', 'Voter ID format is invalid. Example: ABC1234567');
                }
            }
        });
    }
}
