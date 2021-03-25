#!/bin/bash
DataList="a cow,an elephant,an apple,an ice cream,a horse,a snail,a bed,a book,a TV"

Field_Separator=$IFS

 
# set comma as internal field separator for the string list
IFS=,
for val in $DataList;
do
echo $val
python render_database_csvs.py --which_run='cdm_run_v6' --which_category=$val
done
 
IFS=$Field_Separator