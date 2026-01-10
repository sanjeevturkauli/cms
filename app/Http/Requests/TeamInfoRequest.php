<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TeamInfoRequest extends FormRequest
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
        return [
            'team_id' => 'required|exists:teams,id',
            'plan' => 'nullable|in:basic,premium,enterprise',
            'duration_months' => 'nullable|integer|min:1|max:120',
            'plan_start_date' => 'nullable|date',
            'plan_end_date' => 'nullable|date|after:plan_start_date',
            'total_member_limit' => 'integer|min:1|max:1000',
            'monthly_amount' => 'nullable|numeric|min:0|max:999999.99',
            'total_amount' => 'nullable|numeric|min:0|max:999999.99',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:1000',
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'area' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10|regex:/^[0-9]{6}$/',
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|in:committee,group,organization',
            'settings' => 'nullable|array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'team_id.required' => 'Team is required.',
            'team_id.exists' => 'Selected team does not exist.',
            'plan.in' => 'Plan must be basic, premium, or enterprise.',
            'duration_months.min' => 'Duration must be at least 1 month.',
            'duration_months.max' => 'Duration cannot exceed 120 months.',
            'plan_end_date.after' => 'Plan end date must be after start date.',
            'total_member_limit.min' => 'Member limit must be at least 1.',
            'total_member_limit.max' => 'Member limit cannot exceed 1000.',
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
            'pincode.regex' => 'Pincode must be 6 digits.',
            'category.in' => 'Category must be committee, group, or organization.',
        ];
    }
}
