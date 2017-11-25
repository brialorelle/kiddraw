
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
library(lme4)

## load datafiles and put in a data frame
files <- dir("../production-results/")
d.raw <- data.frame()

# function for shorter filename extraction
getCategory <- function(fileName){
  out=strsplit(as.character(fileName),"/")[[1]][8]
}

imageNameShort <- function(fileName){
  out=strsplit(as.character(fileName),"/")[[1]][9]
}

getAge <- function(imageNameShort){
  out=as.numeric(strsplit(imageNameShort,"_")[[1]][3])
}

getSessionId <- function(imageNameShort){
  out=(strsplit(imageNameShort,"_")[[1]][5])
}


for (f in files) {
  jf <- paste("../production-results/",f,sep="")
  jd <- fromJSON(paste(readLines(jf), collapse=""))
  id <- data.frame(workerid = jd$WorkerId, 
                   rating = jd$answers$data$rating,
                   imageName = jd$answers$data$imageName)
  d.raw <- bind_rows(d.raw, id)
}

## get rid of weird characters where filename had spaces
d.raw$imageName <- str_replace_all(d.raw$imageName,"%20"," ")

# prettify data: make shorter iamge names for plots, etc.
d.pretty <- d.raw %>%
  group_by(imageName) %>%
  mutate(category = getCategory(imageName)) %>%
  mutate(imNameShort = imageNameShort(imageName)) %>%
  mutate(age = getAge(imNameShort)) %>%
  mutate(sessionId = getSessionId(imNameShort)) %>%
  mutate(correct = (rating == category))

write.table(d.pretty, "recognitionData.csv", sep=",")


