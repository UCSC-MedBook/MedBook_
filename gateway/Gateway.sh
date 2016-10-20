#!/bin/sh
## 
##  Redhat / Linux / LSB
##
# chkconfig:   345 85 15
# description: Startup script for Express / Node.js application with the \
##              forever module.
##
##  A modification of https://gist.github.com/1339289
##
## This is free software; you may redistribute it and/or modify
## it under the terms of the GNU General Public License as
## published by the Free Software Foundation; either version 2,
## or (at your option) any later version.
##
## This is distributed in the hope that it will be useful, but
## WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU General Public License for more details.
##

# Source function library.
. /etc/init.d/functions

################################################################################
################################################################################
##                                                                            ##
#                           APPLICATION section                                #
##             Edit the variables below for your installation                 ##
################################################################################
################################################################################

DESC="Gateway"
NAME="Gateway.js"
DIR="/data/MedBook"
APP=${DIR}/${DESC}/${NAME}
LOGDIR=${DIR}/${DESC}/logs
LOCKFILE=`basename $0 .sh`
CONFIG=${DIR}/${DESC}/config.toml

export NODE_ENV=${NODE_ENV:="production"}


################################################################################
################################################################################
##                                                                            ##
#                       PATHs section                                          #
##                                                                            ##
################################################################################
################################################################################


export PATH=$HOME/local/bin:${PATH:=}
export MANPATH=$HOME/local/man:${MANPATH:=}
export LD_LIBRARY_PATH=$HOME/local/lib:${LD_LIBRARY_PATH:=}

export PATH=/usr/local/bin:${PATH:=}
export MANPATH=/usr/local/man:${MANPATH:=}
export LD_LIBRARY_PATH=/usr/local/lib:${LD_LIBRARY_PATH:=}


################################################################################
################################################################################
##                                                                            ##
#                       FOREVER section                                        #
##                                                                            ##
################################################################################
################################################################################


running() {
    forever list 2>/dev/null | grep ${APP} 2>&1 
    return $?
}

start_server() {
        # forever ${APP} ${CONFIG} 
        forever start -a -l ${LOGDIR}/log -e ${LOGDIR}/err -o ${LOGDIR}/out ${APP} ${CONFIG}
	return $?
}

stop_server() {
	forever stop ${APP} 2>&1 >/dev/null
	return $?
}

################################################################################
################################################################################
##                                                                            ##
#                       GENERIC section                                        #
##                                                                            ##
################################################################################
################################################################################



DIETIME=10              # Time to wait for the server to die, in seconds
                        # If this value is set too low you might not
                        # let some servers to die gracefully and
                        # 'restart' will not work

STARTTIME=2             # Time to wait for the server to start, in seconds
                        # If this value is set each time the server is
                        # started (on start or restart) the script will
                        # stall to try to determine if it is running
                        # If it is not set and the server takes time
                        # to setup a pid file the log message might
                        # be a false positive (says it did not start
                        # when it actually did)

# Console logging.
log() {
  local STRING mode

  STRING=$1
  arg2=$2
  mode="${arg2:=success}"
  
  echo -n "$STRING "
  if [ "${RHGB_STARTED:-}" != "" -a -w /etc/rhgb/temp/rhgb-console ]; then
    echo -n "$STRING " > /etc/rhgb/temp/rhgb-console
  fi
  if [ "$mode" = "success" ]; then
    success $"$STRING"
  else
    failure $"$STRING"
  fi
  echo
  if [ "${RHGB_STARTED:-}" != "" -a -w /etc/rhgb/temp/rhgb-console ]; then
    if [ "$mode" = "success" ]; then
      echo_success > /etc/rhgb/temp/rhgb-console
    else
      echo_failure > /etc/rhgb/temp/rhgb-console
      [ -x /usr/bin/rhgb-client ] && /usr/bin/rhgb-client --details=yes
    fi
    echo > /etc/rhgb/temp/rhgb-console
  fi
}

# Starts the server.
do_start() {
  # Check if it's running first
  if running ;  then
    log "$DESC $NAME already running"
    exit 0
  fi
  action "Starting $DESC $NAME" start_server
  RETVAL=$?
  if [ $RETVAL -eq 0 ]; then
    # NOTE: Some servers might die some time after they start,
    # this code will detect this issue if STARTTIME is set
    # to a reasonable value
    [ -n "$STARTTIME" ] && sleep $STARTTIME # Wait some time
    if  running ;  then
      # It's ok, the server started and is running
      log "$DESC $NAME started"
      touch /var/lock/subsys/$LOCKFILE
      RETVAL=0
    else
      # It is not running after we did start
      log "$DESC $NAME died on startup" "failure"
      RETVAL=1
    fi
  fi
  return $RETVAL
}

# Stops the server.
do_stop() {
  if running ; then
    # Only stop the server if we see it running
    action "Stopping $DESC $NAME" stop_server
    RETVAL=$?
    [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/$LOCKFILE
  else
    # If it's not running don't do anything
    log "$DESC $NAME not running"
    RETVAL=0
  fi
  return $RETVAL
}

case "$1" in
  start)
    do_start
    RETVAL=$?
    ;;
  stop)
    do_stop
    RETVAL=$?
    ;;
  restart)
    do_stop
    RETVAL=$?
    if [ $RETVAL -eq 0 ]; then
      # Wait some sensible amount, some server need this
      [ -n "$DIETIME" ] && sleep $DIETIME
      do_start
      RETVAL=$?
    fi
    ;;
  status)
    if running ;  then
      log "$DESC $NAME running"
    else
      log "$DESC $NAME not running"
    fi
    RETVAL=0
    ;;
  *)
    echo "Usage: ${0} {start|stop|status|restart}"
    RETVAL=1
    ;;
esac

exit $RETVAL
