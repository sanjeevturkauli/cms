<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class RedirectHandler extends Controller
{
    public function dashboard()
    {
        $redirect_uri = match (true) {
            auth()->user()->hasRole('admin') => 'admin.dashboard',
            auth()->user()->hasRole('team')  => 'team.dashboard',
            default                          => 'member.dashboard',
        };
        return redirect()->route($redirect_uri);
    }
}
