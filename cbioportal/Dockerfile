# Dockerfile for cBioPortal
FROM elementolab/jamm:1.0
MAINTAINER Alexandros Sigaras <als2076@med.cornell.edu>
# NOTE: modified by Teo Fleming <mokolodi1@gmail.com>
#===========================#
# Clone cBioPortal			#
#===========================#
RUN git clone https://github.com/cBioPortal/cbioportal.git; \
	cd cbioportal ; git checkout v1.2.1; \
	echo "export PORTAL_HOME=/cbioportal" >> /root/.bash_profile;
#===========================#
# ADD Default Config		#
#===========================#
ADD cbioportal/config /default_config
RUN cp default_config/* /cbioportal/src/main/resources/; \
	source /root/.bash_profile; /bin/cp -u --force /default_config/context.xml $CATALINA_HOME/conf/context.xml;
#===========================#
# Build From Source			#
#===========================#
ADD cbioportal/build /cbio_build
RUN cp cbio_build/gene_sets.txt /cbioportal/core/src/main/resources/; \
	mkdir ~/.m2/; cp /cbio_build/settings.xml ~/.m2/; \
	source /root/.bash_profile; cd $PORTAL_HOME; mvn -DskipTests clean install
#===========================#
# ADD Scripts				#
#===========================#
ADD cbioportal/scripts /cbio_scripts
#===========================#
# Copy cBioPortal .war file	#
#===========================#
RUN source /root/.bash_profile; \
	cp $PORTAL_HOME/portal/target/cbioportal.war $CATALINA_HOME/webapps/
#===========================#
# Startup					#
#===========================#
CMD /bin/bash /cbio_scripts/entrypoint.sh;
#===========================================================================================#
