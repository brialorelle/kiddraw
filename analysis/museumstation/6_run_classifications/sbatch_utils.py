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
