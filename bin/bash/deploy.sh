set -ev

if [[git branch | grep ^\* ==*"master"*]];
then
    firebase deploy --token ${FIREBASE_API_TOKEN} --only hosting;
    exit 0;
else
    
fi

exit 0;