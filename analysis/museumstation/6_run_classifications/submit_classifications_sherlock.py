#!/usr/bin/env python3

import argparse
import os
import ntpath
import time

from sbatch_utils import submit_job
# from config import *
import subprocess


def submit_job(wrap_cmd, job_name='sbatch', mail_type=None,
               mail_user=None, p='normal,hns', c=1, t=2, **kwargs):
    """submit_job: Wrapper to submit sbatch jobs to Slurm.

    :param wrap_cmd: command to execute in the job.
    :param job_name: name for the job.
    :param mail_type: mail upon success or fail.
    :param mail_user: user email.
    :param p: partitions to select from.
    :param c: Number of cores to use.
    :param t: Time to run the job for.
    :param **kwargs: Additional command-line arguments to sbatch.
    See https://www.sherlock.stanford.edu/docs/getting-started/submitting/
    """
    def _job_time(t):
        """_job_time: Converts time t to slurm time ('hh:mm:ss').

        :param t: a float representing # of hours for the job.
        """
        hrs = int(t // 1)
        mins = int(t * 60 % 60)
        secs = int(t * 3600 % 60)

        return f'{str(hrs).zfill(2)}:{str(mins).zfill(2)}:{str(secs).zfill(2)}'

    args = []
    args.extend(['-p', str(p)])
    args.extend(['-c', str(c)])
    args.extend(['-t', _job_time(t)])
    args.extend(['--job-name', job_name])
    if mail_type:
        args.extend(['--mail-type', mail_type])
    if mail_user:
        args.extend(['--mail-user', mail_user])

    for opt, optval in kwargs.items():
        args.extend(['--' + opt, optval])
    args.extend(['--wrap', wrap_cmd])

    p = subprocess.Popen(['sbatch'] + args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return p.communicate()


def run_classifications(image_ind):
    """ submits job to run LOO classifications, here on a single image index
    """

    cmd = 'python run_classification_sherlock.py'
    cmd += f' --image_ind={image_ind} '
    
    msg = submit_job(cmd, job_name=f'classification_test_{image_ind}', p='normal,hns', t=1.0, mem='2G')
    print(msg)

def wait_for_space(max_jobs):
    time.sleep(5) #Allow for squeue to refresh properly
    if queue_size() >= max_jobs:
        print('Waiting for space in queue...')
    while queue_size() >= max_jobs:
        time.sleep(600)

def queue_size():
    size = get_ipython().getoutput('squeue -u $USER')
    return len(size) - 1


## set batch parameters
start_ind = 0 # first value of first batch
end_ind = 2 # 

for image_ind in range(start_ind,end_ind):
    wait_for_space(15)
    run_classifications(image_ind)
