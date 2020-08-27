#!/bin/bash
for i in {0..6}
    do
	echo 'extracting image features from layer ' $i
	python extract_features.py --data='/data2/jefan/imagenet_kiddraw' --layer_ind=$i --cohort='images' --ext="jpg" --spatial_avg=False
    done

python extract_features.py --data='/home/bria/imagenet_kiddraw_test' --layer_ind=6 --cohort='images' --ext="jpg" --spatial_avg=False