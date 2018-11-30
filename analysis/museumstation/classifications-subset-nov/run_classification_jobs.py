import pandas as pd
import numpy as np
import os
import thread
import analysis_helpers as h

'''
This script get_all_model_predictions.py is a wrapper around generate_model_predictions.py
to generate csv files that summarize key statistics of interest (e.g., target rank, cost)
from model predictions, for each model and data split.

It will spawn several threads to get predictions from all splits and models.
'''

if __name__ == "__main__":

	split_types = ['balancedavg1','balancedavg2','balancedavg3','balancedavg4','balancedavg5'] 
        model_space = ['multimodal_conv42_combined_cost']
	# model_space = ['human_combined_cost',
	# 	       'human_S0_cost',
	# 	       'human_combined_nocost',
	#                'multimodal_fc6_combined_cost',
	#                'multimodal_fc6_S0_cost',
	#                'multimodal_fc6_combined_nocost',
	#                'multimodal_conv42_combined_cost',
	#                'multimodal_pool1_combined_cost']

        
	print 'Now running ...'
	for model in model_space:
	    for split_type in split_types:	 
	    	cmd_string = 'python generate_model_predictions.py --split_type {} --model {}'.format(split_type,model)
	    	print cmd_string
	    	thread.start_new_thread(os.system,(cmd_string,))             