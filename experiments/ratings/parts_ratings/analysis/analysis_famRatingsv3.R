
rm(list=ls())
knitr::opts_chunk$set(fig.width=8, fig.height=5, 
                      echo=TRUE, warning=FALSE, message=FALSE, cache=TRUE)
suppressPackageStartupMessages(c("dplyr","langcog","tidyr","ggplot2","lme4"))
#library(langcog)
library(dplyr)
library(ggplot2)
library(rjson)
library(stringr)
library(tidyr)


## load datafiles and put in a data frame
files <- dir("../production-results/")
d.raw <- data.frame()

for (f in files) {
  jf <- paste("../production-results/",f,sep="")
  jd <- fromJSON(paste(readLines(jf), collapse=""))
  id <- data.frame(workerid = jd$WorkerId, 
                   rating = as.numeric(jd$answers$data$rating),
                   childsAge = jd$answers$data$childsAge,
                   imageName = jd$answers$data$imageName)
  d.raw <- bind_rows(d.raw, id)
}

# function for shorter filename extraction
shortFileName <- function(fileName){
  out=strsplit(as.character(fileName),"/")[[1]][8]
}

# prettyify data: make shorter iamge names for plots, etc.
d.pretty <- d.raw %>%
  group_by(imageName) %>%
  mutate(imageNameShort = shortFileName(imageName))

# pre-process: get children's age and filter by too young/old
d.pretty <- d.pretty %>%
  group_by(childsAge) %>%
  mutate(ageShort = as.numeric(substr(childsAge,1,2)))  %>%
  filter(ageShort != 24)  %>%  #exclude older than 2 years
  filter(is.na(ageShort) == FALSE)  #exclude less than 1 year

# show violin plots for each object
p <- ggplot(d.pretty, aes(factor(imageNameShort), rating))
p + geom_violin()

# conclusions here (9 parents only): Som eour initial guesses seem on point, but game controllers
# are pretty familiar to parents. Need to get a better control - bike bells seem promising



