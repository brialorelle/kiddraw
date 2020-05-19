#!/bin/bash
for i in {0..6}
    do
	echo 'extracting image features from layer ' $i
	python extract_features.py --data='/data2/jefan/imagenet_kiddraw' --layer_ind=$i --cohort='images' --ext="jpg" --spatial_avg=False
    done

python extract_features.py --data='/home/bria/kiddraw/data/museumstation_sketches/' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True


for i in {0..6}
    do
	echo 'extracting image features from layer ' $i
	python extract_features.py --data='/data5/bria/kiddraw_datasets/rendered_111918/' --layer_ind=$i --cohort='images' --ext="jpg" --spatial_avg=False
    done

python extract_features.py --data='/data5/bria/kiddraw_datasets/rendered_111918/' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True --dataset='rendered_111918'


python extract_features.py --data='/data5/bria/kiddraw_datasets/recoggames_datasets/biganimalgame/sketches' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True --dataset='biganimalgame'

python extract_features.py --data='/data5/bria/kiddraw_datasets/recoggames_datasets/objectgame/sketches' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True --dataset='objectgame'