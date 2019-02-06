import time
import numpy as np
import os

## set batch parameters
images_per_batch = 50 # size of batch
start_ind = 0 # first value of first batch
end_ind = 200 # first value of last batch
start_inds = range(start_ind,end_ind,images_per_batch)
end_inds   = range(start_ind + images_per_batch,end_ind + images_per_batch,images_per_batch)

## set how often we're going to spawn jobs
interval_time_minutes = 10
interval_time = 60*interval_time_minutes

##
count_iter = 0
while (count_iter < np.size(start_inds)):
	
	start_time = time.time()
	this_start_ind = start_inds[count_iter]
	this_end_ind = end_inds[count_iter]
	#
	cmd_string = 'python run_classifcations_multiprocess.py --start_ind={} --end_ind={} '.format(this_start_ind, this_end_ind)
	sleep_interval = (interval_time - ((time.time() - start_time) % interval_time))
	print cmd_string, sleep_interval
	# os.system(cmd_string)
	count_iter = count_iter + 1
  	time.sleep(sleep_interval)
  	