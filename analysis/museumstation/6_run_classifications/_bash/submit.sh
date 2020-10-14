#!/bin/bash
#SBATCH --array=0-99:10
#SBATCH -n 10
#SBATCH --time=00:05:00

for i in {0..9}; do
    srun -n 1 ./run_classifications_sherlock.py --test_ind=$((SLURM_ARRAY_TASK_ID+i)) &
done

wait 