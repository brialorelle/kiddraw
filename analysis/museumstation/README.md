
The following folder contains analysis scripts related to the main paper in the order they were conducted.


### 1_get_sketches
render_all_sketches_by_run.py grabs all of the sketches from the mongodb database and renders them local
raw_drawing_counts.txt contains drawing counts pre-filtering by each run

### Selectt for filtering
step1_preprocess_sketches.Rmd
Gets sketches (and tracings) after initial manual filtering steps and renders them out 

### 2a_create_filtering_dbs
Creates monogdb databases needed for filtering experiments (see github.com/cogtoolslab/gallerize)

### 3_filtering_HITs
step1_count_invalid_drawings_from_mturk.ipynb: Gets outputs from mongodb databases marked by filtering HIT </br>
step2_render_invalid_drawings.Rmd: renders out both invalid drawings in "data folder </br>
step3_render_full_dataset.Rmd: compiles and renders out the full dataset </br>

### 4_extract_features
Scripts for extracting VGG-19 features for all sketches. Requires a GPU; run on a computing cluster. </br>
extract_all_images.sh -- bash scripts for launching extraction, calls extract_features.py which sources embedding.py </br>
Uses pretrained VGG-19 model in pytorch </br> 

### 5_feature_space_analyses
Contains python scripts for feature space analyses that did not end up making it into the submitted manuscript.

### 6_run_classifications 
setup.sh: setups conda enviornment necessary for running classifications on sherlock (stanford computing cluster)  </br>
kiddraw.yml is the yml file with all of the necessary libraries  </br>
submit_classifications_sherlock.py calls run_classification_sherlock.py, and sources sbatch_utils.py for submitting jobs  </br>
count_classification_outputs.Rmd compiles all of the classification outputs from the different cross-validation subsets. 

### 7_main_analyses
Contains Rmarkdown scripts for analyzing the outputs of the classifications on the data

### 8_render_sketch_examples
Contains code for rendering sketch examplse according to different parameters	

### usage_stats
Contains code used to check on how frequently the museumstation was being used
