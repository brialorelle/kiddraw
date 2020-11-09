
The following folder contains data related to the kiddraw project in various forms;


# Drawing data
## Dataset subsets
All raw drawings (png files) are stored in "drawings" and organized by "run", which is the version of the game at the museumstation at a certain time.
The first two runs were considered pilots (we changed several aspects of the experimental interface); versions v3-v7 are inlcuded in the final dataset. v8 only
ran for less than a month before covid-19 closed the museum and is thus not included.
</br>
Within each "run" folder there are several subfolders where drawings are saved out according to different criterion: 
</br>
sketches_full_dataset: all sketches from this run </br>
sketches_descriptives: descriptives (see below) for all drawings </br>
sketches_subsets_inspection: subsets of drawings rendered out that might be invalid (i.e. many strokes)
called_invalid_once: marked invalid one time by a worker in a filtering task </br>
called_invalid_twice: marked invalid two times by worker in a filtering task </br>
filtered_dataset: dataset without invalid drawings  </br>
filtered_dataset_descriptives: descriptives for this subset of drawings  </br>
</br>
## Dataset versions
At the top level, there are also versions of the datasets for (1) cogsci-2019 anlayses and (2) the main drawing anlayses, and (3) the recogniton games.  paper.
</br>
stringent_cleaned_dataset: this is the MAIN dataset used in the paper (combining results from cdm_run_v3-v7)
stringent_cleaned_dataset_meta: all metadata associated with this 
</br>
All drawings from the cogci-2019 anlayses are incldued in the main paper. The stringent_cleaned_dataset is the cogsci-2019 drawings and the filtered_datasets form the runs detailed abvoe. 
</br>
Drawings_recoggames are the drawings that were selected for the recognition experiments, and are organized by version. The "sorted" folder contains the same drawings are simply resaved with their distinctiveness index appended to the filename.

## Drawing dataset filtering
### filtering_outputs
Filtering outputs contains csvs for the four main experiment runs: </br>
1. images_checked_cdm_run_v(N): csvs that document which images were seen </br>
2. marked_invalid_drawings_cdm_run_v(N): csvs that document which images were marked invalid and by whom (anon worker id) </br>
3. invalid_drawings_from_prolific_cdm_run_v(N): txt file with only the invalid filenames </br>

### images_to_exclude
Includes txt files compiled from the first author manually looking at subsets of drawings for various reasons. These were used to filter the dataset.

# Analysis outputs
classification_outputs: logistic regression outputs for the main analyses with different parameters  </br>
cnn-features: vgg-19 features and metadata for all drawings  </br>
compiled_classifications: compiled classificaitons (merged across cross-validation subsets)   </br>
feature_space_metrics: not currently used; archived in favor of classificaiton interpretations.  </br>

# Surveys
Raw and preprocessed data for surveys on how often these categories were drawn/seen, respectively. Surveys were implemented in Qualtrics.


# Tracing data
Tracing outputs for all of the participants included in the main dataset,  see
https://github.com/Renata1995/visuomotor_model_in_drawing

# Recognition data
Behavioral data contains trial-wise data for each of the four games that were run. <br>
Model classifications contains image-wise data for all of the images presented at the museumstation



