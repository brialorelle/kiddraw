################################################################################
## USEFUL.R
## a variety of useful libraries and commands
## mcf 6/13 etc.
################################################################################

library(ggplot2)
#library(bootstrap)
library(lme4)
library(stringr)
library(reshape2)
library(plyr)
library(dplyr)

## add some style elements for ggplot2
theme_set(theme_bw())

## standard error of the mean
sem <- function (x) {
  sd(x,na.rm=TRUE) / sqrt(length(x))
}

## standard error of the mean
se <- function(x) {
  y <- x[!is.na(x)] # remove the missing values, if any
  sqrt(var(as.vector(y))/length(y))
}

## NA functions
na.mean <- function(x) {mean(x,na.rm=T)}
na.sum <- function(x) {sum(x,na.rm=T)}

## convert to number
to.n <- function(x) {
  as.numeric(as.character(x))
}

## inverse logistic
inv.logit <- function (x) {
  exp(x) / (1 + exp(x)) 
}

## number of unique subs
n.unique <- function (x) {
  length(unique(x))
}

## for bootstrapping 95% confidence intervals
theta <- function(x,xdata,na.rm=T) {mean(xdata[x],na.rm=na.rm)}
ci.low <- function(x,na.rm=T) {
  mean(x,na.rm=na.rm) - quantile(bootstrap(1:length(x),1000,theta,x,na.rm=na.rm)$thetastar,.025,na.rm=na.rm)}
ci.high <- function(x,na.rm=T) {
  quantile(bootstrap(1:length(x),1000,theta,x,na.rm=na.rm)$thetastar,.975,na.rm=na.rm) - mean(x,na.rm=na.rm)}

## for basic plots, add linear models with correlations
lm.txt <- function (p1,p2,x=7.5,yoff=.05,lt=2,c="black",data=data)
{
  l <- lm(p2 ~ p1)
  regLine(l,lty=lt,col=c)
  cl <- coef(l)
  text(x,cl[1] + cl[2] * x + yoff,
       paste("r = ",sprintf("%2.2f",sqrt(summary(l)$r.squared)),
             getstars(anova(l)$"Pr(>F)"[1]),sep=""),
       xpd="n")
}

## get stars for significance testing
getstars <- function(x) {
  if (x > .1) {return("")}
  if (x < .001) {return("***")}
  if (x < .01) {return("**")}
  if (x < .05) {return("*")}
}
