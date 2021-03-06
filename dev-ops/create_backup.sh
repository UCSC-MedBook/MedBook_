#! /bin/bash

# This script creates a backup in the form of a .tgz file containing a
# mongodump and a copy of the filestore folder. The script then sends the
# backup script to the backup ceph container for safekeeping and
# easy retrieval.
#
#
# Usage: ./create_backup.sh
#
# When setting up the cron command, be aware of the path to your git checkout!
# Also ensure that the aws command is in cron's PATH as well as yours.
# Example cron commands:
# At 3:30 am create a backup and send the logs to /var/log/cron
# 30 3 * * * /home/ubuntu/MedBook/scripts/create_backup.sh > /home/ubuntu/backup_logs.txt 2>&1
# 30 3 * * * cd /backup && /home/ubuntu/MedBook_/dev-ops/create_backup.sh >> /backup/backup_logs.txt 2>&1


# create folder and go to it
date=`date +%Y-%m-%d_%H-%M-%S`
backup_name="./backup.$HOSTNAME.$date"
echo "creating backup" $backup_name

mkdir $backup_name
cd $backup_name

# dump the database
# for prod on openstack, $HOSTNAME=medbook
mongo_host="localhost"
if [ $HOSTNAME = "medbook-prod" ] ; then
  mongo_host="mongo"
elif [ $HOSTNAME = "medbook-prod-2" ] ; then
  mongo_host="mongo"
elif [ $HOSTNAME = "medbook-staging-2" ] ; then
  mongo_host="mongo-staging"
fi

mongodump -d MedBook --host $mongo_host

# create a copy of the filestore
# note that if /filestore is a symlink it will copy the symlink itself,
# not the dir the symlink points to.
echo "copying filestore..."
cp -r /filestore .

# get out of the folder
cd ..

# tgz the backup to send it to the backup box
# include h to archive any symbolic links
echo "creating tarball..."
tar zcvfh $backup_name.tgz $backup_name

# If we're on the latest prod (medbook), upload to ceph.
# Alternatively: send the backup to the backup box
if [ $HOSTNAME = "medbook" ] ; then
  # Upload the backup to ceph.
  echo "Copying backup to ceph..."
  aws s3 cp --profile ceph --endpoint http://ceph-gw-01.pod $backup_name.tgz s3://medbook
else
  echo "rsync to the backup server..."
  rsync $backup_name.tgz ubuntu@backup.medbook.io:/backups
fi

# Delete the local backup
echo "deleting local backup..."
rm -rf $backup_name
rm -rf $backup_name.tgz

# if backing up from the old azure production, restore to staging
# Not currently active
if [ $HOSTNAME = "medbook-prod-2" ] ; then
  echo "restoring on staging..."

  # call the restore script remotely from production
  # NOTE: this will fail if /mnt/ubuntu hasn't been set up on staging:
  # sudo mkdir /mnt/ubuntu && sudo chown ubuntu /mnt/ubuntu
  ssh ubuntu@staging-3.medbook.io "cd /mnt/ubuntu && /home/ubuntu/MedBook_/dev-ops/restore_from_backup.sh $backup_name"

  # check if there were errors restoring
  if [ $? -ne 0 ] ; then
    echo "FAILED TO RESTORE ON STAGING"
    exit 1
  fi
fi

echo "done!"
