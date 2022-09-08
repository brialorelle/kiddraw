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

python extract_features.py --data='/data5/bria/stringent_cleaned_dataset/' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True --dataset='museumstation'



for i in {0..5}
    do
	echo 'extracting image features from layer ' $i
	python extract_features.py --data='/data5/bria/stringent_cleaned_dataset/' --layer_ind=$i --cohort='kid' --ext="png" --spatial_avg=True --dataset='museumstation'
    done


img_dir = '/data5/bria/kiddraw_datasets/animalgame/sketches'




## clip features
python extract_features_clip_devphotodraw.py --data='/home/bria/devphotodraw/data/object_drawings/' --cohort='kid' --ext="png"  --dataset='photodraw_compiled'

python extract_features_clip.py --data='/data5/bria/stringent_cleaned_dataset/'  --cohort='kid' --ext="png"  --dataset='museumstation'
