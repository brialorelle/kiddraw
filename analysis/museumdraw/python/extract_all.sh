#!/bin/bash
for i in {0..6}
    do
	echo 'extracting kid features from layer ' $i
	python extract_features.py --layer_ind=$i
	echo 'extracting adult features from layer ' $i
	python extract_features.py --data='/data2/jefan/quickDraw/png_mini' --layer_ind=$i --cohort='adult'
    done
