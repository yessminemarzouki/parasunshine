<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect(config('app.frontend_url'));
});
Route::redirect('/login', '/admin/login')->name('login');
