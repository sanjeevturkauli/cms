<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'log_name',
        'description',
        'subject_id',
        'subject_type',
        'causer_id',
        'causer_type',
        'properties',
        'event',
    ];

    protected $casts = [
        'properties' => 'array',
    ];

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function causer(): MorphTo
    {
        return $this->morphTo();
    }

    public static function log(string $logName): ActivityLogBuilder
    {
        return new ActivityLogBuilder($logName);
    }

    public function getExtraProperty(string $propertyName, $defaultValue = null)
    {
        return data_get($this->properties, $propertyName, $defaultValue);
    }
}

class ActivityLogBuilder
{
    protected string $logName;
    protected ?string $description = null;
    protected $subject = null;
    protected $causer = null;
    protected array $properties = [];
    protected ?string $event = null;

    public function __construct(string $logName)
    {
        $this->logName = $logName;
    }

    public function performedOn($subject): self
    {
        $this->subject = $subject;
        return $this;
    }

    public function causedBy($causer): self
    {
        $this->causer = $causer;
        return $this;
    }

    public function withProperties(array $properties): self
    {
        $this->properties = $properties;
        return $this;
    }

    public function event(string $event): self
    {
        $this->event = $event;
        return $this;
    }

    public function log(string $description): ActivityLog
    {
        $this->description = $description;

        return ActivityLog::create([
            'log_name' => $this->logName,
            'description' => $this->description,
            'subject_id' => $this->subject?->id,
            'subject_type' => $this->subject ? get_class($this->subject) : null,
            'causer_id' => $this->causer?->id,
            'causer_type' => $this->causer ? get_class($this->causer) : null,
            'properties' => $this->properties,
            'event' => $this->event,
        ]);
    }
}