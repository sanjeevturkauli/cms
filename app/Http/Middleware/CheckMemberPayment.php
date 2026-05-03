<?php

namespace App\Http\Middleware;

use App\Models\Member;
use App\Models\MemberPayment;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMemberPayment
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->hasRole('member')) {
            return $next($request);
        }

        $members = Member::where('user_id', $user->id)->with('team.teamInfo')->get();
        $paymentStatus = [];

        foreach ($members as $member) {
            $teamInfo = $member->team?->teamInfo;
            if (!$teamInfo || !$teamInfo->monthly_amount || $teamInfo->monthly_amount <= 0) {
                continue;
            }

            $monthlyAmount = (float) $teamInfo->monthly_amount;

            // Generate payment records if not exist
            MemberPayment::generateForMember($member, $monthlyAmount);

            $now = Carbon::now();
            $currentPayment = MemberPayment::getCurrentMonthStatus($member->id);
            $nextDue = MemberPayment::getNextDue($member->id);

            if ($currentPayment && $currentPayment->status === 'paid') {
                // Current month is PAID — check if next payment is upcoming
                $nextMonthDue = Carbon::createFromDate($now->year, $now->month, 1)->addMonth();
                $daysUntilNext = $now->diffInDays($nextMonthDue, false);

                // Show upcoming banner if next payment is within 10 days
                if ($daysUntilNext <= 10 && $daysUntilNext >= 6) {
                    $paymentStatus[] = [
                        'type'        => 'upcoming',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $nextMonthDue->format('F Y'),
                        'due_date'    => $nextMonthDue->format('d M, Y'),
                        'days_left'   => $daysUntilNext,
                        'payment_id'  => null,
                        'status'      => 'upcoming',
                        'is_overdue'  => false,
                    ];
                }
                // Don't show cleared banner
            } elseif ($currentPayment && $currentPayment->status !== 'paid') {
                // Current month NOT paid
                $daysUntilDue = $now->diffInDays($currentPayment->due_date, false);
                $isOverdue = $currentPayment->due_date->isPast();

                if ($isOverdue) {
                    // Overdue: due date has passed
                    $paymentStatus[] = [
                        'type'        => 'overdue',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $currentPayment->month_label,
                        'due_date'    => $currentPayment->due_date->format('d M, Y'),
                        'days_left'   => abs((int)$daysUntilDue),
                        'payment_id'  => $currentPayment->id,
                        'status'      => 'overdue',
                        'is_overdue'  => true,
                    ];
                } elseif ($daysUntilDue <= 5) {
                    // Due: within 5 days of due date
                    $paymentStatus[] = [
                        'type'        => 'due',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $currentPayment->month_label,
                        'due_date'    => $currentPayment->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilDue,
                        'payment_id'  => $currentPayment->id,
                        'status'      => 'pending',
                        'is_overdue'  => false,
                    ];
                } elseif ($daysUntilDue <= 10) {
                    // Upcoming: 6-10 days before due date
                    $paymentStatus[] = [
                        'type'        => 'upcoming',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $currentPayment->month_label,
                        'due_date'    => $currentPayment->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilDue,
                        'payment_id'  => $currentPayment->id,
                        'status'      => 'upcoming',
                        'is_overdue'  => false,
                    ];
                }
                // Don't show banner if more than 10 days away
            } elseif ($nextDue) {
                // No current month record but next due exists
                $daysUntilNext = $now->diffInDays($nextDue->due_date, false);
                $isOverdue = $nextDue->due_date->isPast();

                if ($isOverdue) {
                    $paymentStatus[] = [
                        'type'        => 'overdue',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $nextDue->month_label,
                        'due_date'    => $nextDue->due_date->format('d M, Y'),
                        'days_left'   => abs((int)$daysUntilNext),
                        'payment_id'  => $nextDue->id,
                        'status'      => 'overdue',
                        'is_overdue'  => true,
                    ];
                } elseif ($daysUntilNext <= 5) {
                    $paymentStatus[] = [
                        'type'        => 'due',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $nextDue->month_label,
                        'due_date'    => $nextDue->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilNext,
                        'payment_id'  => $nextDue->id,
                        'status'      => 'pending',
                        'is_overdue'  => false,
                    ];
                } elseif ($daysUntilNext <= 10) {
                    $paymentStatus[] = [
                        'type'        => 'upcoming',
                        'member_id'   => $member->id,
                        'team_id'     => $member->team_id,
                        'team_name'   => $member->team->name,
                        'amount'      => $monthlyAmount,
                        'month_label' => $nextDue->month_label,
                        'due_date'    => $nextDue->due_date->format('d M, Y'),
                        'days_left'   => (int)$daysUntilNext,
                        'payment_id'  => $nextDue->id,
                        'status'      => 'upcoming',
                        'is_overdue'  => false,
                    ];
                }
            }
        }

        if (!empty($paymentStatus)) {
            \Inertia\Inertia::share('memberPaymentStatus', $paymentStatus);
        }

        return $next($request);
    }
}