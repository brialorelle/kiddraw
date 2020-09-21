#!/usr/bin/env python3

import argparse
import os
import ntpath

from sbatch_utils import submit_job
from config import *
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
    """run_openpose: submit sbatch job to run Openpose on given video.

    :param vid_path: path to video file.
    :param op_output_dir: directory that will house Openpose output folders.
    :param face: outputs face keypoints (in addition to pose keypoints) if True.
    :param hand: outputs hand keypoints (in addition to pose keypoints) if True.
    :param overwrite: if True, overwrites existing openpose output folders.
    :param condense: if True, condenses openpose outputs into a single dataframe.
    :param **kwargs: additional command-line arguments to pass to Openpose
    (see https://github.com/CMU-Perceptual-Computing-Lab/openpose/blob/master/doc/demo_overview.md
    for complete documentation on command-line flags).

    Example usage:
    run_openpose('/path/to/myheadcamvid.mp4', '/path/to/output_dir',
                 keypoint_scale=3, frame_rotate=180)
    """
 
    # this could also be openpose_latest.sif, instead of openpose-latest.img.
    # openpose_binary_path = os.path.join(SINGULARITY_CACHEDIR, 'openpose_latest.sif')
    # cmd = f'singularity exec --nv {openpose_binary_path} bash -c \''
    # cmd += 'cd /openpose-master && ./build/examples/openpose/openpose.bin '
    cmd = 'python run_classification_sherlock.py'
    cmd += f' --image_ind={image_ind} '
    
    msg = submit_job(cmd, job_name=f'classification_test_{image_ind}', p='normal,hns', t=1.0, mem='2G')
    print(msg)

image_ind = 1
run_classifications(image_ind)