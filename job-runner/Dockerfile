FROM medbook/meteor-base:meteor1.3_v1.0.1
MAINTAINER Mike Risse

# Builds job-runner on meteor 1.3.
# See medbook/meteor-base for a number of ONBUILD instructions which happen here

# Start Rscript install (pulled from https://github.com/rocker-org/rocker/blob/master/r-base/Dockerfile)

RUN apt-get update \
    && apt-get install -y --force-yes --no-install-recommends \
        r-base \
        r-recommended \
	      r-base-dev

# End Rscript install

# Install Limma R package requirements
RUN Rscript -e 'source("http://bioconductor.org/biocLite.R")' \
    -e 'biocLite("edgeR")'

# Install python requirements
RUN apt-get install -y --force-yes --no-install-recommends \
    python-pip \
    python-dev \
    build-essential
RUN easy_install pip
RUN pip install --upgrade virtualenv
RUN pip install pymongo

# For expression and variance filters
RUN pip install numpy

# needed in the outlier analysis
RUN apt-get install -y bc

# Install Java
RUN apt-get install -y --no-install-recommends openjdk-7-jdk

# copy in necessary tools
# NOTE: relative to path when docker-compose is called
COPY tools /tools
