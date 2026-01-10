<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('member/dashboard');
    }
}
