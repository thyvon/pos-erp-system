<?php

namespace App\Jobs\Foundation;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendUserInviteJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function handle(): void
    {
        $roles = $this->user->getRoleNames()->implode(', ');
        $fullName = trim($this->user->first_name.' '.$this->user->last_name);
        $subject = config('app.name').' account invitation';
        $message = "Hello {$fullName}, your account has been created for ".config('app.name').". Assigned role: {$roles}.";

        Mail::raw($message, function ($mail) use ($subject): void {
            $mail->to($this->user->email)->subject($subject);
        });
    }
}
