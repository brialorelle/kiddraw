# kiddraw project
### Drawings as a window into developmental changes in object representations

Inspired by the availability of this large and public dataset containing drawings of various visual concepts (Google quickdraw-75: https://github.com/googlecreativelab/quickdraw-dataset), this project asks how the ability to express these visual concepts in drawings develops.

*To reproduce our CogSci 2018 submission:

1. Experiment code in Experiments/museumdraw. Other directories are in development.
--Needs to be spun via node.js on a server

2. Recognition rating code in experiments/ratings/recognition_ratings
--Recognizability ratings run on amazon mTurk
--Outputs preprocessed data for using in Rcode in writing/

3. Analysis/museumdraw/python:
Many scripts require access to GPUs to extract features from VGG-19 efficiently.

--render_quickdraw.ipynb: ##Code to render .pngs from QuickDraw database

--extract_all: ##Bash script to extract all vgg-19 features. 

--preprocess_musemdraw_e1.ipynb.ipynb  ##Pulls drawings from server, renders pngs, computes low-level covariates (drawing time, number of strokes, mean intensity), saves out

--analyze_features_museumdraw_cogsci_archive.ipynb ## Jupyter notebook that analyzes vgg-19 features from pool 1-5 and fc6/fc7. Creates layerwise and RDM figures for use in R code in kiddraw/writing. 

4. Writing:

--Contains R scripts for rendering entire CogSci paper; analyzes recognizability ratings from scratch. Imports outputs from  analyze_features_museumdraw_e1.ipunb
