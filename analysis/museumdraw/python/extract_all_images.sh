#!/bin/bash
for i in {0..6}
    do
	echo 'extracting image features from layer ' $i
	python extract_features.py --data='/data2/jefan/imagenet_kiddraw' --layer_ind=$i --cohort='images' --ext="jpg"
    done

