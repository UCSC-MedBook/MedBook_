FROM medbook/meteor-base:v0.7
MAINTAINER Mike Risse

# Start Rscript install (pulled from https://github.com/rocker-org/rocker/blob/master/r-base/Dockerfile)

# libblas-dev and liblapack-dev: https://support.bioconductor.org/p/67326/
# might be able to remove libblas-dev and liblapack-dev after adding r-base-dev
RUN apt-get update \
    && apt-get install -y --force-yes --no-install-recommends \
        r-base \
        r-recommended \
	r-base-dev
#	libblas-dev \
#	liblapack-dev

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

# Install Java
RUN apt-get install -y --no-install-recommends openjdk-7-jdk
