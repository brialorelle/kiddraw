#!/bin/bash

python extract_features.py --data='/data3/bria/kiddraw_datasets/photodraw2_020519/' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True --dataset='photodraw2_020519'

python extract_features.py --data='/data3/bria/kiddraw_datasets/photodraw2_030719/' --layer_ind=6 --cohort='kid' --ext="png" --spatial_avg=True --dataset='photodraw2_030719'