<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SchedulePredictions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'predictions:schedule';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Continuously process field predictions every 5 seconds';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting continuous prediction processing...');
        $this->info('Press Ctrl+C to stop');

        while (true) {
            try {
                $this->call('predictions:process');
                
                // Wait 5 seconds before next run
                sleep(5);
                
            } catch (\Exception $e) {
                $this->error('Error: ' . $e->getMessage());
                sleep(5); // Wait before retrying
            }
        }
    }
}
