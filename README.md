# kiddraw

Inspired by the availability of this large and public dataset containing drawings of various visual concepts (Google quickdraw-75: https://github.com/googlecreativelab/quickdraw-dataset), this project asks how the ability to express these visual concepts in drawings develops.

*To reproduce our CogSci 2018 submission:

1. Experiment code in experiments/museumdraw
--Needs to be spun via node.js on a server

2. Rating code in experiments/ratings/recognition_ratings
--Recognizability ratings run on amazon mTurk
--Outputs preprocessed data for using in Rcode in writing/

3. Analysis/museumdraw/python:
Scripts require access to GPUs to extract features from VGG-19.

--render_quickdraw.ipynb: ##Code to render .pngs from QuickDraw database

--extract_all: ##Bash script to extract all vgg-19 features. 

--preprocess_musemdraw_e1.ipynb.ipynb  ##Pulls drawings from server, renders pngs, computes low-level covariates (drawing time, number of strokes, mean intensity)

--analyze_features_museumdraw_e1.ipynb ## Jupyter notebook that analyzes of vgg-19 features -- figures for use in R code in kiddraw/writing. 

4. Writing:

--Contains R scripts for rendering entire CogSci paper; analyzes recognizability ratings from scratch. Imports outputs from  analyze_features_museumdraw_e1.ipunb